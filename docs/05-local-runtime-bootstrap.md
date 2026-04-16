# Local Runtime Bootstrap

This document explains how teammates should run and verify the current foundation stack on their own machines.

## Goal

The current goal is not feature completeness.

The goal is to prove that:

- all core containers boot
- the frontend is reachable
- backend services expose health and readiness endpoints
- PostgreSQL and Redis are reachable from the services that depend on them

## Prerequisites

Before starting:

- make sure Docker Desktop or your local Docker daemon is running
- make sure `pnpm` is available locally
- run `pnpm install --no-frozen-lockfile` at least once when dependencies change

## Standard Commands

Use the root scripts in `package.json`:

- `pnpm compose:config`: inspect the resolved Docker Compose configuration before starting containers.
- `pnpm compose:up`: build and start the full stack in detached mode.
- `pnpm compose:down`: stop and remove the running stack.
- `pnpm compose:logs`: follow the combined logs for every service.
- `pnpm compose:logs:web`: follow only the frontend logs.
- `pnpm compose:logs:api`: follow only the API logs.
- `pnpm compose:logs:analytics`: follow only the analytics logs.
- `pnpm compose:logs:db`: follow infrastructure logs for PostgreSQL, Redis, and Nginx.
- `pnpm compose:ps`: view current container status and health at a glance.
- `pnpm compose:restart`: rebuild the local runtime with a down/up cycle in detached mode.
- `pnpm lint`: run the shared lint checks from the repository root.
- `pnpm typecheck`: run the shared TypeScript checks from the repository root.

## Stack Overview

### `web`

- Vite + React placeholder frontend
- internal port `5173`
- exposed through Nginx at `/`

### `api`

- NestJS backend
- internal port `3000`
- exposed through Nginx at `/api`
- readiness checks PostgreSQL and Redis

### `analytics`

- FastAPI service
- internal port `8000`
- exposed through Nginx at `/analytics`
- readiness checks PostgreSQL only

### `postgres`

- PostgreSQL with PostGIS enabled
- persistent storage through a named volume

### `redis`

- base cache / future queue dependency

### `nginx`

- single local entrypoint on `http://localhost:8080`
- path-based routing for browser and service traffic

## First Run

1. Copy `.env.example` to `.env` if you need local overrides.
2. Run `pnpm compose:config` if you want to inspect the resolved stack.
3. Run `pnpm compose:up`.
4. Run `pnpm compose:ps` if you want a quick container status check.
5. Open `http://localhost:8080/`.

## Recommended Terminal Flow

To avoid a cluttered CLI while the stack is running:

- use `pnpm compose:up` in detached mode
- keep your main terminal free for Git, editor tasks, and one-off commands
- open focused log streams only when needed

Useful examples:

- `pnpm compose:logs:api`
- `pnpm compose:logs:web`
- `pnpm compose:logs:analytics`
- `pnpm compose:logs:db`
- `pnpm compose:logs`

## Verification Checklist

After the stack starts, verify:

- `pnpm compose:ps` shows the expected services
- `http://localhost:8080/` loads the frontend placeholder
- `http://localhost:8080/api/health` returns a healthy API liveness payload
- `http://localhost:8080/api/ready` returns API readiness when PostgreSQL and Redis are reachable
- `http://localhost:8080/analytics/health` returns a healthy analytics liveness payload
- `http://localhost:8080/analytics/ready` returns analytics readiness when PostgreSQL is reachable

## Current Limits

This foundation does not yet include:

- business APIs
- authentication
- worker execution
- production deployment setup
- detailed schema design

## Notes For Contributors

If you change:

- local service ports
- health endpoint behavior
- Docker Compose structure
- runtime environment variables
- Nginx routing

then update both `README.md` and this document in the same change.
