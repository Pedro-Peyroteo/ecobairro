import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, ReportStatus, UserRole } from '@prisma/client';
import type {
  CreateReportRequest,
  CreateReportResponse,
  ListReportsQuery,
  ListReportsResponse,
  ReportRecord,
  ReportStatus as ContractReportStatus,
  UserRole as ContractUserRole,
  UpdateReportStatusRequest,
  UpdateReportStatusResponse,
} from '@ecobairro/contracts';
import { PrismaService } from '../database/prisma.service';

const REPORT_STATUS_MAP: Record<ContractReportStatus, ReportStatus> = {
  pendente: ReportStatus.PENDENTE,
  analise: ReportStatus.ANALISE,
  resolvido: ReportStatus.RESOLVIDO,
  rejeitado: ReportStatus.REJEITADO,
};

const DB_STATUS_MAP: Record<ReportStatus, ContractReportStatus> = {
  PENDENTE: 'pendente',
  ANALISE: 'analise',
  RESOLVIDO: 'resolvido',
  REJEITADO: 'rejeitado',
};

@Injectable()
export class ReportsService {
  private readonly prisma: PrismaService;

  constructor(@Inject(PrismaService) prisma: PrismaService) {
    this.prisma = prisma;
  }

  async createReport(
    userId: string,
    role: ContractUserRole,
    input: CreateReportRequest,
  ): Promise<CreateReportResponse> {
    assertCitizen(role);

    const report = await this.prisma.report.create({
      data: {
        titulo: input.titulo,
        tipo: input.tipo,
        descricao: input.descricao,
        local: input.local,
        imagemUrl: input.imagem ?? null,
        userId,
      },
    });

    return {
      report: mapReport(report),
    };
  }

  async listMyReports(
    userId: string,
    role: ContractUserRole,
    query: ListReportsQuery,
  ): Promise<ListReportsResponse> {
    assertCitizen(role);
    return this.listReportsInternal({ userId }, query);
  }

  async listReports(
    role: ContractUserRole,
    query: ListReportsQuery,
  ): Promise<ListReportsResponse> {
    assertOperationalReader(role);
    return this.listReportsInternal({}, query);
  }

  async updateReportStatus(
    role: ContractUserRole,
    reportId: string,
    input: UpdateReportStatusRequest,
  ): Promise<UpdateReportStatusResponse> {
    assertOperationalWriter(role);

    const report = await this.prisma.report.updateMany({
      where: { id: reportId },
      data: {
        status: REPORT_STATUS_MAP[input.status],
      },
    });

    if (report.count === 0) {
      throw new NotFoundException('Report not found');
    }

    const updated = await this.prisma.report.findUnique({
      where: { id: reportId },
    });

    if (!updated) {
      throw new NotFoundException('Report not found');
    }

    return {
      report: mapReport(updated),
    };
  }

  private async listReportsInternal(
    scope: { userId?: string },
    query: ListReportsQuery,
  ): Promise<ListReportsResponse> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;
    const skip = (page - 1) * pageSize;

    const where: Prisma.ReportWhereInput = {
      ...(scope.userId ? { userId: scope.userId } : {}),
      ...(query.status ? { status: REPORT_STATUS_MAP[query.status] } : {}),
      ...(query.tipo ? { tipo: query.tipo } : {}),
      ...(query.q
        ? {
            OR: [
              { titulo: { contains: query.q, mode: 'insensitive' } },
              { local: { contains: query.q, mode: 'insensitive' } },
              { descricao: { contains: query.q, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.report.findMany({
        where,
        orderBy: { criadoEm: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.report.count({ where }),
    ]);

    return {
      reports: rows.map(mapReport),
      page,
      pageSize,
      total,
    };
  }
}

function mapReport(report: {
  id: string;
  titulo: string;
  tipo: string;
  descricao: string;
  local: string;
  imagemUrl: string | null;
  status: ReportStatus;
  userId: string;
  criadoEm: Date;
}): ReportRecord {
  return {
    id: report.id,
    titulo: report.titulo,
    tipo: report.tipo as ReportRecord['tipo'],
    descricao: report.descricao,
    local: report.local,
    data: report.criadoEm.toISOString(),
    status: DB_STATUS_MAP[report.status],
    imagem: report.imagemUrl ?? undefined,
    user_id: report.userId,
  };
}

function assertCitizen(role: ContractUserRole): asserts role is 'CIDADAO' {
  if (role !== UserRole.CIDADAO) {
    throw new ForbiddenException('Only citizens can access this route');
  }
}

function assertOperationalReader(role: ContractUserRole): void {
  if (
    role !== UserRole.OPERADOR_VEOLIA &&
    role !== UserRole.ADMIN &&
    role !== UserRole.TECNICO_AUTARQUIA &&
    role !== UserRole.TECNICO_CCDR
  ) {
    throw new ForbiddenException('Only operational users can access this route');
  }
}

function assertOperationalWriter(role: ContractUserRole): void {
  if (role !== UserRole.OPERADOR_VEOLIA && role !== UserRole.ADMIN) {
    throw new ForbiddenException('Only operators and admins can update report status');
  }
}
