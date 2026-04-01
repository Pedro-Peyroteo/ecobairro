# Questions to Clarify

This document tracks the main open questions that affect architecture decisions.

## Resolved For The Foundation Phase

The following decisions are already locked for the current runtime foundation:

- the repository is a monorepo
- there is one frontend app in `apps/web`
- the main backend is a NestJS service in `apps/api`
- the analytics service is a FastAPI app in `apps/analytics`
- local development is fully containerized with Docker Compose
- PostgreSQL + PostGIS is the primary database
- Redis is included in the base stack
- Nginx routes local traffic through one entrypoint on `http://localhost:8080`
- this phase is limited to bootable scaffolds, health checks, and dependency readiness

## Remaining Priority Questions

### Product / Scope

- What is part of version 1?
- What is future scope only?
- Is citizen-to-citizen sharing in scope for the first implementation?

### Frontend

- Is there one frontend application with separate areas, or separate frontend apps for citizen and operator flows?
- How much logic should stay in the frontend vs backend?

### Backend

- What belongs in the main backend from day one?
- What should explicitly not belong in the main backend?

### Worker / Compute

- Is the worker introduced in version 1 or later?
- Is route calculation its only responsibility initially?
- Should the worker write directly to the database or only return results?

### Data

- Should data be separated by schema?
- What data is canonical vs derived?

### Runtime

- Which flows must feel real-time?
- What should be synchronous?
- What should be asynchronous?

### Repo / Delivery

- What CI checks are required before merging to main?
