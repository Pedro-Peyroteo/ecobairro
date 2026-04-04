import { Injectable } from '@nestjs/common';
import { RedisService } from './redis.service';

/**
 * Operações de cache tipadas sobre o cliente Redis.
 *
 * Todos os valores são serializados como JSON.
 * Os callers fornecem as chaves via CacheKey e os TTLs via CacheTtl
 * (definidos em cache-keys.ts), garantindo que não existem valores mágicos
 * espalhados pelo código.
 */
@Injectable()
export class CacheService {
  constructor(private readonly redisService: RedisService) {}

  // ─── Leitura ──────────────────────────────────────────────────────────────

  async get<T>(key: string): Promise<T | null> {
    const raw = await this.redisService.getClient().get(key);
    if (raw === null) return null;
    return JSON.parse(raw) as T;
  }

  // ─── Escrita ──────────────────────────────────────────────────────────────

  async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    await this.redisService
      .getClient()
      .setex(key, ttlSeconds, JSON.stringify(value));
  }

  /**
   * Renova o TTL de uma chave existente (sliding window).
   * Usado para sessões: cada pedido autenticado prolonga a sessão.
   */
  async expire(key: string, ttlSeconds: number): Promise<void> {
    await this.redisService.getClient().expire(key, ttlSeconds);
  }

  // ─── Eliminação ───────────────────────────────────────────────────────────

  async del(...keys: string[]): Promise<void> {
    if (keys.length === 0) return;
    await this.redisService.getClient().del(...keys);
  }

  // ─── Contadores (antispam) ────────────────────────────────────────────────

  /**
   * Incrementa um contador atomicamente e devolve o valor actual.
   * Usado para o antispam de reports por utilizador/zona.
   */
  async incr(key: string): Promise<number> {
    return this.redisService.getClient().incr(key);
  }

  /**
   * Define o TTL de uma chave apenas se ainda não tiver TTL definido.
   * Garante que a janela antispam começa no 1.º report e não é renovada
   * nos reports subsequentes.
   */
  async expireOnlyIfPersistent(
    key: string,
    ttlSeconds: number,
  ): Promise<void> {
    const current = await this.redisService.getClient().ttl(key);
    if (current === -1) {
      await this.redisService.getClient().expire(key, ttlSeconds);
    }
  }

  // ─── Utilitários ─────────────────────────────────────────────────────────

  async exists(key: string): Promise<boolean> {
    const count = await this.redisService.getClient().exists(key);
    return count > 0;
  }
}
