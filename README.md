# EcoBairro

EcoBairro is a platform focused on ecopoint discovery, reporting, telemetry visibility, and operational support for waste-related workflows.

## Foundation Status

The repository now includes the first local runtime foundation with:

- one frontend app in `apps/web`
- one main backend app in `apps/api`
- one analytics service in `apps/analytics`
- shared TypeScript packages in `packages/`
- Docker Compose orchestration in `infra/compose`
- Nginx path-based routing in `infra/nginx`
- PostgreSQL + PostGIS and Redis in the base stack

This phase is intentionally limited to runtime scaffolding, health checks, and local orchestration.

## Prerequisites

- Docker Desktop or a local Docker daemon
- Node.js with Corepack-enabled `pnpm`

## Local Commands

- `pnpm install --no-frozen-lockfile`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm compose:config`
- `pnpm compose:up`
- `pnpm compose:down`
- `pnpm compose:logs`
- `pnpm compose:restart`

## Local Setup

1. Make sure Docker Desktop or your local Docker daemon is running.
2. Copy `.env.example` to `.env` if you need to override local defaults.
3. Run `pnpm compose:up`.
4. Open `http://localhost:8080/`.

## Current App Status

- `apps/web`: placeholder frontend scaffolded
- `apps/api`: NestJS health and readiness scaffolded
- `apps/analytics`: FastAPI health and readiness scaffolded

## Current Infra Status

- base Docker Compose stack scaffolded for `web`, `api`, `analytics`, `postgres`, and `redis`
- PostGIS init script added for the local database
- Nginx routes all local traffic through a single entrypoint on `http://localhost:8080`

## Health Surfaces

- `web`: browser placeholder page
- `api`: `/health` and `/ready`
- `analytics`: `/health` and `/ready`

## Local Endpoints

- `http://localhost:8080/`
- `http://localhost:8080/api/health`
- `http://localhost:8080/api/ready`
- `http://localhost:8080/analytics/health`
- `http://localhost:8080/analytics/ready`

## Docs

- `docs/00-questions-to-clarify.md`: resolved vs remaining architecture questions
- `docs/01-scope-and-goals.md`: product scope and foundation-phase goals
- `docs/02-actors-and-use-cases.md`: actors, product use cases, and foundation runtime use cases
- `docs/03-domain-map.md`: domain ownership boundaries and current runtime mapping
- `docs/04-high-level-architecture.md`: current stack and runtime topology
- `docs/05-local-runtime-bootstrap.md`: teammate-facing setup and verification guide

## Repository Structure

```text
apps/
packages/
docs/
infra/
```
