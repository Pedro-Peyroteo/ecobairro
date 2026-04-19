import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { RedisService } from '../redis/redis.service';
import type { NotificacaoJob } from '../queues/queues.types';

const UNREAD_KEY = (id: string) => `notif:unread:${id}`;
const UNREAD_TTL = 5 * 60; // 5 min (RF-NF2)

@Injectable()
export class NotificacoesService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(RedisService) private readonly redis: RedisService,
  ) {}

  async listMine(
    cidadaoId: string,
  ): Promise<Array<{ id: string; tipo: string; titulo: string; corpo: string; lida: boolean; criado_em: string }>> {
    const items = await this.prisma.notificacao.findMany({
      where: { cidadaoId },
      orderBy: { criadoEm: 'desc' },
      take: 50,
      select: { id: true, tipo: true, titulo: true, corpo: true, lida: true, criadoEm: true },
    });

    return items.map((n) => ({
      id: n.id,
      tipo: n.tipo,
      titulo: n.titulo,
      corpo: n.corpo,
      lida: n.lida,
      criado_em: n.criadoEm.toISOString(),
    }));
  }

  async getUnreadCount(cidadaoId: string): Promise<{ count: number }> {
    const client = this.redis.getClient();
    const cached = await client.get(UNREAD_KEY(cidadaoId));

    if (cached !== null) {
      return { count: parseInt(cached, 10) };
    }

    const count = await this.prisma.notificacao.count({
      where: { cidadaoId, lida: false },
    });

    await client.set(UNREAD_KEY(cidadaoId), String(count), 'EX', UNREAD_TTL);
    return { count };
  }

  async markRead(id: string, cidadaoId: string): Promise<void> {
    await this.prisma.notificacao.updateMany({
      where: { id, cidadaoId },
      data: { lida: true, lidaEm: new Date() },
    });

    // Invalidate unread count cache
    await this.redis.getClient().del(UNREAD_KEY(cidadaoId));
  }

  async send(job: NotificacaoJob): Promise<void> {
    await this.prisma.notificacao.create({
      data: {
        cidadaoId: job.cidadao_id,
        tipo: job.tipo,
        titulo: job.titulo,
        corpo: job.corpo,
        canal: job.canal,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        payload: (job.payload ?? undefined) as any,
      },
    });

    // Invalidate unread count cache so next GET recomputes
    await this.redis.getClient().del(UNREAD_KEY(job.cidadao_id));
  }
}
