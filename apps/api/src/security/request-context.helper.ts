import type { Request } from 'express';
import type { RequestContext } from './security.service';

/**
 * Extrai IP e User-Agent de um Express Request, com normalização.
 *
 * - IP: usa req.ip (Express resolve X-Forwarded-For com trust proxy=1 configurado
 *   em main.ts). NÃO lemos XFF manualmente — seria vulnerável a IP spoofing.
 * - User-Agent: header `user-agent` ou null.
 */
export function buildRequestContext(req: Request): RequestContext {
  let ip = req.ip ?? 'unknown';
  // Remove prefixo IPv4-mapped IPv6 (::ffff:1.2.3.4 → 1.2.3.4)
  if (ip.startsWith('::ffff:')) ip = ip.slice(7);
  return {
    ipAddress: ip,
    userAgent: req.header('user-agent') ?? null,
  };
}
