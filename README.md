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

## Repository Structure

```text
apps/
packages/
docs/
infra/
```
