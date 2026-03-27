# High-Level Architecture

## Main Building Blocks

### Frontend

A React + TypeScript application responsible for:

- user interface
- map interaction
- dashboards
- report submission flows
- operator views

### Main Backend

A Node.js + TypeScript backend responsible for:

- API endpoints
- business rules
- validation
- orchestration
- core domain workflows
- telemetry ingestion
- report handling

### Worker / Compute Service

A separate service responsible for:

- asynchronous heavy processing
- route or planning calculations
- compute-intensive background jobs

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

## Initial Direction

The current architectural direction is:

- one main TypeScript-first product stack
- one main backend for operational logic
- one separate path for heavier computation
- one central relational + geospatial data layer
- asynchronous processing where compute cost justifies separation
