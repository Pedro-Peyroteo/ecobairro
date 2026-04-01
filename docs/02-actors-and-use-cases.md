# Actors and Use Cases

## Main Actors

### Citizen

Interacts with the public-facing product to:

- discover ecopoints
- inspect ecopoint status
- submit reports
- follow report progress
- access guidance for bulky-waste related actions

### Operator / Municipality Staff

Interacts with the operational side of the system to:

- monitor ecopoints and reports
- inspect telemetry and status
- triage and resolve issues
- manage zones or operational areas
- consult dashboards and KPIs

### Sensor / External Device

Interacts with the system by:

- sending telemetry or status observations

### Compute Worker

Internal system actor responsible for:

- processing asynchronous heavy jobs
- running route/planning/optimization calculations when required

### Developer

Interacts with the repository during the current foundation phase to:

- boot the local stack
- verify service health and readiness
- extend the runtime skeleton safely

## Main Use Cases

### Citizen Side

- view ecopoints on a map
- filter ecopoints
- inspect ecopoint details
- report an issue
- follow a report state

### Operator Side

- view active reports
- inspect ecopoint status
- analyze problem concentration
- manage operational response
- consult historical or aggregated information

### System Side

- ingest telemetry
- validate incoming data
- process asynchronous jobs
- update derived operational information

### Foundation Runtime Side

- start the local containerized stack with a single command
- route local traffic through one entrypoint
- verify PostgreSQL, Redis, API, and analytics connectivity
- confirm the frontend placeholder is reachable
