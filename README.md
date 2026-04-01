# EcoBairro

EcoBairro is a platform focused on ecopoint discovery, reporting, telemetry visibility, and operational support for waste-related workflows.

## Current Bootstrap Direction

The repository is being bootstrapped as a fully containerized local foundation with:

- one frontend app in `apps/web`
- one main backend app in `apps/api`
- one analytics service in `apps/analytics`
- shared TypeScript packages in `packages/`
- local infrastructure assets in `infra/`

This phase is intentionally limited to runtime scaffolding, health checks, and local orchestration.

## Planned Local Commands

- `pnpm lint`
- `pnpm typecheck`
- `pnpm compose:config`
- `pnpm compose:up`

## Local Setup

1. Make sure Docker Desktop or your local Docker daemon is running.
2. Copy `.env.example` to `.env` if you need to override local defaults.
3. Run `docker compose -f infra/compose/docker-compose.yml up --build`.
4. Open `http://localhost:8080/`.

## Current App Status

- `apps/web`: placeholder frontend scaffolded
- `apps/api`: NestJS health and readiness scaffolded
- `apps/analytics`: FastAPI health and readiness scaffolded

## Current Infra Status

- base Docker Compose stack scaffolded for `web`, `api`, `analytics`, `postgres`, and `redis`
- PostGIS init script added for the local database
- Nginx routes all local traffic through a single entrypoint on `http://localhost:8080`

## Planned Health Surfaces

- `web`: browser placeholder page
- `api`: `/health` and `/ready`
- `analytics`: `/health` and `/ready`

## Local Endpoints

- `http://localhost:8080/`
- `http://localhost:8080/api/health`
- `http://localhost:8080/api/ready`
- `http://localhost:8080/analytics/health`
- `http://localhost:8080/analytics/ready`

## Repository Structure

```text
apps/
packages/
docs/
infra/
```
