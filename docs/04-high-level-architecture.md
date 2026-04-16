# High-Level Architecture

## Main Building Blocks

### Frontend

A React + TypeScript application in `apps/web` responsible for:

- user interface
- map interaction
- dashboards
- report submission flows
- operator views
- acting as the initial browser-visible placeholder runtime

### Main Backend

A NestJS + TypeScript backend in `apps/api` responsible for:

- API endpoints
- business rules
- validation
- orchestration
- core domain workflows
- telemetry ingestion
- report handling
- exposing `/health` and `/ready` during the foundation phase

### Analytics / Compute Service

A FastAPI service in `apps/analytics` responsible for:

- asynchronous heavy processing
- route or planning calculations
- compute-intensive background jobs
- foundation-phase health and readiness verification

This service may later use a different implementation language if justified by workload needs.

### Queue

A job queue used to:

- decouple heavy processing from the main backend
- avoid blocking request-response flows
- support retries and asynchronous execution

### Database

A PostgreSQL database with PostGIS support responsible for:

- operational data
- geospatial data
- telemetry-related persistence
- derived or computed results where appropriate

### Redis

Redis is included in the base stack for:

- shared dependency readiness in the main backend
- future queue or cache support
- keeping the runtime foundation aligned with the intended architecture

### Nginx

A minimal Nginx reverse proxy is used to:

- provide one stable local entrypoint
- route `/` to `web`
- route `/api/` to `api`
- route `/analytics/` to `analytics`

## Initial Direction

The current architectural direction is:

- one main TypeScript-first product stack
- one main backend for operational logic
- one separate path for heavier computation
- one central relational + geospatial data layer
- asynchronous processing where compute cost justifies separation

## Current Runtime Topology

The current local stack is:

- `nginx`
- `web`
- `api`
- `analytics`
- `postgres`
- `redis`

All of these are orchestrated through Docker Compose during local development.

## Foundation-Phase Health Model

The current baseline is intentionally simple:

- `web` must be reachable in the browser
- `api` must expose `/health` and `/ready`
- `analytics` must expose `/health` and `/ready`
- `api` readiness checks PostgreSQL and Redis
- `analytics` readiness checks PostgreSQL
- PostgreSQL and Redis use Compose health checks
