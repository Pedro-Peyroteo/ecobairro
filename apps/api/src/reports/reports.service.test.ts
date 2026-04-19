import assert from 'node:assert/strict';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ReportsService } from './reports.service';
import type { TestCase } from '../test/test-helpers';
import { runSuite } from '../test/test-helpers';

// ── Minimal fakes ─────────────────────────────────────────────────────────────

class FakeRedisClient {
  private readonly store = new Map<string, string>();

  async get(key: string): Promise<string | null> { return this.store.get(key) ?? null; }
  async set(key: string, value: string, ...args: unknown[]): Promise<'OK'> {
    void args;
    this.store.set(key, value);
    return 'OK';
  }
  async del(...keys: string[]): Promise<number> {
    let n = 0;
    for (const k of keys) if (this.store.delete(k)) n++;
    return n;
  }
  async incr(key: string): Promise<number> {
    const v = parseInt(this.store.get(key) ?? '0', 10) + 1;
    this.store.set(key, String(v));
    return v;
  }
  async expire(key: string, seconds: number): Promise<number> {
    void key; void seconds; return 1;
  }
}

class FakeRedisService {
  readonly client = new FakeRedisClient();
  getClient() { return this.client; }
}

const ZONA_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const CIDADAO_ID = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

type RawRow = Record<string, unknown>;

class FakePrismaService {
  readonly reports = new Map<string, RawRow>();
  readonly reportTimelineEntries: unknown[] = [];

  $queryRaw<T>(strings: TemplateStringsArray): Promise<T> {
    const sql = strings.join('?');

    if (sql.includes('FROM zonas')) {
      return Promise.resolve([{ id: ZONA_ID }] as unknown as T);
    }

    if (sql.includes('ST_DWithin') && sql.includes('FROM reports')) {
      return Promise.resolve([] as unknown as T);
    }

    if (sql.includes('INSERT INTO reports')) {
      const id = `rep-${Math.random().toString(36).slice(2)}`;
      this.reports.set(id, { id, cidadao_id: CIDADAO_ID, estado: 'RECEBIDO', num_subscricoes: 0 });
      return Promise.resolve([{ id }] as unknown as T);
    }

    if (sql.includes('FROM reports')) {
      const id = [...this.reports.keys()][0];
      const r = id ? this.reports.get(id) : undefined;
      if (!r) return Promise.resolve([] as unknown as T);
      return Promise.resolve([{
        id: r['id'],
        numero: 1n,
        cidadao_id: r['cidadao_id'],
        ecoponto_id: null,
        zona_id: ZONA_ID,
        categoria: 'OUTRO',
        descricao: null,
        lat: 40.6405,
        lng: -8.6538,
        localizacao_manual: false,
        foto_url: null,
        estado: r['estado'],
        motivo_rejeicao: null,
        entidade_responsavel: null,
        atribuido_a: null,
        report_pai_id: null,
        num_subscricoes: 0,
        criado_em: new Date(),
        atualizado_em: new Date(),
      }] as unknown as T);
    }

    return Promise.resolve([] as unknown as T);
  }

  $executeRaw(): Promise<number> { return Promise.resolve(1); }

  readonly report = {
    findUnique: ({ where }: { where: { id: string } }) => {
      const r = this.reports.get(where.id);
      if (!r) return Promise.resolve(null);
      return Promise.resolve({ id: r['id'] as string, estado: r['estado'] as string, eliminadoEm: null });
    },
    update: ({ where, data }: { where: { id: string }; data: RawRow }) => {
      const r = this.reports.get(where.id);
      if (r) Object.assign(r, data);
      return Promise.resolve(r ?? null);
    },
  };

  readonly reportTimeline = {
    create: (args: unknown) => {
      this.reportTimelineEntries.push(args);
      return Promise.resolve(args);
    },
    findMany: () => Promise.resolve([]),
  };

  readonly reportSubscricao = {
    upsert: () => Promise.resolve({}),
  };

  readonly zona = {
    findUnique: ({ where }: { where: { id: string } }) => Promise.resolve({
      id: where.id,
      limiteAntispamReports: 2,
      janelaAntispamHoras: 24,
    }),
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

const fakeAudit = { log: () => undefined } as unknown as import('../audit/audit.service').AuditService;

function buildService(queryOverride?: FakePrismaService['$queryRaw']) {
  const prisma = new FakePrismaService();
  if (queryOverride) prisma.$queryRaw = queryOverride;
  const redis = new FakeRedisService();
  return new ReportsService(
    prisma as unknown as import('../database/prisma.service').PrismaService,
    redis as unknown as import('../redis/redis.service').RedisService,
    fakeAudit,
  );
}

const tests: TestCase[] = [
  {
    name: 'create — returns report when no duplicate exists',
    async run() {
      const svc = buildService();
      const result = await svc.create(
        { categoria: 'OUTRO' as import('./dto/create-report.dto').ReportCategoriaDto, latitude: 40.64, longitude: -8.65 },
        CIDADAO_ID,
      );
      assert.ok(result.report, 'should return a report');
      assert.equal(result.duplicado, undefined);
    },
  },
  {
    name: 'create — returns duplicado when open report exists nearby',
    async run() {
      const override: FakePrismaService['$queryRaw'] = function<T>(strings: TemplateStringsArray): Promise<T> {
        const sql = strings.join('?');
        if (sql.includes('FROM zonas')) return Promise.resolve([{ id: ZONA_ID }] as unknown as T);
        if (sql.includes('ST_DWithin')) return Promise.resolve([{ id: 'existing-id', numero: 5n }] as unknown as T);
        return Promise.resolve([] as unknown as T);
      };
      const svc = buildService(override);
      const result = await svc.create(
        { categoria: 'OUTRO' as import('./dto/create-report.dto').ReportCategoriaDto, latitude: 40.64, longitude: -8.65 },
        CIDADAO_ID,
      );
      assert.ok(result.duplicado, 'should return a duplicado hint');
      assert.equal(result.report, undefined);
    },
  },
  {
    name: 'create — throws BadRequest when antispam limit reached',
    async run() {
      const redis = new FakeRedisService();
      await redis.client.set(`antispam:report:${CIDADAO_ID}:${ZONA_ID}`, '2');
      const prisma = new FakePrismaService();
      const svc = new ReportsService(
        prisma as unknown as import('../database/prisma.service').PrismaService,
        redis as unknown as import('../redis/redis.service').RedisService,
        fakeAudit,
      );
      await assert.rejects(
        () => svc.create({ categoria: 'OUTRO' as import('./dto/create-report.dto').ReportCategoriaDto, latitude: 40.64, longitude: -8.65 }, CIDADAO_ID),
        BadRequestException,
      );
    },
  },
  {
    name: 'findOne — throws NotFound for unknown id',
    async run() {
      const svc = buildService();
      await assert.rejects(() => svc.findOne('unknown-id'), NotFoundException);
    },
  },
];

export async function runReportsTests(): Promise<number> {
  return runSuite('ReportsService', tests);
}
