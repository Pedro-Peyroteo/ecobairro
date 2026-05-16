import {
  ConflictException,
  Inject,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@prisma/client';
import { readNumberEnv } from '@ecobairro/config';
import type {
  AuthMeResponse,
  ForgotPasswordResponse,
  LoginResponse,
  RegisterResponse,
  UserRole as ContractUserRole,
} from '@ecobairro/contracts';
import { randomBytes, createHash } from 'crypto';
import bcrypt from 'bcrypt';
import { PrismaService } from '../database/prisma.service';
import { RedisService } from '../redis/redis.service';
import type { JwtPayload } from './auth.types';
import type { LoginDto } from './dto/login.dto';
import type { ForgotPasswordDto } from './dto/forgot-password.dto';
import type { RefreshDto } from './dto/refresh.dto';
import type { RegisterDto } from './dto/register.dto';
import type { ResetPasswordDto } from './dto/reset-password.dto';
import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

interface StoredSession {
  refreshTokenHash: string;
}

@Injectable()
export class AuthService {
  private readonly prisma: PrismaService;
  private readonly redisService: RedisService;
  private readonly jwtService: JwtService;
  private readonly refreshTokenTtlSeconds =
    readNumberEnv('REFRESH_TOKEN_TTL_DAYS', 7) * 24 * 60 * 60;
  private readonly bcryptRounds = readNumberEnv('BCRYPT_ROUNDS', 12);
  private readonly resetPasswordTtlSeconds =
    readNumberEnv('PASSWORD_RESET_TTL_MINUTES', 30) * 60;
  private readonly smtpHost = process.env.SMTP_HOST?.trim();
  private readonly smtpPort = readNumberEnv('SMTP_PORT', 587);
  private readonly smtpUser = process.env.SMTP_USER?.trim();
  private readonly smtpPass = process.env.SMTP_PASS;
  private readonly smtpFrom = process.env.SMTP_FROM?.trim();
  private readonly smtpSecure = (process.env.SMTP_SECURE ?? 'false') === 'true';
  private readonly appBaseUrl = (process.env.APP_BASE_URL ?? 'http://localhost:8080').replace(/\/$/, '');
  private readonly returnResetToken =
    (process.env.PASSWORD_RESET_RETURN_TOKEN ?? 'false') === 'true';
  private mailer: Transporter | null = null;

  constructor(
    @Inject(PrismaService) prisma: PrismaService,
    @Inject(RedisService) redisService: RedisService,
    @Inject(JwtService) jwtService: JwtService,
  ) {
    this.prisma = prisma;
    this.redisService = redisService;
    this.jwtService = jwtService;
  }

  async register(input: RegisterDto): Promise<RegisterResponse> {
    const normalizedEmail = input.email.trim().toLowerCase();
    const existingUser = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(input.password, this.bcryptRounds);

    const user = await this.prisma.$transaction(async (tx) =>
      tx.user.create({
        data: {
          email: normalizedEmail,
          passwordHash,
          phone: input.phone ?? null,
          role: UserRole.CIDADAO,
          cidadaoPerfil: {
            create: {
              rgpdAccepted: input.rgpd_accepted,
            },
          },
        },
      }),
    );

    return {
      id: user.id,
      email: user.email,
      role: user.role as ContractUserRole,
      email_verified: user.emailVerified,
    };
  }

  async login(input: LoginDto): Promise<LoginResponse> {
    const normalizedEmail = input.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user || user.eliminadoEm) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(input.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.issueSession(user.id, user.role as ContractUserRole);
  }

  async refresh(input: RefreshDto): Promise<LoginResponse> {
    const userId = extractUserIdFromRefreshToken(input.refresh_token);
    if (!userId) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const redis = this.redisService.getClient();
    const rawSession = await redis.get(getUserSessionKey(userId));

    if (!rawSession) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const session = JSON.parse(rawSession) as StoredSession;
    if (session.refreshTokenHash !== hashToken(input.refresh_token)) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        eliminadoEm: true,
      },
    });

    if (!user || user.eliminadoEm) {
      await redis.del(getUserSessionKey(userId));
      throw new UnauthorizedException('Invalid refresh token');
    }

    return this.issueSession(user.id, user.role as ContractUserRole);
  }

  async logout(userId: string): Promise<void> {
    await this.redisService.getClient().del(getUserSessionKey(userId));
  }

  async me(userId: string): Promise<AuthMeResponse> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        emailVerified: true,
        eliminadoEm: true,
      },
    });

    if (!user || user.eliminadoEm) {
      throw new UnauthorizedException('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role as ContractUserRole,
      email_verified: user.emailVerified,
    };
  }

  async forgotPassword(input: ForgotPasswordDto): Promise<ForgotPasswordResponse> {
    const normalizedEmail = input.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, eliminadoEm: true },
    });

    if (!user || user.eliminadoEm) {
      return { ok: true };
    }

    const rawToken = randomBytes(24).toString('hex');
    await this.redisService
      .getClient()
      .set(
        getPasswordResetKey(rawToken),
        user.id,
        'EX',
        this.resetPasswordTtlSeconds,
      );

    const smtpConfigured = this.isPasswordEmailConfigured();

    if (smtpConfigured && process.env.NODE_ENV !== 'test') {
      await this.sendPasswordResetEmail(normalizedEmail, rawToken);
    }

    if (
      process.env.NODE_ENV === 'test' ||
      this.returnResetToken ||
      (!smtpConfigured && process.env.NODE_ENV !== 'production')
    ) {
      return { ok: true, reset_token: rawToken };
    }

    return { ok: true };
  }

  async resetPassword(input: ResetPasswordDto): Promise<void> {
    const resetKey = getPasswordResetKey(input.token);
    const redis = this.redisService.getClient();
    const userId = await redis.get(resetKey);

    if (!userId) {
      throw new UnauthorizedException('Invalid or expired reset token');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, eliminadoEm: true },
    });

    if (!user || user.eliminadoEm) {
      await redis.del(resetKey);
      throw new UnauthorizedException('Invalid or expired reset token');
    }

    const passwordHash = await bcrypt.hash(input.new_password, this.bcryptRounds);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    await Promise.all([
      redis.del(resetKey),
      redis.del(getUserSessionKey(userId)),
    ]);
  }

  private async issueSession(
    userId: string,
    role: ContractUserRole,
  ): Promise<LoginResponse> {
    const accessToken = await this.jwtService.signAsync({
      sub: userId,
      role,
    } satisfies JwtPayload);

    const refreshToken = `${userId}.${randomBytes(32).toString('hex')}`;
    const session: StoredSession = {
      refreshTokenHash: hashToken(refreshToken),
    };

    await this.redisService
      .getClient()
      .set(
        getUserSessionKey(userId),
        JSON.stringify(session),
        'EX',
        this.refreshTokenTtlSeconds,
      );

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      requires_2fa: false,
      pre_auth_token: null,
    };
  }

  private isPasswordEmailConfigured(): boolean {
    return !!(this.smtpHost && this.smtpUser && this.smtpPass && this.smtpFrom);
  }

  private getMailer(): Transporter {
    if (!this.isPasswordEmailConfigured()) {
      throw new ServiceUnavailableException(
        'Password recovery email service is not configured',
      );
    }

    if (!this.mailer) {
      this.mailer = nodemailer.createTransport({
        host: this.smtpHost!,
        port: this.smtpPort,
        secure: this.smtpSecure,
        auth: {
          user: this.smtpUser!,
          pass: this.smtpPass!,
        },
      });
    }

    return this.mailer;
  }

  private async sendPasswordResetEmail(email: string, rawToken: string): Promise<void> {
    const resetUrl = `${this.appBaseUrl}/reset-password?token=${encodeURIComponent(rawToken)}`;

    await this.getMailer().sendMail({
      from: this.smtpFrom!,
      to: email,
      subject: 'ecoBairro - Recuperacao de password',
      text: [
        'Recebemos um pedido para redefinir a sua password.',
        `Use este link para redefinir: ${resetUrl}`,
        `Este link expira em ${Math.floor(this.resetPasswordTtlSeconds / 60)} minutos.`,
      ].join('\n'),
      html: [
        '<p>Recebemos um pedido para redefinir a sua password.</p>',
        `<p><a href="${resetUrl}">Clique aqui para redefinir a password</a></p>`,
        `<p>Este link expira em ${Math.floor(this.resetPasswordTtlSeconds / 60)} minutos.</p>`,
      ].join(''),
    });
  }
}

function getUserSessionKey(userId: string): string {
  return `user:session:${userId}`;
}

function extractUserIdFromRefreshToken(token: string): string | null {
  const [userId, randomPart] = token.split('.');

  if (!userId || !randomPart) {
    return null;
  }

  return userId;
}

function getPasswordResetKey(rawToken: string): string {
  return `user:reset:${hashToken(rawToken)}`;
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
