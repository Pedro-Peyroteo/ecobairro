import { Global, Module } from '@nestjs/common';
import { RedisService } from './redis.service';
import { CacheService } from './cache.service';
import { PgNotifyService } from './pg-notify.service';

/**
 * Módulo global de Redis.
 *
 * Marcado como @Global para que CacheService esteja disponível em qualquer
 * módulo sem necessidade de importar RedisModule explicitamente.
 *
 * Exporta apenas CacheService — RedisService e PgNotifyService são
 * detalhes de implementação internos ao módulo.
 */
@Global()
@Module({
  providers: [RedisService, CacheService, PgNotifyService],
  exports: [CacheService],
})
export class RedisModule {}
