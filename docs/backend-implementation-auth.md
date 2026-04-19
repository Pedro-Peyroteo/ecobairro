# Backend/Infra Rollout for Users and Login

**Pedro**

## Summary

Start with a thin citizen-only identity slice and make that the first usable backend milestone: NestJS auth + citizen profile on PostgreSQL, Redis only for session storage, and no email/2FA/admin flows in the first deliverable.

Use Prisma as the main data client for identity/profile tables, but keep raw SQL migrations available for PostgreSQL-specific features that Prisma does not model cleanly yet: extensions, partial indexes, `LISTEN/NOTIFY`, partitioned audit tables, and later PostGIS-heavy schemas.

## Phased Plan

### Phase 1 — Core auth and basic citizen profile

This is the best place to start.

- Add API versioning for new business routes under `/api/v1`; keep `/health` and `/ready` unchanged.
- Add backend modules for `config`, `database`, `redis`, `auth`, and `cidadaos`.
- Introduce Prisma with an initial schema for:
  - `users`
  - `cidadao_perfis`
  - `UserRole` enum matching `CIDADAO | OPERADOR_VEOLIA | TECNICO_AUTARQUIA | TECNICO_CCDR | ADMIN`
- Create the first migration with:
  - `users.email` unique index
  - `users.role` index
  - `users.eliminado_em` partial index
  - `cidadao_perfis.user_id` unique index
- Keep `zona_residencia_id` deferred from active use:
  - include it only as nullable placeholder data if you want schema parity now
  - do not make it writable in this phase
  - do not pull in the `zonas` subsystem yet
- Implement the first public endpoints:
  - `POST /api/v1/auth/register`
  - `POST /api/v1/auth/login`
  - `POST /api/v1/auth/refresh`
  - `POST /api/v1/auth/logout`
  - `GET /api/v1/cidadaos/me`
  - `PUT /api/v1/cidadaos/me`
- Registration rules:
  - citizen-only self-registration
  - transactional create of `users` + `cidadao_perfis`
  - `role='CIDADAO'`
  - `rgpd_accepted=true` required
- Auth rules:
  - bcrypt password hashing
  - access token is JWT with `{ sub, role }`, TTL 15 minutes
  - refresh token is opaque, TTL 7 days
  - single active session per user in v1; new login replaces the old refresh session
  - deny login for soft-deleted users
- Profile rules:
  - allow only non-sensitive updates: `phone`, `nome_completo`, `gamification_opt_in`, `notificacao_prefs`, `dashboard_widgets`
  - keep PII endpoints, zone assignment, and location fields out of this phase
- In `packages/contracts`, add DTO/types for register, login, refresh, logout, and citizen self-profile payloads.
- Infra for this phase:
  - keep Docker Compose local-first
  - no BullMQ worker, Mailpit, PgBouncer, or read replica yet
  - add only the env needed for auth: DB, Redis, JWT, bcrypt/session config

### Phase 2 — Account lifecycle and local async delivery

- Add the remaining non-2FA auth lifecycle endpoints:
  - `POST /api/v1/auth/verify-email`
  - `POST /api/v1/auth/forgot-password`
  - `POST /api/v1/auth/reset-password`
- Introduce BullMQ and a separate local worker service in Compose.
- Add a local email sink such as Mailpit for verification/reset flows.
- Store lifecycle tokens in Redis with the TTLs from the docs:
  - `auth:verify_email:{token}`
  - `auth:reset_token:{token}`
- Keep reads on PostgreSQL primary for now; do not add cache layers yet unless they are needed for these flows.
- Add contract types for email verification and password reset payloads.

### Phase 3 — Privacy, deletion, and audit foundations

- Extend `cidadao_perfis` for sensitive data handling:
  - `nif_cifrado`
  - `nif_hash`
  - `morada_cifrada`
- Implement:
  - `GET /api/v1/cidadaos/me/dados-sensiveis`
  - `PUT /api/v1/cidadaos/me/dados-sensiveis`
  - `DELETE /api/v1/cidadaos/me`
- Encrypt sensitive fields in the application layer with AES-256 before DB writes.
- Compute `nif_hash` with HMAC-SHA256 in the app layer for future admin lookup.
- Add the anonymization job for soft-deleted accounts.
- Add `audit_log` through raw SQL migrations and middleware/service hooks for:
  - auth events
  - profile updates
  - sensitive-data reads/writes
  - delete/anonymize flows

### Phase 4 — Operator/admin identity and cache invalidation

- Add Prisma models plus any raw SQL needed for:
  - `operador_perfis`
- Implement:
  - `POST /api/v1/admin/operadores`
  - `GET /api/v1/operadores/me`
  - `PUT /api/v1/operadores/me`
  - `PUT /api/v1/admin/users/:id/role`
- Add Redis keys introduced by role/profile management:
  - `user:rbac:{user_id}`
  - `operador:profile:{user_id}`
  - `cidadao:profile:{user_id}`
- Add PostgreSQL triggers and Nest listeners for `user_updated`, `cidadao_updated`, and `operador_updated`.
- At this point, enable read-through caching for self-profile reads and invalidate via direct writes plus `LISTEN/NOTIFY`.

### Phase 5 — Advanced auth and infra hardening

- Add 2FA as TOTP-first:
  - `POST /api/v1/auth/2fa/enable`
  - `POST /api/v1/auth/2fa/confirm`
  - `DELETE /api/v1/auth/2fa`
  - `POST /api/v1/auth/2fa/verify`
- Use Redis temp/pre-auth keys from the docs:
  - `auth:2fa_temp:{user_id}`
  - `auth:pre_auth:{token}`
- Keep SMS out of v1 2FA unless a provider decision is made later.
- Harden infra:
  - add PgBouncer
  - separate API and worker services formally
  - move sensitive app keys to secret-based injection
  - add migration job/container for deploys
  - prepare config split for primary vs replica DB once replica exists

## Public Interfaces and Infra Additions

- New API surface starts at `/api/v1`.
- `packages/contracts` should become the shared source for auth/profile request and response types used by `apps/api` and later `apps/web`.
- New env/config introduced across phases:
  - JWT access secret and TTL
  - opaque refresh TTL and token length
  - bcrypt cost
  - app base URL for email links
  - email transport config
  - encryption key for PII
  - HMAC key for `nif_hash`
- Compose additions by phase:
  - Phase 2: `worker`, `mailpit`
  - Phase 5: `pgbouncer`

## Test Plan

- Phase 1:
  - register creates `users` and `cidadao_perfis` atomically
  - duplicate email is rejected
  - login rejects wrong password and soft-deleted users
  - refresh rotates the opaque token and invalidates the old one
  - logout deletes the active session
  - `GET/PUT /cidadaos/me` returns only non-sensitive fields and blocks unsupported writes
- Phase 2:
  - verify/reset tokens respect TTL and one-time use
  - worker processes queued email jobs end-to-end
- Phase 3:
  - PII is encrypted before persistence
  - `nif_hash` is deterministic for the same input/key
  - account deletion schedules and completes anonymization
  - audit rows are written for sensitive actions
- Phase 4:
  - admin operator creation writes both identity and operator profile
  - role changes invalidate RBAC/profile cache entries
  - self-profile cache is refreshed after updates
- Phase 5:
  - 2FA login requires pre-auth then final verification
  - disabled 2FA falls back to normal login
  - Compose stack remains healthy with API, worker, Redis, and PgBouncer

## Assumptions

- First deliverable is citizen-only core auth plus basic self-profile.
- Prisma is the default persistence layer for identity/profile work; raw SQL is explicitly allowed for PG-specific features.
- Single active refresh session per user is acceptable for v1.
- `zona_residencia_id` is deferred from real business use until the zones subsystem exists.
- Reads use PostgreSQL primary until the infra-hardening phase; Redis starts as session/token storage, not a general read cache.
- Email verification, password reset, admin/operator flows, and 2FA are intentionally later phases, not part of the first slice.
