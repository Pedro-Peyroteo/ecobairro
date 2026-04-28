import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { RedisService } from '../redis/redis.service';
import { AuditService } from '../audit/audit.service';
import { BadgeWorkerService } from '../gamificacao/badge-worker.service';
import type { CreateReportDto, UpdateReportEstadoDto } from './dto/create-report.dto';
import type { ReportDetail, ReportListItem } from '@ecobairro/contracts';
import type { UserRole } from '@ecobairro/contracts';

const DUPLICADO_RADIUS_METERS = 100;

@Injectable()
export class ReportsService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(RedisService) private readonly redis: RedisService,
    @Inject(AuditService) private readonly audit: AuditService,
    @Inject(BadgeWorkerService) private readonly badgeWorker: BadgeWorkerService,
  ) {}

  async create(
    input: CreateReportDto,
    cidadaoId: string,
  ): Promise<{ report?: ReportDetail; duplicado?: { id: string; numero: string } }> {
    // 1. Resolve zona via ST_Within
    const zonaRows = await this.prisma.$queryRaw<[{ id: string }]>`
      SELECT id FROM zonas
      WHERE ativa = true
        AND ST_Within(
          ST_SetSRID(ST_MakePoint(${input.longitude}, ${input.latitude}), 4326)::geometry,
          geometria::geometry
        )
      LIMIT 1
    `;

    if (!zonaRows.length) {
      throw new BadRequestException('Localização fora de qualquer zona activa');
    }

    const zonaId = zonaRows[0].id;

    // 2. Antispam check: max 2 reports per zone per user per 24h (RF-09)
    await this.assertAntispam(cidadaoId, zonaId);

    // 3. Duplicate detection within 100m (RF-12)
    const duplicados = await this.prisma.$queryRaw<Array<{ id: string; numero: bigint }>>`
      SELECT r.id, r.numero
      FROM reports r
      WHERE r.eliminado_em IS NULL
        AND r.estado NOT IN ('RESOLVIDO', 'REJEITADO')
        AND r.categoria = ${input.categoria}
        AND ST_DWithin(
          r.localizacao::geometry,
          ST_SetSRID(ST_MakePoint(${input.longitude}, ${input.latitude}), 4326)::geometry,
          ${DUPLICADO_RADIUS_METERS}
        )
      ORDER BY r.criado_em DESC
      LIMIT 1
    `;

    if (duplicados.length && duplicados[0]) {
      const dup = duplicados[0];
      return {
        duplicado: {
          id: dup.id,
          numero: `ECO-${new Date().getFullYear()}-${String(dup.numero).padStart(6, '0')}`,
        },
      };
    }

    // 4. Insert report with geography via raw SQL
    const created = await this.prisma.$queryRaw<[{ id: string }]>`
      INSERT INTO reports
        (cidadao_id, ecoponto_id, zona_id, categoria, descricao, localizacao,
         localizacao_manual, foto_url, estado, criado_em, atualizado_em)
      VALUES (
        ${cidadaoId}::uuid,
        ${input.ecopontoId ?? null}::uuid,
        ${zonaId}::uuid,
        ${input.categoria}::"ReportCategoria",
        ${input.descricao ?? null},
        ST_SetSRID(ST_MakePoint(${input.longitude}, ${input.latitude}), 4326)::geography,
        ${input.localizacaoManual ?? false},
        ${input.fotoUrl ?? null},
        'RECEBIDO'::"ReportEstado",
        now(), now()
      )
      RETURNING id
    `;

    const reportId = created[0].id;

    // 5. Seed timeline entry
    await this.prisma.reportTimeline.create({
      data: {
        reportId,
        estadoAntes: null,
        estadoDepois: 'RECEBIDO',
        nota: 'Report criado pelo cidadão',
        atualizadoPor: cidadaoId,
      },
    });

    // 6. Record antispam usage
    await this.recordAntispam(cidadaoId, zonaId);

    this.audit.log({
      actorId: cidadaoId,
      acao: 'REPORT_CRIADO',
      entidade: 'reports',
      entidadeId: reportId,
    });

    // Avaliar badges em background (fire-and-forget)
    void this.badgeWorker.avaliar(cidadaoId);

    return { report: await this.findOne(reportId) };
  }

  async findOne(id: string): Promise<ReportDetail> {
    const rows = await this.prisma.$queryRaw<Array<{
      id: string;
      numero: bigint;
      cidadao_id: string;
      ecoponto_id: string | null;
      zona_id: string;
      categoria: string;
      descricao: string | null;
      lat: number;
      lng: number;
      localizacao_manual: boolean;
      foto_url: string | null;
      estado: string;
      motivo_rejeicao: string | null;
      entidade_responsavel: string | null;
      atribuido_a: string | null;
      report_pai_id: string | null;
      num_subscricoes: number;
      criado_em: Date;
      atualizado_em: Date;
    }>>`
      SELECT r.id, r.numero, r.cidadao_id, r.ecoponto_id, r.zona_id,
             r.categoria, r.descricao,
             ST_Y(r.localizacao::geometry) AS lat,
             ST_X(r.localizacao::geometry) AS lng,
             r.localizacao_manual, r.foto_url, r.estado, r.motivo_rejeicao,
             r.entidade_responsavel, r.atribuido_a, r.report_pai_id,
             r.num_subscricoes, r.criado_em, r.atualizado_em
      FROM reports r
      WHERE r.id = ${id}::uuid AND r.eliminado_em IS NULL
    `;

    if (!rows.length || !rows[0]) throw new NotFoundException(`Report ${id} não encontrado`);

    const r = rows[0];
    const ano = r.criado_em.getFullYear();
    return {
      id: r.id,
      numero: `ECO-${ano}-${String(r.numero).padStart(6, '0')}`,
      cidadao_id: r.cidadao_id,
      ecoponto_id: r.ecoponto_id,
      zona_id: r.zona_id,
      categoria: r.categoria,
      descricao: r.descricao,
      latitude: r.lat,
      longitude: r.lng,
      localizacao_manual: r.localizacao_manual,
      foto_url: r.foto_url,
      estado: r.estado,
      motivo_rejeicao: r.motivo_rejeicao,
      entidade_responsavel: r.entidade_responsavel,
      atribuido_a: r.atribuido_a,
      report_pai_id: r.report_pai_id,
      num_subscricoes: r.num_subscricoes,
      criado_em: r.criado_em.toISOString(),
      atualizado_em: r.atualizado_em.toISOString(),
    };
  }

  async findOneForUser(id: string, userId: string, role: UserRole): Promise<ReportDetail> {
    const report = await this.findOne(id);
    this.assertCanReadReport(report.cidadao_id, userId, role);
    return report;
  }

  async listMine(cidadaoId: string): Promise<ReportListItem[]> {
    const rows = await this.prisma.$queryRaw<Array<{
      id: string;
      numero: bigint;
      categoria: string;
      estado: string;
      criado_em: Date;
    }>>`
      SELECT id, numero, categoria, estado, criado_em
      FROM reports
      WHERE cidadao_id = ${cidadaoId}::uuid
        AND eliminado_em IS NULL
      ORDER BY criado_em DESC
      LIMIT 50
    `;

    return rows.map((r) => ({
      id: r.id,
      numero: `ECO-${r.criado_em.getFullYear()}-${String(r.numero).padStart(6, '0')}`,
      categoria: r.categoria,
      estado: r.estado,
      criado_em: r.criado_em.toISOString(),
    }));
  }

  async updateEstado(
    id: string,
    input: UpdateReportEstadoDto,
    actorId: string,
    role: UserRole,
  ): Promise<ReportDetail> {
    const report = await this.prisma.report.findUnique({
      where: { id },
      select: { id: true, estado: true, eliminadoEm: true },
    });

    if (!report || report.eliminadoEm) {
      throw new NotFoundException(`Report ${id} não encontrado`);
    }

    if (role === 'CIDADAO') {
      throw new ForbiddenException('Cidadãos não podem alterar o estado do report');
    }

    if (input.estado === 'REJEITADO' && !input.motivoRejeicao?.trim()) {
      throw new BadRequestException('Motivo de rejeição é obrigatório');
    }

    const wasRecebido = report.estado === 'RECEBIDO';
    const agora = new Date();

    await this.prisma.report.update({
      where: { id },
      data: {
        estado: input.estado as import('@prisma/client').ReportEstado,
        motivoRejeicao: input.motivoRejeicao ?? null,
        ...(wasRecebido ? { primeiraRespostaEm: agora } : {}),
        ...(input.estado === 'RESOLVIDO' ? { resolvidoEm: agora } : {}),
      } as import('@prisma/client').Prisma.ReportUpdateInput,
    });

    await this.prisma.reportTimeline.create({
      data: {
        reportId: id,
        estadoAntes: report.estado,
        estadoDepois: input.estado,
        nota: input.nota,
        atualizadoPor: actorId,
      },
    });

    this.audit.log({
      actorId,
      acao: 'REPORT_ESTADO_ALTERADO',
      entidade: 'reports',
      entidadeId: id,
      detalhes: { de: report.estado, para: input.estado },
    });

    return this.findOne(id);
  }

  async subscribe(reportId: string, cidadaoId: string): Promise<{ subscribed: true }> {
    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
      select: { id: true, eliminadoEm: true },
    });

    if (!report || report.eliminadoEm) {
      throw new NotFoundException(`Report ${reportId} não encontrado`);
    }

    await this.prisma.reportSubscricao.upsert({
      where: { reportId_cidadaoId: { reportId, cidadaoId } },
      create: { reportId, cidadaoId },
      update: {},
    });

    return { subscribed: true };
  }

  async getTimeline(
    reportId: string,
  ): Promise<Array<{ estado_antes: string | null; estado_depois: string; nota: string | null; criado_em: string }>> {
    const entries = await this.prisma.reportTimeline.findMany({
      where: { reportId },
      orderBy: { criadoEm: 'asc' },
      select: { estadoAntes: true, estadoDepois: true, nota: true, criadoEm: true },
    });

    return entries.map((e) => ({
      estado_antes: e.estadoAntes,
      estado_depois: e.estadoDepois,
      nota: e.nota,
      criado_em: e.criadoEm.toISOString(),
    }));
  }

  async getTimelineForUser(
    reportId: string,
    userId: string,
    role: UserRole,
  ): Promise<Array<{ estado_antes: string | null; estado_depois: string; nota: string | null; criado_em: string }>> {
    const report = await this.findOne(reportId);
    this.assertCanReadReport(report.cidadao_id, userId, role);
    return this.getTimeline(reportId);
  }

  // ── Antispam helpers (RF-09) ──────────────────────────────────────────────

  private antispamKey(cidadaoId: string, zonaId: string): string {
    return `antispam:report:${cidadaoId}:${zonaId}`;
  }

  private async assertAntispam(cidadaoId: string, zonaId: string): Promise<void> {
    const zona = await this.prisma.zona.findUnique({
      where: { id: zonaId },
      select: { limiteAntispamReports: true, janelaAntispamHoras: true },
    });

    if (!zona) return;

    const key = this.antispamKey(cidadaoId, zonaId);
    const count = await this.redis.getClient().get(key);

    if (count !== null && parseInt(count, 10) >= zona.limiteAntispamReports) {
      throw new BadRequestException(
        `Limite de ${zona.limiteAntispamReports} reports por zona nas últimas ${zona.janelaAntispamHoras}h atingido`,
      );
    }
  }

  private async recordAntispam(cidadaoId: string, zonaId: string): Promise<void> {
    const zona = await this.prisma.zona.findUnique({
      where: { id: zonaId },
      select: { janelaAntispamHoras: true },
    });

    const ttlSeconds = (zona?.janelaAntispamHoras ?? 24) * 3600;
    const key = this.antispamKey(cidadaoId, zonaId);
    const client = this.redis.getClient();

    const newCount = await client.incr(key);
    if (newCount === 1) {
      await client.expire(key, ttlSeconds);
    }
  }

  private assertCanReadReport(reportOwnerId: string, userId: string, role: UserRole): void {
    if (role === 'CIDADAO' && reportOwnerId !== userId) {
      throw new ForbiddenException('Cidadão só pode aceder aos próprios reports');
    }
  }
}
