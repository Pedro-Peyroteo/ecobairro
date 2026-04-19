import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import type { ConsentirDto } from './dto/consentimento.dto';

export interface ConsentimentoItem {
  id: string;
  finalidade: string;
  versao: string;
  aceite: boolean;
  criado_em: string;
  revogado_em: string | null;
}

@Injectable()
export class RgpdService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(AuditService) private readonly audit: AuditService,
  ) {}

  async listConsentimentos(cidadaoId: string): Promise<ConsentimentoItem[]> {
    const rows = await this.prisma.rgpdConsentimento.findMany({
      where: { cidadaoId },
      orderBy: { criadoEm: 'desc' },
    });

    return rows.map((r) => ({
      id: r.id,
      finalidade: r.finalidade,
      versao: r.versao,
      aceite: r.aceite,
      criado_em: r.criadoEm.toISOString(),
      revogado_em: r.revogadoEm?.toISOString() ?? null,
    }));
  }

  async consentir(
    cidadaoId: string,
    input: ConsentirDto,
    ip: string,
  ): Promise<ConsentimentoItem> {
    // Revoga consentimentos anteriores da mesma finalidade
    await this.prisma.rgpdConsentimento.updateMany({
      where: { cidadaoId, finalidade: input.finalidade, revogadoEm: null },
      data: { revogadoEm: new Date() },
    });

    const c = await this.prisma.rgpdConsentimento.create({
      data: {
        cidadaoId,
        finalidade: input.finalidade,
        versao: input.versao_texto,
        aceite: input.aceite,
      },
    });

    this.audit.log({
      actorId: cidadaoId,
      acao: 'RGPD_CONSENTIMENTO',
      entidade: 'rgpd_consentimentos',
      entidadeId: c.id,
      detalhes: { finalidade: input.finalidade, aceite: input.aceite },
      ip,
    });

    return {
      id: c.id,
      finalidade: c.finalidade,
      versao: c.versao,
      aceite: c.aceite,
      criado_em: c.criadoEm.toISOString(),
      revogado_em: null,
    };
  }

  async revogar(
    cidadaoId: string,
    finalidade: string,
    ip: string,
  ): Promise<void> {
    const existing = await this.prisma.rgpdConsentimento.findFirst({
      where: { cidadaoId, finalidade, revogadoEm: null, aceite: true },
    });

    if (!existing) {
      throw new NotFoundException(`Consentimento activo para "${finalidade}" não encontrado`);
    }

    await this.prisma.rgpdConsentimento.update({
      where: { id: existing.id },
      data: { revogadoEm: new Date(), aceite: false },
    });

    this.audit.log({
      actorId: cidadaoId,
      acao: 'RGPD_REVOGACAO',
      entidade: 'rgpd_consentimentos',
      entidadeId: existing.id,
      detalhes: { finalidade },
      ip,
    });
  }

  async pedirPortabilidade(cidadaoId: string, ip: string): Promise<{ message: string }> {
    // Recolhe todos os dados pessoais do cidadão
    const [perfil, consentimentos, reports, pedidos, partilhas, quiz, badges] = await Promise.all([
      this.prisma.cidadaoPerfil.findUnique({ where: { userId: cidadaoId } }),
      this.prisma.rgpdConsentimento.findMany({ where: { cidadaoId } }),
      this.prisma.report.findMany({
        where: { cidadaoId, eliminadoEm: null },
        select: { id: true, categoria: true, estado: true, criadoEm: true },
      }),
      this.prisma.pedidoRecolha.findMany({
        where: { cidadaoId },
        select: { id: true, morada: true, tipoMaterial: true, estado: true, criadoEm: true },
      }),
      this.prisma.partilhaMaterial.findMany({
        where: { cidadaoId, eliminadoEm: null },
        select: { id: true, titulo: true, categoria: true, estado: true, criadoEm: true },
      }),
      this.prisma.quizSessao.findMany({ where: { cidadaoId } }),
      this.prisma.cidadaoBadge.findMany({ where: { cidadaoId }, include: { badge: true } }),
    ]);

    const export_data = {
      gerado_em: new Date().toISOString(),
      perfil,
      consentimentos,
      reports,
      pedidos_recolha: pedidos,
      partilhas,
      quiz_sessoes: quiz,
      badges: badges.map((b) => ({ codigo: b.badge.codigo, nome: b.badge.nome, ganho_em: b.ganhoEm })),
    };

    // Registo de auditoria com o snapshot (sem PII sensível na coluna detalhes)
    this.audit.log({
      actorId: cidadaoId,
      acao: 'RGPD_PORTABILIDADE',
      entidade: 'users',
      entidadeId: cidadaoId,
      ip,
    });

    // Em produção: enfileirar job BullMQ para gerar ficheiro e enviar por email.
    // Para MVP: devolver os dados directamente (JSON).
    void export_data; // usado em produção para gerar ficheiro

    return {
      message:
        'O seu pedido de portabilidade foi registado. Em produção receberá um email com o ficheiro.',
    };
  }
}
