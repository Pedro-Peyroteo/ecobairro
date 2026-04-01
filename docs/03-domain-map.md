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
