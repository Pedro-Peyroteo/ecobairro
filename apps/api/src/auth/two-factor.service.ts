import { Inject, Injectable } from '@nestjs/common';
import { generateSecret, generateURI, verifySync } from 'otplib';
import * as QRCode from 'qrcode';
import { randomBytes, createHash } from 'crypto';
import bcrypt from 'bcrypt';
import { readNumberEnv } from '@ecobairro/config';
import { PrismaService } from '../database/prisma.service';
import { RedisService } from '../redis/redis.service';

const ISSUER = process.env.TOTP_ISSUER ?? 'ecoBairro';
const BACKUP_CODES_COUNT = 8;
const PRE_AUTH_TTL_SECONDS = readNumberEnv('TWO_FA_PRE_AUTH_TTL_MINUTES', 5) * 60;
const BCRYPT_ROUNDS = readNumberEnv('BCRYPT_ROUNDS', 12);

/**
 * Núcleo do 2FA: gera secrets TOTP, QR codes, verifica tokens
 * (incluindo backup codes), e gere o pre-auth token (login 2-step)
 * armazenado em Redis.
 */
@Injectable()
export class TwoFactorService {
  private readonly prisma: PrismaService;
  private readonly redis: RedisService;

  constructor(
    @Inject(PrismaService) prisma: PrismaService,
    @Inject(RedisService) redis: RedisService,
  ) {
    this.prisma = prisma;
    this.redis = redis;
  }

  /** Gera um secret TOTP base32 e o respectivo QR code (data URL). */
  async generateSetup(
    userId: string,
    email: string,
  ): Promise<{ secret: string; otpauthUrl: string; qrCodeDataUrl: string }> {
    const secret = generateSecret();
    const otpauthUrl = generateURI({
      issuer: ISSUER,
      label: `${ISSUER}:${email}`,
      secret,
    });
    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 220,
    });

    // Guardar o secret em modo "pending" no Redis — não persistimos
    // em User até que o utilizador prove que conseguiu importar para o app.
    await this.redis
      .getClient()
      .set(pendingSecretKey(userId), secret, 'EX', PRE_AUTH_TTL_SECONDS);

    return { secret, otpauthUrl, qrCodeDataUrl };
  }

  /** Verifica um código TOTP contra um secret (tolerância ±30s para drift de relógio). */
  verifyToken(token: string, secret: string): boolean {
    try {
      const result = verifySync({ token, secret, epochTolerance: 30 });
      return result.valid;
    } catch {
      return false;
    }
  }

  /**
   * Confirma o setup: valida o código contra o secret pending,
   * gera backup codes, persiste no User. Devolve os backup codes
   * em plaintext (única vez que aparecem ao utilizador).
   */
  async enable(
    userId: string,
    code: string,
  ): Promise<{ backupCodes: string[] } | null> {
    const secret = await this.redis.getClient().get(pendingSecretKey(userId));
    if (!secret) return null;

    if (!this.verifyToken(code, secret)) return null;

    const backupCodes = generateBackupCodes(BACKUP_CODES_COUNT);
    const hashed = await Promise.all(
      backupCodes.map((c) => bcrypt.hash(c, BCRYPT_ROUNDS)),
    );

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: true,
        twoFactorType: 'TOTP_APP',
        twoFactorSecret: secret,
        backupCodes: hashed,
      },
    });

    await this.redis.getClient().del(pendingSecretKey(userId));

    return { backupCodes };
  }

  /** Desativa o 2FA do utilizador (limpa secret + backup codes). */
  async disable(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorType: 'NONE',
        twoFactorSecret: null,
        backupCodes: [],
      },
    });
  }

  /**
   * Verifica um código no fluxo de login. Aceita TOTP **ou** um backup code.
   * Se for backup code, remove-o da lista (one-time).
   */
  async verifyLoginCode(userId: string, code: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { twoFactorSecret: true, backupCodes: true },
    });
    if (!user || !user.twoFactorSecret) return false;

    // 1) TOTP (6 dígitos)
    if (code.length === 6 && /^\d+$/.test(code)) {
      if (this.verifyToken(code, user.twoFactorSecret)) return true;
    }

    // 2) Backup code — testar contra cada hash, remover ao acertar
    for (let i = 0; i < user.backupCodes.length; i++) {
      const hash = user.backupCodes[i];
      if (!hash) continue;
      const ok = await bcrypt.compare(code, hash);
      if (ok) {
        const remaining = [
          ...user.backupCodes.slice(0, i),
          ...user.backupCodes.slice(i + 1),
        ];
        await this.prisma.user.update({
          where: { id: userId },
          data: { backupCodes: remaining },
        });
        return true;
      }
    }

    return false;
  }

  /** Regenera os 8 backup codes (invalida os anteriores). */
  async regenerateBackupCodes(userId: string): Promise<string[]> {
    const codes = generateBackupCodes(BACKUP_CODES_COUNT);
    const hashed = await Promise.all(
      codes.map((c) => bcrypt.hash(c, BCRYPT_ROUNDS)),
    );
    await this.prisma.user.update({
      where: { id: userId },
      data: { backupCodes: hashed },
    });
    return codes;
  }

  /** Quantos backup codes restam (sem revelar quais). */
  async backupCodesRemaining(userId: string): Promise<number> {
    const u = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { backupCodes: true },
    });
    return u?.backupCodes.length ?? 0;
  }

  // ─── Pre-auth token (login 2-step) ────────────────────────────────────────

  /** Gera um token opaco de 5 min que prova "passou a fase 1 do login". */
  async issuePreAuthToken(userId: string): Promise<string> {
    const raw = randomBytes(32).toString('hex');
    await this.redis
      .getClient()
      .set(preAuthKey(raw), userId, 'EX', PRE_AUTH_TTL_SECONDS);
    return raw;
  }

  /**
   * Fix #4 — Lê o pre-auth token SEM o consumir (peek).
   * Usar antes de validar o código 2FA — só consumir se o código for correto,
   * para não forçar novo login em caso de dígito errado.
   */
  async peekPreAuthToken(token: string): Promise<string | null> {
    if (!token) return null;
    return this.redis.getClient().get(preAuthKey(token));
  }

  /** Consome o pre-auth token (one-time use). Chamar apenas após validação com sucesso. */
  async consumePreAuthToken(token: string): Promise<void> {
    if (!token) return;
    await this.redis.getClient().del(preAuthKey(token));
  }
}

function generateBackupCodes(count: number): string[] {
  // 10 caracteres alfanuméricos maiúsculos, sem 0/O/1/I para legibilidade
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    const bytes = randomBytes(10);
    let s = '';
    for (let j = 0; j < 10; j++) {
      const byte = bytes[j] ?? 0;
      s += alphabet[byte % alphabet.length];
    }
    // Formato XXXXX-XXXXX para facilitar a leitura
    out.push(`${s.slice(0, 5)}-${s.slice(5)}`);
  }
  return out;
}

function pendingSecretKey(userId: string): string {
  return `2fa:pending:${userId}`;
}

function preAuthKey(token: string): string {
  // Guarda hash do token no Redis para que um snapshot não revele tokens
  const h = createHash('sha256').update(token).digest('hex');
  return `2fa:preauth:${h}`;
}
