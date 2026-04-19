import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { NotificacoesService } from '../notificacoes/notificacoes.service';
import type { CreateCampanhaDto } from './dto/create-campanha.dto';
import type { CampanhaItem, ElegibilidadeResponse } from '@ecobairro/contracts';

@Injectable()
export class CampanhasService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(AuditService) private readonly audit: AuditService,
    @Inject(NotificacoesService) private readonly notif: NotificacoesService,
  ) {}

  async listAtivas(): Promise<CampanhaItem[]> {
    const now = new Date();
    const rows = await this.prisma.campanha.findMany({
      where: {
        ativa: true,
        disponivelDe: { lte: now },
        disponivelAte: { gte: now },
      },
      orderBy: { disponivelAte: 'asc' },
    });
    return rows.map(this.toItem);
  }

  async listAdmin(): Promise<CampanhaItem[]> {
    const rows = await this.prisma.campanha.findMany({
      orderBy: { criadoEm: 'desc' },
    });
    return rows.map(this.toItem);
  }

  async findOne(id: string): Promise<CampanhaItem> {
    const c = await this.prisma.campanha.findUnique({ where: { id } });
    if (!c) throw new NotFoundException(`Campanha ${id} não encontrada`);
    return this.toItem(c);
  }

  async checkElegibilidade(
    campanhaId: string,
    cidadaoId: string,
  ): Promise<ElegibilidadeResponse> {
    const campanha = await this.prisma.campanha.findUnique({ where: { id: campanhaId } });
    if (!campanha) throw new NotFoundException(`Campanha ${campanhaId} não encontrada`);

    const criterios = campanha.criterios as Record<string, unknown>;
    const checks: Array<{ criterio: string; ok: boolean }> = [];

    if (criterios['min_quiz_pontuacao'] !== undefined) {
      const minPontuacao = Number(criterios['min_quiz_pontuacao']);
      const result = await this.prisma.quizSessao.aggregate({
        _sum: { pontuacao: true },
        where: { cidadaoId, concluida: true },
      });
      const total = result._sum.pontuacao ?? 0;
      checks.push({ criterio: 'min_quiz_pontuacao', ok: total >= minPontuacao });
    }

    if (criterios['min_recolhas'] !== undefined) {
      const minRecolhas = Number(criterios['min_recolhas']);
      const count = await this.prisma.pedidoRecolha.count({
        where: { cidadaoId, estado: 'CONCLUIDO' },
      });
      checks.push({ criterio: 'min_recolhas', ok: count >= minRecolhas });
    }

    if (criterios['min_reports'] !== undefined) {
      const minReports = Number(criterios['min_reports']);
      const count = await this.prisma.report.count({
        where: { cidadaoId, estado: 'RESOLVIDO', eliminadoEm: null },
      });
      checks.push({ criterio: 'min_reports', ok: count >= minReports });
    }

    const elegivel = checks.length === 0 || checks.every((c) => c.ok);

    return {
      campanha_id: campanhaId,
      elegivel,
      checks,
    };
  }

  async create(input: CreateCampanhaDto, criadoPor: string, ip: string): Promise<CampanhaItem> {
    if (new Date(input.disponivel_de) >= new Date(input.disponivel_ate)) {
      throw new BadRequestException('disponivel_de deve ser anterior a disponivel_ate');
    }

    const c = await this.prisma.campanha.create({
      data: {
        titulo: input.titulo,
        descricao: input.descricao,
        zonaId: input.zona_id,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        criterios: input.criterios as any,
        recompensa: input.recompensa,
        disponivelDe: new Date(input.disponivel_de),
        disponivelAte: new Date(input.disponivel_ate),
        criadoPor,
        ativa: false,
      },
    });

    this.audit.log({
      actorId: criadoPor,
      acao: 'CAMPANHA_CRIADA',
      entidade: 'campanhas',
      entidadeId: c.id,
      ip,
    });

    return this.toItem(c);
  }

  async update(
    id: string,
    input: Partial<CreateCampanhaDto>,
    actorId: string,
    ip: string,
  ): Promise<CampanhaItem> {
    const campanha = await this.prisma.campanha.findUnique({ where: { id } });
    if (!campanha) throw new NotFoundException(`Campanha ${id} não encontrada`);
    if (campanha.ativa) {
      throw new BadRequestException('Não é possível editar uma campanha já activa');
    }

    const updated = await this.prisma.campanha.update({
      where: { id },
      data: {
        ...(input.titulo !== undefined && { titulo: input.titulo }),
        ...(input.descricao !== undefined && { descricao: input.descricao }),
        ...(input.zona_id !== undefined && { zonaId: input.zona_id }),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ...(input.criterios !== undefined && { criterios: input.criterios as any }),
        ...(input.recompensa !== undefined && { recompensa: input.recompensa }),
        ...(input.disponivel_de !== undefined && { disponivelDe: new Date(input.disponivel_de) }),
        ...(input.disponivel_ate !== undefined && { disponivelAte: new Date(input.disponivel_ate) }),
      },
    });

    this.audit.log({ actorId, acao: 'CAMPANHA_ATUALIZADA', entidade: 'campanhas', entidadeId: id, ip });
    return this.toItem(updated);
  }

  async ativar(id: string, actorId: string, ip: string): Promise<CampanhaItem> {
    const campanha = await this.prisma.campanha.findUnique({ where: { id } });
    if (!campanha) throw new NotFoundException(`Campanha ${id} não encontrada`);

    const updated = await this.prisma.campanha.update({
      where: { id },
      data: { ativa: true },
    });

    // Notificar cidadãos da zona (ou todos se sem zona)
    const perfis = await this.prisma.cidadaoPerfil.findMany({
      select: { userId: true },
    });
    for (const p of perfis) {
      await this.notif.send({
        cidadao_id: p.userId,
        tipo: 'CAMPANHA_ATIVA',
        titulo: `Nova campanha: ${campanha.titulo}`,
        corpo: campanha.recompensa,
        canal: 'APP',
        payload: { campanhaId: id },
      });
    }

    this.audit.log({ actorId, acao: 'CAMPANHA_ATIVADA', entidade: 'campanhas', entidadeId: id, ip });
    return this.toItem(updated);
  }

  private toItem(c: {
    id: string;
    titulo: string;
    descricao: string | null;
    zonaId: string | null;
    criterios: unknown;
    recompensa: string;
    ativa: boolean;
    disponivelDe: Date;
    disponivelAte: Date;
    criadoEm: Date;
  }): CampanhaItem {
    return {
      id: c.id,
      titulo: c.titulo,
      descricao: c.descricao,
      zona_id: c.zonaId,
      criterios: c.criterios as Record<string, unknown>,
      recompensa: c.recompensa,
      ativa: c.ativa,
      disponivel_de: c.disponivelDe.toISOString(),
      disponivel_ate: c.disponivelAte.toISOString(),
      criado_em: c.criadoEm.toISOString(),
    };
  }
}
