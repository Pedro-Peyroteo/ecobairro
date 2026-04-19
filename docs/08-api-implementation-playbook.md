# API Implementation Playbook

This document explains what is currently implemented in `apps/api`, how it is structured, and how to add new backend features without guessing.

It is meant to help teammates answer three questions quickly:

- what already exists
- where new backend work should go
- what the expected implementation pattern is

## Current Scope

The backend currently implements the first usable Phase 1 slice:

- citizen registration
- login
- refresh token rotation
- logout
- citizen self-profile read
- citizen self-profile update
- readiness checks for PostgreSQL and Redis

Not implemented yet:

- email verification
- forgot/reset password
- 2FA
- operator/admin flows
- sensitive data flows
- BullMQ workers
- audit logging
- caching beyond auth sessions

## Runtime and Routing

The backend app is:

`apps/api`

Internal Nest runtime port:

`3000`

External route base through nginx:

`/api/v1`

Health routes are excluded from the global API version prefix:

- `/api/health`
- `/api/ready`

Business routes currently live under:

- `/api/v1/auth/...`
- `/api/v1/cidadaos/...`

## Module Layout

Current `apps/api/src` structure:

```text
src/
  app.module.ts
  main.ts
  health.controller.ts
  health.service.ts
  auth/
  cidadaos/
  database/
  redis/
  test/
```

### What each area owns

- `auth/`
  - public auth endpoints
  - login/register/refresh/logout business logic
  - JWT guard
  - current-user extraction
  - auth DTO validation
- `cidadaos/`
  - citizen self-profile routes
  - citizen-specific business rules for `/me`
- `database/`
  - global Prisma provider
- `redis/`
  - global Redis provider
- `health.*`
  - liveness and readiness checks

## Data Layer

### Prisma

Prisma is the current write/read access layer for implemented backend features.

Important files:

- `apps/api/prisma/schema.prisma`
- `apps/api/prisma/migrations/`
- `apps/api/prisma.config.ts`

Current implemented models:

- `User`
- `CidadaoPerfil`
- enum `UserRole`

### Current tables

#### `users`

Purpose:

- identity
- auth credentials
- role
- soft-delete state

Implemented columns:

- `id`
- `email`
- `password_hash`
- `phone`
- `email_verified`
- `role`
- `criado_em`
- `atualizado_em`
- `eliminado_em`

#### `cidadao_perfis`

Purpose:

- citizen-specific profile extension of `users`

Implemented columns:

- `id`
- `user_id`
- `nome_completo`
- `gamification_opt_in`
- `notificacao_prefs`
- `dashboard_widgets`
- `rgpd_accepted`
- `criado_em`
- `atualizado_em`

### Current migration

Implemented migration:

`apps/api/prisma/migrations/20260418230000_init_auth_phase1/migration.sql`

Important database behaviors already in place:

- `users.email` unique index
- `users.role` index
- partial index on `users.eliminado_em`
- one-to-one relation from `cidadao_perfis.user_id` to `users.id`

## Shared Contracts

Cross-app request and response shapes live in:

`packages/contracts/src/index.ts`

This is the contract-first surface for backend/frontend alignment.

Currently implemented contracts include:

- `RegisterRequest`
- `RegisterResponse`
- `LoginRequest`
- `LoginResponse`
- `RefreshRequest`
- `CitizenSelfProfileResponse`
- `UpdateCitizenSelfProfileRequest`

Rule of thumb:

- if the API response or request body is part of the product contract, define or update it in `packages/contracts` first

## Auth Implementation

### Register flow

Route:

`POST /api/v1/auth/register`

Behavior:

1. normalizes email to lowercase
2. checks for existing user by email
3. hashes password with bcrypt
4. creates `users` and `cidadao_perfis` in one Prisma transaction
5. forces `role = CIDADAO`

Current constraints:

- self-registration is citizen-only
- `rgpd_accepted` must be `true`
- no email verification flow yet

### Login flow

Route:

`POST /api/v1/auth/login`

Behavior:

1. normalizes email
2. loads user by email
3. rejects missing or soft-deleted users
4. verifies password with bcrypt
5. issues JWT access token
6. issues opaque refresh token
7. stores the active refresh session in Redis

### Refresh flow

Route:

`POST /api/v1/auth/refresh`

Behavior:

1. extracts the user id from the opaque refresh token
2. loads the active Redis session
3. compares the stored token hash
4. confirms the user still exists and is not soft-deleted
5. rotates the refresh token by overwriting the Redis session

### Logout flow

Route:

`POST /api/v1/auth/logout`

Behavior:

- requires JWT auth
- deletes the active Redis session key for the user

### JWT payload

Current payload:

```json
{
  "sub": "<user_id>",
  "role": "CIDADAO"
}
```

### Redis session model

Current key:

`user:session:{user_id}`

Current v1 policy:

- one active refresh session per user
- a new login replaces the old refresh session

## Citizen Profile Implementation

### Read own profile

Route:

`GET /api/v1/cidadaos/me`

Behavior:

- requires JWT auth
- requires role `CIDADAO`
- joins user identity + citizen profile
- returns only the allowed non-sensitive fields

### Update own profile

Route:

`PUT /api/v1/cidadaos/me`

Allowed fields today:

- `phone`
- `nome_completo`
- `gamification_opt_in`
- `notificacao_prefs`
- `dashboard_widgets`

Current rule:

- only citizens can use these endpoints

## Validation and Guards

### Global validation

Configured in `main.ts`:

- whitelist enabled
- forbid non-whitelisted properties enabled
- transform enabled

Practical meaning:

- DTOs are the request contract
- extra body fields are rejected

### Current auth guard

File:

`apps/api/src/auth/jwt-auth.guard.ts`

Behavior:

- reads `Authorization: Bearer <token>`
- verifies the JWT
- attaches `request.authUser = { userId, role }`

### Current user decorator

File:

`apps/api/src/auth/current-user.decorator.ts`

Purpose:

- lets controllers read the authenticated user cleanly

## Health and Readiness

Current routes:

- `GET /health`
- `GET /ready`

Implemented readiness checks:

- PostgreSQL connectivity
- Redis connectivity

This is useful when debugging container startup order.

## Tests

Current API test approach is intentionally lightweight.

Test files:

- `apps/api/src/auth/auth.service.test.ts`
- `apps/api/src/auth/jwt-auth.guard.test.ts`
- `apps/api/src/cidadaos/cidadaos.service.test.ts`
- `apps/api/src/test/run-tests.ts`

Run them with:

```powershell
pnpm --dir apps/api test
```

The current tests cover:

- auth registration
- duplicate registration rejection
- login session creation
- refresh token rotation
- logout invalidation
- JWT guard success and failure paths
- citizen self-profile reads and updates

## How To Implement a New Backend Feature

Use this sequence for new backend work.

### 1. Define the scope first

Before writing code, decide:

- is this a new module or an extension of an existing module
- does it need new database tables or columns
- does it change request/response contracts
- does it need auth or role restrictions
- does it need Redis, async jobs, or only PostgreSQL

### 2. Update shared contracts if the API shape changes

File:

`packages/contracts/src/index.ts`

Add or update:

- request interfaces
- response interfaces
- enums or shared literal types if needed

### 3. Add DTOs in the owning module

Examples:

- `apps/api/src/auth/dto/register.dto.ts`
- `apps/api/src/cidadaos/dto/update-cidadao-profile.dto.ts`

Guideline:

- contracts describe the external API shape
- DTOs enforce runtime validation in Nest

### 4. Update Prisma when persistence changes

Files:

- `apps/api/prisma/schema.prisma`
- `apps/api/prisma/migrations/...`

Process:

1. update the Prisma schema
2. generate a migration
3. inspect the generated SQL
4. manually adjust the migration if PostgreSQL-specific behavior is needed
5. apply the migration locally

Example commands:

```powershell
pnpm --dir apps/api exec prisma migrate dev --name add_feature_name
pnpm --dir apps/api exec prisma migrate deploy
pnpm --dir apps/api prisma:generate
```

Use raw SQL migration edits for things Prisma does not model well, such as:

- extensions
- partial indexes
- advanced PostgreSQL features

### 5. Add or extend the module

Typical file pattern:

```text
src/<feature>/
  <feature>.module.ts
  <feature>.controller.ts
  <feature>.service.ts
  dto/
```

Guideline:

- controller owns HTTP concerns
- service owns business logic
- Prisma and Redis stay behind service boundaries

### 6. Register the module

Import the module in:

`apps/api/src/app.module.ts`

unless the feature is intentionally nested under another module structure.

### 7. Apply auth and role rules explicitly

Use:

- `@UseGuards(JwtAuthGuard)` for authenticated routes
- `@CurrentUser()` to access the current user
- explicit role checks in the service when the logic is role-sensitive

Current pattern for citizen-only behavior:

- guard authenticates the user
- service enforces the role

### 8. Add tests

For service logic:

- add focused unit coverage near the module

For route-level features:

- add service-level tests first
- add higher-level tests later if the project standard evolves

### 9. Update docs

At minimum update:

- the teammate-facing docs if setup/runtime changed
- the backend playbook if architecture or patterns changed
- the domain docs if new endpoints or data behavior became real

## Example: Adding a New Protected Backend Endpoint

Example target:

`GET /api/v1/cidadaos/me/preferences`

Suggested implementation steps:

1. add shared response type in `packages/contracts`
2. add a DTO only if request query/body validation is needed
3. add a service method in `CidadaosService`
4. add a controller route in `CidadaosController`
5. reuse `JwtAuthGuard`
6. enforce citizen-only access in the service
7. add tests beside the module
8. document the new route

## Example: Adding a New Table

Example target:

`cidadao_favoritos`

Suggested implementation steps:

1. add the Prisma model
2. create the migration
3. inspect indexes and foreign keys manually in SQL
4. regenerate Prisma client
5. create a Nest module or extend `cidadaos/` if ownership is still citizen profile
6. add contracts and DTOs
7. implement controller + service
8. add tests
9. update docs

## Practical Team Notes

- prefer repository-root commands for day-to-day work
- prefer Docker-first local runtime
- treat `packages/contracts` as the API truth for request/response shape
- keep business logic inside services, not controllers
- update docs as part of the feature, not later

## Current Gaps To Be Aware Of

These are known areas that still belong to later phases:

- email verification flow
- forgot/reset password
- 2FA
- operator/admin profile flows
- PII encryption and sensitive data endpoints
- audit logging
- async jobs and workers
- broader cache strategy

This playbook should be updated whenever those areas move from planned to implemented.
