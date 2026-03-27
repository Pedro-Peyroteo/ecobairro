# Scope and Goals

## Purpose

EcoBairro is a platform intended to support ecopoint discovery, issue reporting, telemetry visibility, and operational decision-making around urban waste-related workflows.

It serves two main perspectives:

- citizen-facing usage
- operator / municipality-facing usage

## In Scope

The current architecture is intended to support:

- ecopoint discovery and visualization
- georeferenced reporting of issues
- report tracking and operational handling
- telemetry ingestion and status visibility
- dashboard-style operational monitoring
- future support for heavier planning or route-related calculations

## Out of Scope

For now, the architecture does not assume:

- large-scale microservice decomposition
- premature infrastructure complexity
- advanced analytics everywhere by default
- unnecessary splitting of the main stack into multiple languages without strong justification

## Architectural Goals

The architecture should optimize for:

- clarity of ownership
- maintainability
- consistency across the main stack
- separation of operational logic from heavy computation
- support for geospatial data as a first-class concern
- ability to evolve without major rewrites
