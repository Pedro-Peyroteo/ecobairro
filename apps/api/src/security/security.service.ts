import { Inject, Injectable, Logger } from '@nestjs/common';
import { SecurityEventType } from '@prisma/client';
import { readNumberEnv } from '@ecobairro/config';
import { PrismaService } from '../database/prisma.service';
import { RedisService } from '../redis/redis.service';

export interface RequestContext {
  ipAddress: string;
  userAgent: string | null;
}

const MAX_FAILED_ATTEMPTS = readNumberEnv('ACCOUNT_LOCK_MAX_ATTEMPTS', 5);
const LOCK_MINUTES = readNumberEnv('ACCOUNT_LOCK_MINUTES', 30);
const ACCESS_TTL_SECONDS = readNumberEnv('JWT_ACCESS_TTL_MINUTES', 15) * 60;

/**
 * Núcleo de segurança: audit trail (SecurityLog), bloqueio de conta
 * (account lockout), e revogação imediata via Redis blacklist.
 */
@Injectable()
export class SecurityService {
  private readonly logger = new Logger(SecurityService.name);
  private readonly prisma: PrismaService;
  private readonly redis: RedisService;

  constructor(
    @Inject(PrismaService) prisma: PrismaService,
    @Inject(RedisService) redis: RedisService,
  ) {
    this.prisma = prisma;
    this.redis = redis;
  }

  /** Grava um evento de segurança no audit trail. Nunca lança (best-effort). */
  async log(
    userId: string,
    event: SecurityEventType,
    ctx: RequestContext,
  ): Promise<void> {
    try {
      await this.prisma.securityLog.create({
        data: {
          userId,
          event,
          ipAddress: ctx.ipAddress,
          userAgent: ctx.userAgent,
        },
      });
    } catch (err) {
      this.logger.warn(`Falha ao gravar SecurityLog (${event}): ${String(err)}`);
    }
  }

  /** True se a conta está actualmente bloqueada (lockedUntil no futuro). */
  isLocked(lockedUntil: Date | null): boolean {
    return lockedUntil != null && lockedUntil.getTime() > Date.now();
  }

  /** Minutos restantes de bloqueio (arredondado para cima, mínimo 1). */
  minutesUntilUnlock(lockedUntil: Date | null): number {
    if (!lockedUntil) return 0;
    const ms = lockedUntil.getTime() - Date.now();
    return Math.max(1, Math.ceil(ms / 60000));
  }

  /**
   * Regista uma tentativa falhada. Incrementa o contador e, ao atingir o
   * limite, bloqueia a conta por LOCK_MINUTES. Devolve se ficou bloqueada
   * agora (para enviar o email de aviso).
   */
  async registerFailedAttempt(userId: string): Promise<{ justLocked: boolean }> {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { failedLoginAttempts: { increment: 1 } },
      select: { failedLoginAttempts: true },
    });

    if (user.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
      const lockedUntil = new Date(Date.now() + LOCK_MINUTES * 60000);
      await this.prisma.user.update({
        where: { id: userId },
        data: { lockedUntil, failedLoginAttempts: 0 },
      });
      return { justLocked: true };
    }

    return { justLocked: false };
  }

  /** Reset do contador de falhas após login bem-sucedido. */
  async resetFailedAttempts(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { failedLoginAttempts: 0, lockedUntil: null },
    });
  }

  /** Marca um utilizador como revogado no Redis (kick imediato). */
  async revokeUser(userId: string): Promise<void> {
    await this.redis
      .getClient()
      .set(revokedUserKey(userId), '1', 'EX', ACCESS_TTL_SECONDS);
  }

  /** Remove a marca de revogação (ex.: ao re-autenticar). */
  async clearRevocation(userId: string): Promise<void> {
    await this.redis.getClient().del(revokedUserKey(userId));
  }

  /** Leitura ultra-rápida usada pelo guard em cada request. */
  async isRevoked(userId: string): Promise<boolean> {
    const v = await this.redis.getClient().get(revokedUserKey(userId));
    return v != null;
  }

  /**
   * Deteta se o par (ip, userAgent) é novo para este utilizador
   * (não existe nos SecurityLog de LOGIN_SUCCESS anteriores).
   */
  async isNewDevice(userId: string, ctx: RequestContext): Promise<boolean> {
    const previous = await this.prisma.securityLog.findFirst({
      where: {
        userId,
        event: SecurityEventType.LOGIN_SUCCESS,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
      },
      select: { id: true },
    });
    return previous == null;
  }

  /** Histórico de eventos de segurança do utilizador (paginado). */
  async listLogs(userId: string, page: number, pageSize: number) {
    const skip = (page - 1) * pageSize;
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.securityLog.findMany({
        where: { userId },
        orderBy: { criadoEm: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.securityLog.count({ where: { userId } }),
    ]);
    return { rows, total };
  }
}

function revokedUserKey(userId: string): string {
  return `revoked_user:${userId}`;
}
