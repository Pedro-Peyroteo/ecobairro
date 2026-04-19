import {
  Injectable,
  Inject,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { RedisService } from '../redis/redis.service';

const FAV_KEY = (id: string) => `favoritos:${id}`;

@Injectable()
export class FavoritosService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(RedisService) private readonly redis: RedisService,
  ) {}

  async list(cidadaoId: string): Promise<Array<{ ecoponto_id: string; criado_em: string }>> {
    const rows = await this.prisma.ecopontoFavorito.findMany({
      where: { cidadaoId },
      orderBy: { criadoEm: 'desc' },
      select: { ecopontoId: true, criadoEm: true },
    });

    return rows.map((r) => ({
      ecoponto_id: r.ecopontoId,
      criado_em: r.criadoEm.toISOString(),
    }));
  }

  async add(cidadaoId: string, ecopontoId: string): Promise<{ id: string; ecoponto_id: string; criado_em: string }> {
    const ecoponto = await this.prisma.ecoponto.findUnique({
      where: { id: ecopontoId },
      select: { id: true, eliminadoEm: true },
    });
    if (!ecoponto || ecoponto.eliminadoEm) {
      throw new NotFoundException(`Ecoponto ${ecopontoId} não encontrado`);
    }

    const existing = await this.prisma.ecopontoFavorito.findUnique({
      where: { cidadaoId_ecopontoId: { cidadaoId, ecopontoId } },
    });
    if (existing) {
      throw new ConflictException('Ecoponto já está nos favoritos');
    }

    const fav = await this.prisma.ecopontoFavorito.create({
      data: { cidadaoId, ecopontoId },
    });

    await this.redis.getClient().del(FAV_KEY(cidadaoId));

    return {
      id: fav.id,
      ecoponto_id: fav.ecopontoId,
      criado_em: fav.criadoEm.toISOString(),
    };
  }

  async remove(cidadaoId: string, ecopontoId: string): Promise<void> {
    const existing = await this.prisma.ecopontoFavorito.findUnique({
      where: { cidadaoId_ecopontoId: { cidadaoId, ecopontoId } },
    });
    if (!existing) {
      throw new NotFoundException('Favorito não encontrado');
    }

    await this.prisma.ecopontoFavorito.delete({
      where: { cidadaoId_ecopontoId: { cidadaoId, ecopontoId } },
    });

    await this.redis.getClient().del(FAV_KEY(cidadaoId));
  }
}
