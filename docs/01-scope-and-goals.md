# Scope and Goals

## Purpose

EcoBairro is a platform intended to support ecopoint discovery, issue reporting, telemetry visibility, and operational decision-making around urban waste-related workflows.

It serves two main perspectives:

- citizen-facing usage
- operator / municipality-facing usage

## Current Foundation Phase

The repository is currently in the runtime-foundation phase.

That phase is focused on:

- getting the core local stack bootable on every developer machine
- standardizing app and infra boundaries early
- validating service-to-service connectivity before business features begin
- keeping the initial architecture intentionally small and easy to evolve

## In Scope

The current architecture is intended to support:

- ecopoint discovery and visualization
- georeferenced reporting of issues
- report tracking and operational handling
- telemetry ingestion and status visibility
- dashboard-style operational monitoring
- future support for heavier planning or route-related calculations

For the current foundation phase specifically, in-scope work includes:

- local Docker Compose orchestration
- React, NestJS, and FastAPI runtime scaffolds
- PostgreSQL + PostGIS and Redis wiring
- Nginx path-based local routing
- health and readiness verification only

## Out of Scope

For now, the architecture does not assume:

- large-scale microservice decomposition
- premature infrastructure complexity
- advanced analytics everywhere by default
- unnecessary splitting of the main stack into multiple languages without strong justification
- business endpoints beyond bootstrap health surfaces
- production deployment design
- queue worker implementation
- detailed schema modelling

## Architectural Goals

The architecture should optimize for:

- clarity of ownership
- maintainability
- consistency across the main stack
- separation of operational logic from heavy computation
- support for geospatial data as a first-class concern
- a predictable local setup experience for teammates
- ability to evolve without major rewrites
