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

- `pnpm compose:config`
- `pnpm compose:up`
- `pnpm compose:down`
- `pnpm compose:logs`
- `pnpm compose:restart`
- `pnpm lint`
- `pnpm typecheck`

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
4. Open `http://localhost:8080/`.

## Verification Checklist

After the stack starts, verify:

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
