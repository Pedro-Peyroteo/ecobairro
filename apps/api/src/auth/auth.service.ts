import {
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@prisma/client';
import { readNumberEnv } from '@ecobairro/config';
import type {
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
import type { RefreshDto } from './dto/refresh.dto';
import type { RegisterDto } from './dto/register.dto';

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

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
