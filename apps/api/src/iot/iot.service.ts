import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { RedisService } from '../redis/redis.service';
import type { TelemetriaDto } from './dto/telemetria.dto';
import type { IotIngestJob } from '../queues/queues.types';

const CHEIO_THRESHOLD = 85;

@Injectable()
export class IotService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(RedisService) private readonly redis: RedisService,
  ) {}

  /**
   * Accepts IoT telemetry and immediately enqueues processing.
   * Returns 202 to the sensor without waiting for DB writes (RF-04).
   */
  async ingest(input: TelemetriaDto): Promise<{ queued: true }> {
    // Enqueue to Redis list (lightweight — BullMQ picks up when installed)
    const job: IotIngestJob = {
      device_id: input.device_id,
      ecoponto_id: input.ecoponto_id,
      nivel_enchimento: input.nivel_enchimento ?? null,
      estado_reportado: input.estado_reportado ?? null,
      metadata: input.metadata ?? null,
      timestamp: new Date().toISOString(),
    };

    await this.redis.getClient().lpush('queue:iot:ingest', JSON.stringify(job));
    return { queued: true };
  }

  /**
   * Processes a single telemetry job (called by queue worker).
   * Inserts into sensor_leituras, upserts ecoponto_estado_atual.
   */
  async processIngestJob(job: IotIngestJob): Promise<void> {
    const ecoponto = await this.prisma.ecoponto.findUnique({
      where: { id: job.ecoponto_id },
      select: { id: true, zonaId: true, temSensor: true },
    });

    if (!ecoponto) {
      throw new NotFoundException(`Ecoponto ${job.ecoponto_id} not found`);
    }

    // Insert sensor reading (partitioned table — raw SQL only)
    await this.prisma.$executeRaw`
      INSERT INTO sensor_leituras
        (timestamp_leitura, ecoponto_id, device_id, nivel_enchimento, estado_reportado, metadata, criado_em)
      VALUES (
        ${job.timestamp}::timestamptz,
        ${job.ecoponto_id}::uuid,
        ${job.device_id},
        ${job.nivel_enchimento}::smallint,
        ${job.estado_reportado},
        ${job.metadata ? JSON.stringify(job.metadata) : null}::jsonb,
        now()
      )
    `;

    // Compute new estado
    const estado = computeEstado(job.nivel_enchimento, job.estado_reportado);

    // Upsert estado_atual (trigger will NOTIFY ecoponto_estado_updated)
    await this.prisma.$executeRaw`
      INSERT INTO ecoponto_estado_atual
        (ecoponto_id, nivel_enchimento, estado, ultima_leitura_em, device_id, atualizado_em)
      VALUES (
        ${job.ecoponto_id}::uuid,
        ${job.nivel_enchimento}::smallint,
        ${estado},
        ${job.timestamp}::timestamptz,
        ${job.device_id},
        now()
      )
      ON CONFLICT (ecoponto_id) DO UPDATE SET
        nivel_enchimento  = EXCLUDED.nivel_enchimento,
        estado            = EXCLUDED.estado,
        ultima_leitura_em = EXCLUDED.ultima_leitura_em,
        device_id         = EXCLUDED.device_id,
        atualizado_em     = now()
    `;

    // Invalidate Redis cache for this ecoponto
    const client = this.redis.getClient();
    await client.del(
      `ecoponto:${job.ecoponto_id}`,
      `ecoponto:estado:${job.ecoponto_id}`,
      `ecopontos:mapa:zona:${ecoponto.zonaId}`,
    );
  }
}

function computeEstado(
  nivel: number | null,
  reportado: string | null,
): string {
  if (reportado && ['AVARIADO', 'MANUTENCAO'].includes(reportado)) {
    return reportado;
  }
  if (nivel === null) return 'SEM_SENSOR';
  if (nivel >= CHEIO_THRESHOLD) return 'CHEIO';
  return 'DISPONIVEL';
}
