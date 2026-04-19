import assert from 'node:assert/strict';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import type { TestCase } from '../test/test-helpers';

interface FakeUserRecord {
  id: string;
  email: string;
  passwordHash: string;
  phone: string | null;
  emailVerified: boolean;
  role: UserRole;
  eliminadoEm: Date | null;
  cidadaoPerfil: {
    rgpdAccepted: boolean;
  } | null;
}

class FakeRedisClient {
  private readonly store = new Map<string, string>();

  async get(key: string): Promise<string | null> {
    return this.store.get(key) ?? null;
  }

  async set(key: string, value: string): Promise<'OK'> {
    this.store.set(key, value);
    return 'OK';
  }

  async del(key: string): Promise<number> {
    return this.store.delete(key) ? 1 : 0;
  }
}

class FakePrismaService {
  readonly users = new Map<string, FakeUserRecord>();
  readonly usersByEmail = new Map<string, FakeUserRecord>();
  private nextId = 1;

  readonly user = {
    findUnique: async (args: {
      where: { email?: string; id?: string };
      select?: Record<string, boolean>;
    }) => {
      const user = args.where.email
        ? this.usersByEmail.get(args.where.email)
        : this.users.get(args.where.id ?? '');

      if (!user) {
        return null;
      }

      if (args.select) {
        return selectFields(user, args.select);
      }

      return { ...user };
    },
    create: async (args: {
      data: {
        email: string;
        passwordHash: string;
        phone: string | null;
        role: UserRole;
        cidadaoPerfil: {
          create: {
            rgpdAccepted: boolean;
          };
        };
      };
    }) => {
      const user: FakeUserRecord = {
        id: `user-${this.nextId++}`,
        email: args.data.email,
        passwordHash: args.data.passwordHash,
        phone: args.data.phone,
        emailVerified: false,
        role: args.data.role,
        eliminadoEm: null,
        cidadaoPerfil: {
          rgpdAccepted: args.data.cidadaoPerfil.create.rgpdAccepted,
        },
      };

      this.users.set(user.id, user);
      this.usersByEmail.set(user.email, user);
      return { ...user };
    },
  };

  async $transaction<T>(callback: (tx: FakePrismaService) => Promise<T>): Promise<T> {
    return callback(this);
  }

  seedUser(user: FakeUserRecord): void {
    this.users.set(user.id, user);
    this.usersByEmail.set(user.email, user);
  }
}

class FakeRedisService {
  constructor(private readonly client: FakeRedisClient) {}

  getClient(): FakeRedisClient {
    return this.client;
  }
}

class FakeJwtService {
  private counter = 0;

  async signAsync(): Promise<string> {
    this.counter += 1;
    return `access-token-${this.counter}`;
  }
}

export const authServiceTests: TestCase[] = [
  {
    name: 'registers a citizen account and normalizes the email',
    run: async () => {
      process.env.REFRESH_TOKEN_TTL_DAYS = '7';
      process.env.BCRYPT_ROUNDS = '4';

      const prisma = new FakePrismaService();
      const service = new AuthService(
        prisma as never,
        new FakeRedisService(new FakeRedisClient()) as never,
        new FakeJwtService() as never,
      );

      const result = await service.register({
        email: 'Citizen@Example.com ',
        password: 'Password123!',
        phone: '+351910000000',
        rgpd_accepted: true,
      });

      assert.equal(result.email, 'citizen@example.com');
      assert.equal(result.role, 'CIDADAO');
      assert.equal(result.email_verified, false);

      const storedUser = prisma.usersByEmail.get('citizen@example.com');
      assert.ok(storedUser);
      assert.equal(storedUser.role, UserRole.CIDADAO);
      assert.equal(storedUser.cidadaoPerfil?.rgpdAccepted, true);
      assert.notEqual(storedUser.passwordHash, 'Password123!');
    },
  },
  {
    name: 'rejects duplicate registrations',
    run: async () => {
      process.env.REFRESH_TOKEN_TTL_DAYS = '7';
      process.env.BCRYPT_ROUNDS = '4';

      const prisma = new FakePrismaService();
      prisma.seedUser({
        id: 'user-1',
        email: 'citizen@example.com',
        passwordHash: 'hashed',
        phone: null,
        emailVerified: false,
        role: UserRole.CIDADAO,
        eliminadoEm: null,
        cidadaoPerfil: {
          rgpdAccepted: true,
        },
      });

      const service = new AuthService(
        prisma as never,
        new FakeRedisService(new FakeRedisClient()) as never,
        new FakeJwtService() as never,
      );

      await assert.rejects(
        () =>
          service.register({
            email: 'citizen@example.com',
            password: 'Password123!',
            rgpd_accepted: true,
          }),
        (error: unknown) =>
          error instanceof ConflictException &&
          error.message === 'Email already registered',
      );
    },
  },
  {
    name: 'creates a session on login and rotates refresh tokens',
    run: async () => {
      process.env.REFRESH_TOKEN_TTL_DAYS = '7';
      process.env.BCRYPT_ROUNDS = '4';

      const prisma = new FakePrismaService();
      const passwordHash = await bcrypt.hash('Password123!', 4);
      prisma.seedUser({
        id: 'user-42',
        email: 'citizen@example.com',
        passwordHash,
        phone: null,
        emailVerified: false,
        role: UserRole.CIDADAO,
        eliminadoEm: null,
        cidadaoPerfil: {
          rgpdAccepted: true,
        },
      });

      const redisClient = new FakeRedisClient();
      const service = new AuthService(
        prisma as never,
        new FakeRedisService(redisClient) as never,
        new FakeJwtService() as never,
      );

      const loginResult = await service.login({
        email: 'CITIZEN@example.com',
        password: 'Password123!',
      });

      assert.equal(loginResult.access_token, 'access-token-1');
      assert.equal(loginResult.requires_2fa, false);
      assert.equal(loginResult.pre_auth_token, null);
      assert.match(loginResult.refresh_token, /^user-42\.[a-f0-9]+$/);

      const firstSession = await redisClient.get('user:session:user-42');
      assert.ok(firstSession);

      const refreshResult = await service.refresh({
        refresh_token: loginResult.refresh_token,
      });

      assert.equal(refreshResult.access_token, 'access-token-2');
      assert.notEqual(refreshResult.refresh_token, loginResult.refresh_token);

      await assert.rejects(
        () =>
          service.refresh({
            refresh_token: loginResult.refresh_token,
          }),
        (error: unknown) =>
          error instanceof UnauthorizedException &&
          error.message === 'Invalid refresh token',
      );
    },
  },
  {
    name: 'clears the active session on logout',
    run: async () => {
      process.env.REFRESH_TOKEN_TTL_DAYS = '7';
      process.env.BCRYPT_ROUNDS = '4';

      const prisma = new FakePrismaService();
      const passwordHash = await bcrypt.hash('Password123!', 4);
      prisma.seedUser({
        id: 'user-77',
        email: 'citizen@example.com',
        passwordHash,
        phone: null,
        emailVerified: false,
        role: UserRole.CIDADAO,
        eliminadoEm: null,
        cidadaoPerfil: {
          rgpdAccepted: true,
        },
      });

      const redisClient = new FakeRedisClient();
      const service = new AuthService(
        prisma as never,
        new FakeRedisService(redisClient) as never,
        new FakeJwtService() as never,
      );

      const loginResult = await service.login({
        email: 'citizen@example.com',
        password: 'Password123!',
      });

      assert.ok(await redisClient.get('user:session:user-77'));

      await service.logout('user-77');

      assert.equal(await redisClient.get('user:session:user-77'), null);

      await assert.rejects(
        () =>
          service.refresh({
            refresh_token: loginResult.refresh_token,
          }),
        (error: unknown) =>
          error instanceof UnauthorizedException &&
          error.message === 'Invalid refresh token',
      );
    },
  },
  {
    name: 'rejects invalid credentials during login',
    run: async () => {
      process.env.REFRESH_TOKEN_TTL_DAYS = '7';
      process.env.BCRYPT_ROUNDS = '4';

      const prisma = new FakePrismaService();
      const passwordHash = await bcrypt.hash('Password123!', 4);
      prisma.seedUser({
        id: 'user-8',
        email: 'citizen@example.com',
        passwordHash,
        phone: null,
        emailVerified: false,
        role: UserRole.CIDADAO,
        eliminadoEm: null,
        cidadaoPerfil: {
          rgpdAccepted: true,
        },
      });

      const service = new AuthService(
        prisma as never,
        new FakeRedisService(new FakeRedisClient()) as never,
        new FakeJwtService() as never,
      );

      await assert.rejects(
        () =>
          service.login({
            email: 'citizen@example.com',
            password: 'WrongPassword123!',
          }),
        (error: unknown) =>
          error instanceof UnauthorizedException &&
          error.message === 'Invalid credentials',
      );
    },
  },
];

function selectFields<T extends object>(
  value: T,
  select: Record<string, boolean>,
): Partial<T> {
  const selectedEntries = Object.entries(select)
    .filter(([, enabled]) => enabled)
    .map(([key]) => [key, value[key as keyof T]]);

  return Object.fromEntries(selectedEntries) as Partial<T>;
}
