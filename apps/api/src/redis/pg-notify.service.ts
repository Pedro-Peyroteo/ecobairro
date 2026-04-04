import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Client } from 'pg';
import { requireEnv } from '@ecobairro/config';
import { CacheKey, PgChannel } from './cache-keys';
import { CacheService } from './cache.service';

/**
 * Escuta notificações PostgreSQL NOTIFY e invalida as chaves Redis afectadas.
 *
 * Pipeline documentado em:
 * docs/models/Cidadão/base de dados/3.2 Redis — cache e operações rápidas.md
 *
 * Canais escutados:
 *   user_updated      → invalida user:session e user:rbac
 *   cidadao_updated   → invalida cidadao:profile, notif_prefs, dashboard, favoritos
 *   operador_updated  → invalida operador:profile
 *
 * NOTA: este serviço usa uma ligação pg dedicada (separada do pool Prisma)
 * porque a ligação em modo LISTEN não pode ser partilhada com queries normais.
 */
@Injectable()
export class PgNotifyService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PgNotifyService.name);
  private client!: Client;

  constructor(private readonly cacheService: CacheService) {}

  async onModuleInit(): Promise<void> {
    this.client = new Client({
      connectionString: requireEnv('DATABASE_URL'),
    });

    await this.client.connect();

    await this.client.query(`LISTEN ${PgChannel.USER_UPDATED}`);
    await this.client.query(`LISTEN ${PgChannel.CIDADAO_UPDATED}`);
    await this.client.query(`LISTEN ${PgChannel.OPERADOR_UPDATED}`);

    this.client.on('notification', (msg) => {
      void this.handleNotification(msg.channel, msg.payload ?? '{}');
    });

    this.client.on('error', (err) => {
      this.logger.error('PgNotify client error', err.message);
    });

    this.logger.log(
      `Listening on PG channels: ${Object.values(PgChannel).join(', ')}`,
    );
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.end();
    this.logger.log('PgNotify client disconnected');
  }

  // ─── Dispatch ─────────────────────────────────────────────────────────────

  private async handleNotification(
    channel: string,
    payload: string,
  ): Promise<void> {
    try {
      const data = JSON.parse(payload) as Record<string, string>;

      switch (channel) {
        case PgChannel.USER_UPDATED:
          await this.onUserUpdated(data.id);
          break;
        case PgChannel.CIDADAO_UPDATED:
          await this.onCidadaoUpdated(data.user_id);
          break;
        case PgChannel.OPERADOR_UPDATED:
          await this.onOperadorUpdated(data.user_id);
          break;
        default:
          this.logger.warn(`Unknown PG channel: ${channel}`);
      }
    } catch (err) {
      this.logger.error(
        `Failed to handle notification on channel "${channel}"`,
        err,
      );
    }
  }

  // ─── Invalidações por tabela ──────────────────────────────────────────────

  private async onUserUpdated(userId: string): Promise<void> {
    await this.cacheService.del(
      CacheKey.userSession(userId),
      CacheKey.userRbac(userId),
    );
    this.logger.debug(`[user_updated] invalidated cache for user ${userId}`);
  }

  private async onCidadaoUpdated(userId: string): Promise<void> {
    await this.cacheService.del(
      CacheKey.cidadaoProfile(userId),
      CacheKey.cidadaoNotifPrefs(userId),
      CacheKey.cidadaoDashboard(userId),
      CacheKey.cidadaoFavoritos(userId),
    );
    this.logger.debug(
      `[cidadao_updated] invalidated cache for cidadao ${userId}`,
    );
  }

  private async onOperadorUpdated(userId: string): Promise<void> {
    await this.cacheService.del(CacheKey.operadorProfile(userId));
    this.logger.debug(
      `[operador_updated] invalidated cache for operador ${userId}`,
    );
  }
}
