import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

export interface AuditEntry {
  actorId?: string;
  acao: string;
  entidade: string;
  entidadeId?: string;
  detalhes?: Record<string, unknown>;
  ip?: string;
}

/**
 * Appends to audit_log asynchronously (fire-and-forget).
 * RNF-SEG-03: retain ≥ 24 months. Entries are never deleted by the API.
 */
@Injectable()
export class AuditService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  log(entry: AuditEntry): void {
    // Fire-and-forget — do not await; audit must not slow down HTTP responses
    this.prisma.auditLog
      .create({
        data: {
          actorId: entry.actorId ?? null,
          acao: entry.acao,
          entidade: entry.entidade,
          entidadeId: entry.entidadeId ?? null,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          detalhes: (entry.detalhes ?? undefined) as any,
          ip: entry.ip ?? null,
        },
      })
      .catch(() => {
        // Intentionally silent — audit failures must not affect business operations
      });
  }
}
