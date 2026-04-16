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

- `pnpm install --no-frozen-lockfile`: install or refresh all workspace dependencies from the repo root.
- `pnpm lint`: run lint checks for the shared packages and the JS/TS apps.
- `pnpm typecheck`: run TypeScript type checks for the shared packages and the JS/TS apps.
- `pnpm compose:config`: render the resolved Docker Compose configuration to confirm env and service wiring.
- `pnpm compose:up`: build images if needed and start the full local stack in detached mode.
- `pnpm compose:down`: stop and remove the local stack containers and networks.
- `pnpm compose:logs`: stream the combined logs for the whole stack.
- `pnpm compose:logs:web`: follow logs only for the frontend container.
- `pnpm compose:logs:api`: follow logs only for the NestJS API container.
- `pnpm compose:logs:analytics`: follow logs only for the FastAPI analytics container.
- `pnpm compose:logs:db`: follow logs for infrastructure services such as PostgreSQL, Redis, and Nginx.
- `pnpm compose:ps`: show current container status for the stack.
- `pnpm compose:restart`: recreate the local stack with a clean down/up cycle in detached mode.

## Local Setup

1. Make sure Docker Desktop or your local Docker daemon is running.
2. Copy `.env.example` to `.env` if you need to override local defaults.
3. Run `pnpm compose:up`.
4. Run `pnpm compose:ps` if you want a quick status check.
5. Open `http://localhost:8080/`.

## Terminal Workflow

Recommended local flow:

- keep `pnpm compose:up` detached so your main shell stays usable
- use `pnpm compose:logs` only when you want combined logs
- prefer targeted logs such as `pnpm compose:logs:api` or `pnpm compose:logs:web` while implementing one area
- use `pnpm compose:ps` for a quick container status check

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
