# Domain Map

This document identifies the main functional domains of the system.

## Candidate Domains

### Identity and Access

Responsible for:

- users
- roles
- authentication
- authorization

### Ecopoints

Responsible for:

- ecopoint records
- ecopoint metadata
- ecopoint location
- ecopoint status presentation

### Telemetry

Responsible for:

- sensor/device data ingestion
- observations/readings
- freshness and status updates
- telemetry history

### Reports

Responsible for:

- citizen issue reports
- duplicate detection
- anti-spam validation
- report lifecycle and tracking

### Operations / Dashboard

Responsible for:

- operational views
- triage support
- monitoring summaries
- KPIs and aggregated visibility

### Zones

Responsible for:

- operational regions
- spatial grouping or assignment logic

### Notifications

Responsible for:

- state-change notifications
- user-facing communication triggers

### Collection Requests

Responsible for:

- bulky-waste-related requests or workflows

### Routing / Planning

Responsible for:

- heavier route or planning calculations
- async processing support
- derived optimization outputs

## Notes

These domains are documentation and ownership boundaries first.
They do not automatically imply independent deployable services.

## Current Runtime Mapping

The current foundation runtime maps these boundaries to a small number of deployable units:

- `apps/web` is the shared frontend entrypoint for citizen and operator experiences
- `apps/api` is the main operational backend and future home for most domain workflows
- `apps/analytics` is a separate service reserved for analytics and heavier compute-oriented behavior

At this stage:

- domains are not yet split into separate services
- shared packages are for configuration and contracts only
- no ORM or persistence-layer ownership has been formalized yet
