import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SecurityEventType, UserRole } from '@prisma/client';
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
import { MailService } from '../mail/mail.service';
import { SecurityService, type RequestContext } from '../security/security.service';
import { SessionService } from '../security/session.service';
import { TwoFactorService } from './two-factor.service';
import type { VerifyTwoFactorDto } from './dto/verify-two-factor.dto';

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
  private readonly appBaseUrl = (process.env.APP_BASE_URL ?? 'http://localhost:8080').replace(/\/$/, '');
  private readonly returnResetToken =
    (process.env.PASSWORD_RESET_RETURN_TOKEN ?? 'false') === 'true';
  private readonly mailService: MailService;
  private readonly securityService: SecurityService;
  private readonly sessionService: SessionService;
  private readonly twoFactorService: TwoFactorService;

  constructor(
    @Inject(PrismaService) prisma: PrismaService,
    @Inject(RedisService) redisService: RedisService,
    @Inject(JwtService) jwtService: JwtService,
    @Inject(MailService) mailService: MailService,
    @Inject(SecurityService) securityService: SecurityService,
    @Inject(SessionService) sessionService: SessionService,
    @Inject(TwoFactorService) twoFactorService: TwoFactorService,
  ) {
    this.prisma = prisma;
    this.redisService = redisService;
    this.jwtService = jwtService;
    this.mailService = mailService;
    this.securityService = securityService;
    this.sessionService = sessionService;
    this.twoFactorService = twoFactorService;
  }

  async register(input: RegisterDto, _ctx?: RequestContext): Promise<RegisterResponse> {
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

    // Enviar email de boas-vindas (best-effort, não bloqueia o registo)
    if (this.isPasswordEmailConfigured()) {
      this.mailService
        .send('welcome', {
          to: user.email,
          subject: 'ecoBairro — Bem-vindo!',
          variables: { appUrl: this.appBaseUrl },
        })
        .catch(() => undefined);
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role as ContractUserRole,
      email_verified: user.emailVerified,
    };
  }

  async login(input: LoginDto, ctx: RequestContext): Promise<LoginResponse> {
    const normalizedEmail = input.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user || user.eliminadoEm) {
      throw new UnauthorizedException('Email ou password incorrectos.');
    }

    // Account lockout: rejeita imediatamente sem revelar se a password é boa
    if (this.securityService.isLocked(user.lockedUntil)) {
      const minutes = this.securityService.minutesUntilUnlock(user.lockedUntil);
      throw new ForbiddenException(
        `Conta bloqueada temporariamente. Tente novamente em ${minutes} minutos.`,
      );
    }

    const isPasswordValid = await bcrypt.compare(input.password, user.passwordHash);

    if (!isPasswordValid) {
      await this.securityService.log(user.id, SecurityEventType.LOGIN_FAILED, ctx);
      const { justLocked } = await this.securityService.registerFailedAttempt(user.id);
      if (justLocked) {
        await this.securityService.log(user.id, SecurityEventType.ACCOUNT_LOCKED, ctx);
        await this.sendAccountLockedEmail(user.email).catch(() => undefined);
      }
      throw new UnauthorizedException('Email ou password incorrectos.');
    }

    // Login ok: audit + clear lockout + detectar novo dispositivo
    const newDevice = await this.securityService.isNewDevice(user.id, ctx);
    await this.securityService.resetFailedAttempts(user.id);
    await this.securityService.log(user.id, SecurityEventType.LOGIN_SUCCESS, ctx);
    await this.securityService.clearRevocation(user.id);

    if (newDevice) {
      await this.sendNewDeviceEmail(user.email, ctx).catch(() => undefined);
    }

    // 2FA: emite pre-auth token e devolve requires_2fa = true
    if (user.twoFactorEnabled) {
      const preAuthToken = await this.twoFactorService.issuePreAuthToken(user.id);
      return {
        access_token: '',
        refresh_token: '',
        requires_2fa: true,
        pre_auth_token: preAuthToken,
      };
    }

    return this.issueSession(user.id, user.role as ContractUserRole, ctx);
  }

  /**
   * Segundo passo do login: consome o pre-auth token + verifica o
   * código TOTP (ou backup code). Devolve sessão completa.
   */
  async verifyTwoFactor(
    input: VerifyTwoFactorDto,
    ctx: RequestContext,
  ): Promise<LoginResponse> {
    const userId = await this.twoFactorService.consumePreAuthToken(
      input.pre_auth_token,
    );
    if (!userId) {
      throw new UnauthorizedException('Sessão de 2FA expirada. Faça login novamente.');
    }

    const ok = await this.twoFactorService.verifyLoginCode(userId, input.code);
    if (!ok) {
      await this.securityService.log(userId, SecurityEventType.LOGIN_FAILED, ctx);
      throw new UnauthorizedException('Código 2FA inválido.');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, eliminadoEm: true, lockedUntil: true },
    });
    if (!user || user.eliminadoEm || this.securityService.isLocked(user.lockedUntil)) {
      throw new UnauthorizedException('Sessão inválida. Faça login novamente.');
    }

    await this.securityService.log(userId, SecurityEventType.LOGIN_SUCCESS, ctx);
    return this.issueSession(user.id, user.role as ContractUserRole, ctx);
  }

  async refresh(input: RefreshDto, ctx: RequestContext): Promise<LoginResponse> {
    const rotated = await this.sessionService.rotate(input.refresh_token);
    if (!rotated) {
      // Reuse detection: token usado/inexistente → revoga toda a cadeia
      const possibleUserId = extractUserIdFromRefreshToken(input.refresh_token);
      if (possibleUserId) {
        await this.sessionService.revokeAll(possibleUserId);
        await this.securityService.revokeUser(possibleUserId);
        await this.securityService
          .log(possibleUserId, SecurityEventType.DEVICE_REVOKED, ctx)
          .catch(() => undefined);
      }
      throw new UnauthorizedException('Sessão inválida. Faça login novamente.');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: rotated.userId },
      select: { id: true, role: true, eliminadoEm: true, lockedUntil: true },
    });

    if (!user || user.eliminadoEm || this.securityService.isLocked(user.lockedUntil)) {
      throw new UnauthorizedException('Sessão inválida. Faça login novamente.');
    }

    return this.issueSession(user.id, user.role as ContractUserRole, ctx);
  }

  async logout(userId: string): Promise<void> {
    await this.sessionService.revokeAll(userId);
    await this.securityService.revokeUser(userId);
    // Compat com o fluxo antigo (1 sessão por user em Redis)
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
      this.sessionService.revokeAll(userId),
      this.securityService.revokeUser(userId),
      this.securityService
        .log(userId, SecurityEventType.PASSWORD_CHANGED, {
          ipAddress: 'reset-flow',
          userAgent: null,
        })
        .catch(() => undefined),
    ]);
  }

  private async issueSession(
    userId: string,
    role: ContractUserRole,
    ctx: RequestContext,
  ): Promise<LoginResponse> {
    const accessToken = await this.jwtService.signAsync({
      sub: userId,
      role,
    } satisfies JwtPayload);

    const refreshToken = `${userId}.${randomBytes(32).toString('hex')}`;

    // Persistir ActiveSession (multi-sessão por user, suporta revogação remota)
    await this.sessionService.create(userId, refreshToken, ctx);

    // Compat: continuar a guardar a "última sessão" em Redis para fluxos legacy
    const session: StoredSession = { refreshTokenHash: hashToken(refreshToken) };
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

  private async sendAccountLockedEmail(email: string): Promise<void> {
    if (!this.isPasswordEmailConfigured()) return;
    await this.mailService.send('account-locked', {
      to: email,
      subject: 'ecoBairro — Conta bloqueada temporariamente',
      variables: { minutes: 30 },
    });
  }

  private async sendNewDeviceEmail(email: string, ctx: RequestContext): Promise<void> {
    if (!this.isPasswordEmailConfigured()) return;
    await this.mailService.send('new-device-login', {
      to: email,
      subject: 'ecoBairro — Novo dispositivo detectado',
      variables: {
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent ?? 'desconhecido',
        dateTime: new Date().toISOString(),
      },
    });
  }

  private isPasswordEmailConfigured(): boolean {
    return !!process.env.SMTP_HOST?.trim();
  }

  private async sendPasswordResetEmail(email: string, rawToken: string): Promise<void> {
    if (!this.isPasswordEmailConfigured()) {
      throw new ServiceUnavailableException(
        'Password recovery email service is not configured',
      );
    }
    const resetUrl = `${this.appBaseUrl}/reset-password?token=${encodeURIComponent(rawToken)}`;
    await this.mailService.send('password-reset', {
      to: email,
      subject: 'ecoBairro — Recuperação de password',
      variables: {
        resetUrl,
        expiresMinutes: Math.floor(this.resetPasswordTtlSeconds / 60),
      },
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
