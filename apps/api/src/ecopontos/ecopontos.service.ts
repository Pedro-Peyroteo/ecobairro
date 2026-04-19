import {
  Injectable,
  Inject,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { RedisService } from '../redis/redis.service';
import { AuditService } from '../audit/audit.service';
import type { CreateEcopontoDto } from './dto/create-ecoponto.dto';
import type { EcopontoDetail, EcopontoListItem } from '@ecobairro/contracts';

const ECOPONTO_TTL = 2 * 60; // 2 min — IoT updates frequently

@Injectable()
export class EcopontosService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(RedisService) private readonly redis: RedisService,
    @Inject(AuditService) private readonly audit: AuditService,
  ) {}

  async findOne(id: string): Promise<EcopontoDetail> {
    const client = this.redis.getClient();
    const cacheKey = `ecoponto:${id}`;
    const cached = await client.get(cacheKey);
    if (cached) return JSON.parse(cached) as EcopontoDetail;

    // Geography column (localizacao) via raw SQL
    const rows = await this.prisma.$queryRaw<Array<{
      id: string;
      codigo_externo: string | null;
      nome: string;
      descricao: string | null;
      lat: number;
      lng: number;
      morada_textual: string | null;
      zona_id: string;
      tipologias: string[];
      tem_sensor: boolean;
      acessibilidade: unknown;
      horario: unknown;
      ativo: boolean;
      criado_em: Date;
      atualizado_em: Date;
      nivel_enchimento: number | null;
      estado: string;
      ultima_leitura_em: Date | null;
      device_id: string | null;
    }>>`
      SELECT
        e.id, e.codigo_externo, e.nome, e.descricao,
        ST_Y(e.localizacao::geometry) AS lat,
        ST_X(e.localizacao::geometry) AS lng,
        e.morada_textual, e.zona_id, e.tipologias,
        e.tem_sensor, e.acessibilidade, e.horario, e.ativo,
        e.criado_em, e.atualizado_em,
        ea.nivel_enchimento, ea.estado, ea.ultima_leitura_em, ea.device_id
      FROM ecopontos e
      LEFT JOIN ecoponto_estado_atual ea ON ea.ecoponto_id = e.id
      WHERE e.id = ${id}::uuid AND e.eliminado_em IS NULL
    `;

    if (!rows.length || !rows[0]) throw new NotFoundException(`Ecoponto ${id} não encontrado`);

    const r = rows[0];
    const result: EcopontoDetail = {
      id: r.id,
      codigo_externo: r.codigo_externo,
      nome: r.nome,
      descricao: r.descricao,
      latitude: r.lat,
      longitude: r.lng,
      morada_textual: r.morada_textual,
      zona_id: r.zona_id,
      tipologias: r.tipologias,
      tem_sensor: r.tem_sensor,
      acessibilidade: r.acessibilidade as Record<string, unknown>,
      horario: r.horario as Record<string, unknown> | null,
      ativo: r.ativo,
      criado_em: r.criado_em.toISOString(),
      atualizado_em: r.atualizado_em.toISOString(),
      estado: {
        nivel_enchimento: r.nivel_enchimento,
        estado: (r.estado ?? 'SEM_SENSOR') as import('@ecobairro/contracts').EcopontoEstado,
        ultima_leitura_em: r.ultima_leitura_em?.toISOString() ?? null,
        device_id: r.device_id,
      },
    };

    await client.set(cacheKey, JSON.stringify(result), 'EX', ECOPONTO_TTL);
    return result;
  }

  async listByZona(zonaId: string): Promise<EcopontoListItem[]> {
    const client = this.redis.getClient();
    const cacheKey = `ecopontos:mapa:zona:${zonaId}`;
    const cached = await client.get(cacheKey);
    if (cached) return JSON.parse(cached) as EcopontoListItem[];

    const rows = await this.prisma.$queryRaw<Array<{
      id: string;
      nome: string;
      lat: number;
      lng: number;
      tipologias: string[];
      tem_sensor: boolean;
      estado: string;
      nivel_enchimento: number | null;
    }>>`
      SELECT
        e.id, e.nome,
        ST_Y(e.localizacao::geometry) AS lat,
        ST_X(e.localizacao::geometry) AS lng,
        e.tipologias, e.tem_sensor,
        COALESCE(ea.estado, 'SEM_SENSOR') AS estado,
        ea.nivel_enchimento
      FROM ecopontos e
      LEFT JOIN ecoponto_estado_atual ea ON ea.ecoponto_id = e.id
      WHERE e.zona_id = ${zonaId}::uuid
        AND e.ativo = true
        AND e.eliminado_em IS NULL
      ORDER BY e.nome
    `;

    const result: EcopontoListItem[] = rows.map((r) => ({
      id: r.id,
      nome: r.nome,
      latitude: r.lat,
      longitude: r.lng,
      tipologias: r.tipologias,
      tem_sensor: r.tem_sensor,
      estado: r.estado,
      nivel_enchimento: r.nivel_enchimento,
    }));

    await client.set(cacheKey, JSON.stringify(result), 'EX', 2 * 60);
    return result;
  }

  async create(input: CreateEcopontoDto): Promise<EcopontoDetail> {
    const created = await this.prisma.$queryRaw<[{ id: string }]>`
      INSERT INTO ecopontos (nome, descricao, localizacao, morada_textual, zona_id,
        tipologias, tem_sensor, acessibilidade, horario, ativo,
        codigo_externo, criado_em, atualizado_em)
      VALUES (
        ${input.nome},
        ${input.descricao ?? null},
        ST_SetSRID(ST_MakePoint(${input.longitude}, ${input.latitude}), 4326)::geography,
        ${input.moradaTextual ?? null},
        ${input.zonaId}::uuid,
        ${input.tipologias}::varchar(20)[],
        ${input.temSensor ?? false},
        ${JSON.stringify(input.acessibilidade ?? {})}::jsonb,
        ${input.horario ? JSON.stringify(input.horario) : null}::jsonb,
        true,
        ${input.codigoExterno ?? null},
        now(), now()
      )
      RETURNING id
    `;

    const id = created[0].id;

    // Seed default estado row
    await this.prisma.$executeRaw`
      INSERT INTO ecoponto_estado_atual (ecoponto_id, estado, atualizado_em)
      VALUES (${id}::uuid, 'SEM_SENSOR', now())
      ON CONFLICT (ecoponto_id) DO NOTHING
    `;

    this.audit.log({ acao: 'ECOPONTO_CRIADO', entidade: 'ecopontos', entidadeId: id });
    return this.findOne(id);
  }

  async update(id: string, input: Partial<CreateEcopontoDto>, actorId?: string): Promise<EcopontoDetail> {
    const existing = await this.prisma.ecoponto.findUnique({ where: { id }, select: { id: true } });
    if (!existing) throw new NotFoundException(`Ecoponto ${id} não encontrado`);

    if (input.latitude !== undefined && input.longitude !== undefined) {
      await this.prisma.$executeRaw`
        UPDATE ecopontos
        SET localizacao = ST_SetSRID(ST_MakePoint(${input.longitude}, ${input.latitude}), 4326)::geography,
            atualizado_em = now()
        WHERE id = ${id}::uuid
      `;
    }

    await this.prisma.ecoponto.update({
      where: { id },
      data: {
        ...(input.nome !== undefined && { nome: input.nome }),
        ...(input.descricao !== undefined && { descricao: input.descricao }),
        ...(input.moradaTextual !== undefined && { moradaTextual: input.moradaTextual }),
        ...(input.tipologias !== undefined && { tipologias: input.tipologias }),
        ...(input.temSensor !== undefined && { temSensor: input.temSensor }),
        ...(input.acessibilidade !== undefined && {
          acessibilidade: input.acessibilidade as import('@prisma/client').Prisma.InputJsonValue,
        }),
        ...(input.horario !== undefined && {
          horario: input.horario as import('@prisma/client').Prisma.InputJsonValue,
        }),
      },
    });

    await this.invalidateEcopontoCache(id);
    this.audit.log({ actorId, acao: 'ECOPONTO_ATUALIZADO', entidade: 'ecopontos', entidadeId: id });
    return this.findOne(id);
  }

  async softDelete(id: string, actorId?: string): Promise<void> {
    const existing = await this.prisma.ecoponto.findUnique({ where: { id }, select: { id: true } });
    if (!existing) throw new NotFoundException(`Ecoponto ${id} não encontrado`);

    await this.prisma.ecoponto.update({
      where: { id },
      data: { eliminadoEm: new Date() },
    });

    await this.invalidateEcopontoCache(id);
    this.audit.log({ actorId, acao: 'ECOPONTO_ELIMINADO', entidade: 'ecopontos', entidadeId: id });
  }

  async invalidateEcopontoCache(id: string, zonaId?: string): Promise<void> {
    const client = this.redis.getClient();
    const keys = [`ecoponto:${id}`, `ecoponto:estado:${id}`];
    if (zonaId) keys.push(`ecopontos:mapa:zona:${zonaId}`);
    if (keys.length) await client.del(...keys);
  }
}
