import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { RedisService } from '../redis/redis.service';
import type { CreateZonaDto } from './dto/create-zona.dto';
import type {
  ZonaListItem,
  ZonaDetail,
} from '@ecobairro/contracts';

const ZONA_TTL = 60 * 60; // 60 min
const ZONAS_LISTA_TTL = 30 * 60; // 30 min
const ZONAS_LISTA_KEY = 'zonas:ativas:lista';

@Injectable()
export class ZonasService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(RedisService) private readonly redis: RedisService,
  ) {}

  async listActive(): Promise<ZonaListItem[]> {
    const client = this.redis.getClient();
    const cached = await client.get(ZONAS_LISTA_KEY);
    if (cached) return JSON.parse(cached) as ZonaListItem[];

    // Geography columns excluded from Prisma select — use raw for geometria summary
    const zonas = await this.prisma.zona.findMany({
      where: { ativa: true },
      select: {
        id: true,
        nome: true,
        tipo: true,
        ativa: true,
        entidadeResponsavel: true,
      },
      orderBy: { nome: 'asc' },
    });

    const result: ZonaListItem[] = zonas.map((z) => ({
      id: z.id,
      nome: z.nome,
      tipo: z.tipo as string,
      ativa: z.ativa,
      entidade_responsavel: z.entidadeResponsavel ?? null,
    }));

    await client.set(ZONAS_LISTA_KEY, JSON.stringify(result), 'EX', ZONAS_LISTA_TTL);
    return result;
  }

  async findOne(id: string): Promise<ZonaDetail> {
    const client = this.redis.getClient();
    const cacheKey = `zona:${id}`;
    const cached = await client.get(cacheKey);
    if (cached) return JSON.parse(cached) as ZonaDetail;

    const zona = await this.prisma.zona.findUnique({
      where: { id },
      select: {
        id: true,
        nome: true,
        descricao: true,
        tipo: true,
        ativa: true,
        limiteAntispamReports: true,
        janelaAntispamHoras: true,
        entidadeResponsavel: true,
        alertasConfig: true,
        criadoEm: true,
        atualizadoEm: true,
      },
    });

    if (!zona) throw new NotFoundException(`Zona ${id} não encontrada`);

    const result: ZonaDetail = {
      id: zona.id,
      nome: zona.nome,
      descricao: zona.descricao ?? null,
      tipo: zona.tipo as string,
      ativa: zona.ativa,
      limite_antispam_reports: zona.limiteAntispamReports,
      janela_antispam_horas: zona.janelaAntispamHoras,
      entidade_responsavel: zona.entidadeResponsavel ?? null,
      alertas_config: zona.alertasConfig as Record<string, unknown>,
      criado_em: zona.criadoEm.toISOString(),
      atualizado_em: zona.atualizadoEm.toISOString(),
    };

    await client.set(cacheKey, JSON.stringify(result), 'EX', ZONA_TTL);
    return result;
  }

  async create(input: CreateZonaDto): Promise<ZonaDetail> {
    if (!input.nome?.trim()) {
      throw new BadRequestException('Nome da zona é obrigatório');
    }

    // geometria (NOT NULL GEOGRAPHY) must be provided via raw SQL.
    // Default to an empty multipolygon placeholder if not supplied;
    // the caller should update the geometry via a subsequent PATCH or raw migration.
    const rows = await this.prisma.$queryRaw<[{ id: string }]>`
      INSERT INTO zonas
        (nome, descricao, geometria, tipo, ativa,
         limite_antispam_reports, janela_antispam_horas,
         entidade_responsavel, alertas_config, criado_em, atualizado_em)
      VALUES (
        ${input.nome.trim()},
        ${input.descricao ?? null},
        ST_GeomFromText('MULTIPOLYGON EMPTY', 4326)::geography,
        ${input.tipo}::"ZonaTipo",
        ${input.ativa ?? true},
        ${input.limiteAntispamReports ?? 2},
        ${input.janelaAntispamHoras ?? 24},
        ${input.entidadeResponsavel ?? null},
        ${JSON.stringify(input.alertasConfig ?? {})}::jsonb,
        now(), now()
      )
      RETURNING id
    `;

    const id = rows[0]!.id;
    await this.invalidateZonaCache(id);
    return this.findOne(id);
  }

  async update(id: string, input: Partial<CreateZonaDto>): Promise<ZonaDetail> {
    const existing = await this.prisma.zona.findUnique({ where: { id }, select: { id: true } });
    if (!existing) throw new NotFoundException(`Zona ${id} não encontrada`);

    await this.prisma.zona.update({
      where: { id },
      data: {
        ...(input.nome !== undefined && { nome: input.nome.trim() }),
        ...(input.descricao !== undefined && { descricao: input.descricao }),
        ...(input.tipo !== undefined && { tipo: input.tipo as import('@prisma/client').ZonaTipo }),
        ...(input.ativa !== undefined && { ativa: input.ativa }),
        ...(input.limiteAntispamReports !== undefined && {
          limiteAntispamReports: input.limiteAntispamReports,
        }),
        ...(input.janelaAntispamHoras !== undefined && {
          janelaAntispamHoras: input.janelaAntispamHoras,
        }),
        ...(input.entidadeResponsavel !== undefined && {
          entidadeResponsavel: input.entidadeResponsavel,
        }),
        ...(input.alertasConfig !== undefined && {
          alertasConfig: input.alertasConfig as import('@prisma/client').Prisma.InputJsonValue,
        }),
      },
    });

    await this.invalidateZonaCache(id);
    return this.findOne(id);
  }

  private async invalidateZonaCache(id: string): Promise<void> {
    const client = this.redis.getClient();
    await client.del(`zona:${id}`, ZONAS_LISTA_KEY);
  }
}
