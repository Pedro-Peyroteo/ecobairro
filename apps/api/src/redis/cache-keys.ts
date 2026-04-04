/**
 * Centraliza todos os padrões de chaves Redis e os respectivos TTLs.
 *
 * Fonte: docs/models/Cidadão/base de dados/3.2 Redis — cache e operações rápidas.md
 *
 * Namespaces:
 *   user:       — sessão e permissões RBAC
 *   auth:       — tokens temporários de autenticação
 *   cidadao:    — perfil, preferências, favoritos, gamificação, dashboard, antispam
 *   operador:   — perfil do operador
 */

// ─── Chave factories ─────────────────────────────────────────────────────────

export const CacheKey = {
  // Identidade & autenticação
  userSession: (userId: string) => `user:session:${userId}`,
  userRbac: (userId: string) => `user:rbac:${userId}`,

  // Tokens temporários
  authResetToken: (token: string) => `auth:reset_token:${token}`,
  authVerifyEmail: (token: string) => `auth:verify_email:${token}`,
  auth2faTemp: (userId: string) => `auth:2fa_temp:${userId}`,
  authPreAuth: (token: string) => `auth:pre_auth:${token}`,

  // Perfil do cidadão
  cidadaoProfile: (userId: string) => `cidadao:profile:${userId}`,
  cidadaoNotifPrefs: (userId: string) => `cidadao:notif_prefs:${userId}`,
  cidadaoFavoritos: (userId: string) => `cidadao:favoritos:${userId}`,
  cidadaoGamif: (userId: string) => `cidadao:gamif:${userId}`,
  cidadaoDashboard: (userId: string) => `cidadao:dashboard:${userId}`,

  // Antispam de reports (INCR counter)
  antispamReport: (userId: string, zonaId: string) =>
    `antispam:report:${userId}:${zonaId}`,

  // Perfil do operador
  operadorProfile: (userId: string) => `operador:profile:${userId}`,
} as const;

// ─── TTLs em segundos ─────────────────────────────────────────────────────────

export const CacheTtl = {
  // Sessão com sliding window de 15 min
  USER_SESSION: 15 * 60,

  // RBAC — TTL curto crítico: mudança de role deve propagar-se rapidamente
  USER_RBAC: 5 * 60,

  // Tokens de autenticação temporários
  AUTH_RESET_TOKEN: 60 * 60,       // 1 h
  AUTH_VERIFY_EMAIL: 24 * 60 * 60, // 24 h
  AUTH_2FA_TEMP: 5 * 60,           // 5 min
  AUTH_PRE_AUTH: 2 * 60,           // 2 min (após verificação 2FA)

  // Perfil do cidadão e derivados
  CIDADAO_PROFILE: 30 * 60,
  CIDADAO_NOTIF_PREFS: 30 * 60,
  CIDADAO_FAVORITOS: 30 * 60,
  CIDADAO_GAMIF: 10 * 60,
  CIDADAO_DASHBOARD: 30 * 60,

  // Antispam: janela de 24 h desde o 1.º report na zona
  ANTISPAM_REPORT: 24 * 60 * 60,

  // Perfil do operador
  OPERADOR_PROFILE: 30 * 60,
} as const;

// ─── Canais NOTIFY do PostgreSQL ──────────────────────────────────────────────

export const PgChannel = {
  USER_UPDATED: 'user_updated',
  CIDADAO_UPDATED: 'cidadao_updated',
  OPERADOR_UPDATED: 'operador_updated',
} as const;
