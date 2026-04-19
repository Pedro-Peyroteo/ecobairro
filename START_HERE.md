# START HERE

This file is the fastest entry point into the current project docs.

If you are opening the repository for the first time, read in this order:

1. `README.md`
2. `docs/05-local-runtime-bootstrap.md`
3. `docs/08-api-implementation-playbook.md` if you are working on backend or infra
4. `docs/07-web-implementation-playbook.md` if you are working on frontend

## Quick Orientation

The repository currently has:

- `apps/web`: frontend
- `apps/api`: main backend
- `apps/analytics`: analytics service
- `packages/`: shared TypeScript packages
- `infra/`: Docker Compose, nginx, and local runtime scripts
- `docs/`: teammate-facing and domain/design documentation

## If You Need To Run The Project

Read:

- `README.md`
- `docs/05-local-runtime-bootstrap.md`

Key commands from the repository root:

```powershell
pnpm install --no-frozen-lockfile
pnpm compose:up
pnpm --dir apps/api exec prisma migrate deploy
pnpm compose:ps
```

Main local URLs:

- `http://localhost:8080/`
- `http://localhost:8080/api/health`
- `http://localhost:8080/api/ready`
- `http://localhost:8080/api/v1/auth/login`

## If You Need To Understand The Current Backend

Read:

- `docs/08-api-implementation-playbook.md`
- `apps/api/src/`
- `packages/contracts/src/index.ts`
- `apps/api/prisma/schema.prisma`

Current implemented backend scope:

- citizen registration
- login
- refresh token rotation
- logout
- citizen self-profile read/update
- PostgreSQL and Redis readiness checks

## If You Need To Add A Backend Feature

Start with:

- `docs/08-api-implementation-playbook.md`

Then usually touch, in this order:

1. `packages/contracts/src/index.ts`
2. `apps/api/prisma/schema.prisma` and migrations if persistence changes
3. the owning module under `apps/api/src/`
4. tests in `apps/api/src/`
5. docs

## If You Need To Understand The Frontend

Read:

- `docs/06-frontend-scaffold.md`
- `docs/07-web-implementation-playbook.md`

## If You Need Domain Or Product Context

Read:

- `docs/models/`

Useful starting points:

- `docs/models/Cidadão/Init.md`
- `docs/models/Ecopontos, Zonas, Badges e Quiz/Init.md`

Important note:

- some `docs/models/` files are still design/planning documents
- not everything there is implemented yet
- for the real current backend state, trust `docs/08-api-implementation-playbook.md`

## If You Need To Troubleshoot The Database Container

Read:

- `docs/05-local-runtime-bootstrap.md`

Important current facts:

- local PostgreSQL runs in Docker as `postgres`
- host connection uses `localhost:5432`
- default DB/user/password is `ecobairro`
- PostGIS is enabled on first DB initialization
- Prisma CLI on the host uses `apps/api/prisma.config.ts`

## If You Need To Know What Is Implemented Vs Planned

Use this rule:

- implemented runtime/setup/backend behavior: `README.md`, `docs/05-local-runtime-bootstrap.md`, `docs/08-api-implementation-playbook.md`
- broader domain plan and future scope: `docs/models/`

## Suggested Reading By Role

Backend/Infra:

1. `README.md`
2. `docs/05-local-runtime-bootstrap.md`
3. `docs/08-api-implementation-playbook.md`
4. `docs/models/Cidadão/Init.md`

Frontend:

1. `README.md`
2. `docs/06-frontend-scaffold.md`
3. `docs/07-web-implementation-playbook.md`

Product/Architecture:

1. `README.md`
2. `docs/models/`
3. `docs/08-api-implementation-playbook.md`

## Current Best Entry Point

If you are unsure where to start, begin with:

1. `README.md`
2. `docs/05-local-runtime-bootstrap.md`
3. `docs/08-api-implementation-playbook.md`

That path reflects the current codebase more accurately than the older planning docs.
