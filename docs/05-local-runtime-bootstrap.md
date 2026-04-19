# Local Runtime Bootstrap

This guide documents the local runtime that exists today in the repository.

It is written for teammates who need to:

- bring the project up for the first time
- understand what the Docker stack is doing
- connect to the local PostgreSQL container
- apply Prisma migrations
- troubleshoot the Phase 1 backend stack

## Current Runtime Overview

The local stack is orchestrated through Docker Compose at:

`infra/compose/docker-compose.yml`

The services currently in the stack are:

- `web`: frontend app
- `api`: NestJS backend
- `analytics`: FastAPI analytics service
- `postgres`: PostgreSQL 16 with PostGIS
- `redis`: Redis 7
- `nginx`: single local entrypoint that routes traffic to the internal services

All local traffic goes through:

`http://localhost:8080`

## Prerequisites

- Docker Desktop or a working local Docker daemon
- Node.js
- Corepack-enabled `pnpm`

Recommended from the repository root:

```powershell
pnpm install --no-frozen-lockfile
```

## First-Time Startup

From the repository root:

```powershell
pnpm compose:up
pnpm compose:ps
```

What this does:

- builds the app containers if needed
- starts PostgreSQL, Redis, web, api, analytics, and nginx
- mounts the repository into the JS containers for development
- auto-installs workspace dependencies inside the containers when needed
- auto-generates the Prisma client for `@ecobairro/api` on API startup

Once the stack is healthy, open:

- `http://localhost:8080/`
- `http://localhost:8080/api/health`
- `http://localhost:8080/api/ready`
- `http://localhost:8080/analytics/health`
- `http://localhost:8080/analytics/ready`

## Useful Local Commands

Use these from the repository root:

```powershell
pnpm compose:up
pnpm compose:down
pnpm compose:restart
pnpm compose:ps
pnpm compose:logs
pnpm compose:logs:api
pnpm compose:logs:db
```

Recommended workflow:

- keep the stack running in detached mode with `pnpm compose:up`
- use `pnpm compose:ps` to confirm health quickly
- use `pnpm compose:logs:api` when debugging backend work
- use `pnpm compose:logs:db` when debugging PostgreSQL, Redis, or nginx

## PostgreSQL Container

The database service is:

- image: `postgis/postgis:16-3.4`
- container service name inside Compose: `postgres`
- host port: `localhost:5432`
- default database: `ecobairro`
- default user: `ecobairro`
- default password: `ecobairro`

These values come from `.env.example` unless overridden in your local `.env`.

Default host connection string:

```text
postgresql://ecobairro:ecobairro@localhost:5432/ecobairro
```

Internal Compose connection string used by the API container:

```text
postgresql://ecobairro:ecobairro@postgres:5432/ecobairro
```

### Data persistence

PostgreSQL data is stored in the named Docker volume:

`postgres-data`

That means:

- `pnpm compose:down` stops containers but keeps the database data
- starting the stack again will reuse the same database state

### PostGIS initialization

On first container initialization, the SQL file below is mounted into PostgreSQL init:

`infra/postgres/init/001-enable-postgis.sql`

Current content:

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```

This runs only when PostgreSQL initializes a fresh data directory.

## Prisma and Migrations

The API uses Prisma 7.

Important files:

- `apps/api/prisma/schema.prisma`
- `apps/api/prisma.config.ts`
- `apps/api/prisma/migrations/`

### How Prisma gets the database URL

The Prisma schema does not inline the datasource URL.
Instead, Prisma reads it from:

`apps/api/prisma.config.ts`

That config tries, in order:

1. root `.env`
2. `apps/api/.env`
3. fallback values based on `localhost:5432`

This is why Prisma CLI commands from your host machine can still connect to the local Postgres container.

### Apply migrations locally

After the stack is up, apply the migrations from the repository root:

```powershell
pnpm --dir apps/api exec prisma migrate deploy
```

For development-only migration authoring:

```powershell
pnpm --dir apps/api exec prisma migrate dev --name your_migration_name
```

Regenerate the Prisma client if needed:

```powershell
pnpm --dir apps/api prisma:generate
```

### Current migration state

The first implemented backend migration is:

`apps/api/prisma/migrations/20260418230000_init_auth_phase1/migration.sql`

It creates:

- `users`
- `cidadao_perfis`
- `UserRole` enum
- indexes for role, email, citizen profile relation, and soft-delete lookup

## Redis Container

The local Redis service is:

- image: `redis:7-alpine`
- host access from containers: `redis://redis:6379/0`

The current Phase 1 backend uses Redis for auth session storage.

Current Redis key pattern in use:

- `user:session:{user_id}`

## Routing Model

Externally, nginx exposes:

- web at `/`
- api at `/api/...`
- analytics at `/analytics/...`

The Nest app itself uses the global prefix:

`/v1`

So the current backend business routes are exposed externally under:

`/api/v1/...`

Examples:

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `GET /api/v1/cidadaos/me`

Health endpoints remain outside the API version prefix:

- `/api/health`
- `/api/ready`

## Current Backend Status

The backend is beyond scaffold stage now.

Implemented Phase 1 backend features:

- Prisma data model for users and citizen profiles
- Redis-backed auth sessions
- JWT bearer authentication
- citizen self-registration
- login, refresh, and logout
- citizen self-profile read and update
- unit coverage for auth service, JWT guard, and citizen profile service

## Manual API Smoke Test

Use this base URL:

```text
http://localhost:8080/api/v1
```

Example registration:

```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "test1@example.com",
  "password": "Password123!",
  "phone": "+351910000000",
  "rgpd_accepted": true
}
```

Example login:

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "test1@example.com",
  "password": "Password123!"
}
```

Example authenticated profile request:

```http
GET /api/v1/cidadaos/me
Authorization: Bearer <access_token>
```

## Running Checks

API checks:

```powershell
pnpm --dir apps/api test
pnpm --dir apps/api typecheck
pnpm --dir apps/api lint
```

Workspace checks:

```powershell
pnpm typecheck
pnpm lint
```

## Troubleshooting

### `api` is unhealthy

Check:

```powershell
pnpm compose:logs:api
pnpm compose:ps
```

Common causes:

- Postgres is not healthy yet
- Redis is not healthy yet
- missing or invalid env values
- migrations were not applied yet

### Prisma commands cannot connect to the database

Check:

- Docker is running
- `postgres` is healthy in `pnpm compose:ps`
- your local `DATABASE_URL` points to `localhost:5432`, not `postgres:5432`

Recommended host URL:

```text
postgresql://ecobairro:ecobairro@localhost:5432/ecobairro
```

### I need to inspect the database manually

Use any PostgreSQL client with:

- host: `localhost`
- port: `5432`
- database: `ecobairro`
- user: `ecobairro`
- password: `ecobairro`

### I need a clean local database

Be careful: removing the Compose volumes destroys local data.

If you intentionally want a clean database:

```powershell
docker compose -f infra/compose/docker-compose.yml down -v
pnpm compose:up
pnpm --dir apps/api exec prisma migrate deploy
```

## Important Current Constraint

The preferred backend development workflow right now is Docker-first.

The API container already receives the required runtime env values from Compose.
Running `apps/api` directly on the host machine is possible, but it is not the most standardized team workflow yet because you must provide the runtime env variables yourself.
