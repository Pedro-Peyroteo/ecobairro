import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { NotificacoesService } from '../notificacoes/notificacoes.service';
import type { CreateMensagemInstitucionalDto } from './dto/create-mensagem.dto';
import type { MensagemInstitucionalItem } from '@ecobairro/contracts';

@Injectable()
export class MensagensService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(NotificacoesService) private readonly notif: NotificacoesService,
  ) {}

  async create(
    input: CreateMensagemInstitucionalDto,
    criadoPor: string,
  ): Promise<MensagemInstitucionalItem> {
    const msg = await this.prisma.mensagemInstitucional.create({
      data: {
        titulo: input.titulo,
        corpo: input.corpo,
        criadoPor,
        zonasDestino: input.zonasDestino ?? [],
        publicada: input.publicar ?? false,
        publicadaEm: input.publicar ? new Date() : null,
      },
    });

    if (input.publicar) {
      await this.enviarNotificacoes(msg.id, input.zonasDestino ?? []);
    }

    return this.toItem(msg);
  }

  async publish(id: string): Promise<MensagemInstitucionalItem> {
    const msg = await this.prisma.mensagemInstitucional.findUnique({ where: { id } });
    if (!msg) throw new NotFoundException(`Mensagem ${id} não encontrada`);

    const updated = await this.prisma.mensagemInstitucional.update({
      where: { id },
      data: { publicada: true, publicadaEm: new Date() },
    });

    await this.enviarNotificacoes(id, msg.zonasDestino as string[]);

    return this.toItem(updated);
  }

  async list(soPub = true): Promise<MensagemInstitucionalItem[]> {
    const msgs = await this.prisma.mensagemInstitucional.findMany({
      where: soPub ? { publicada: true } : {},
      orderBy: { criadoEm: 'desc' },
      take: 50,
    });
    return msgs.map(this.toItem);
  }

  async findOne(id: string): Promise<MensagemInstitucionalItem> {
    const msg = await this.prisma.mensagemInstitucional.findUnique({ where: { id } });
    if (!msg) throw new NotFoundException(`Mensagem ${id} não encontrada`);
    return this.toItem(msg);
  }

  /** Envia notificação in-app a todos os cidadãos das zonas destino */
  private async enviarNotificacoes(
    mensagemId: string,
    zonaIds: string[],
  ): Promise<void> {
    if (!zonaIds.length) return;

    const perfis = await this.prisma.cidadaoPerfil.findMany({
      select: { userId: true },
    });

    for (const perfil of perfis) {
      await this.notif.send({
        cidadao_id: perfil.userId,
        tipo: 'MENSAGEM_INSTITUCIONAL',
        titulo: 'Nova mensagem institucional',
        corpo: `Consulte a mensagem no ID ${mensagemId}`,
        canal: 'APP',
        payload: { mensagemId },
      });
    }
  }

  private toItem(m: {
    id: string;
    titulo: string;
    corpo: string;
    criadoPor: string;
    publicada: boolean;
    publicadaEm: Date | null;
    zonasDestino: unknown;
    criadoEm: Date;
  }): MensagemInstitucionalItem {
    return {
      id: m.id,
      titulo: m.titulo,
      corpo: m.corpo,
      criado_por: m.criadoPor,
      publicada: m.publicada,
      publicada_em: m.publicadaEm?.toISOString() ?? null,
      zonas_destino: m.zonasDestino as string[],
      criado_em: m.criadoEm.toISOString(),
    };
  }
}
