# Questions to Clarify

This document tracks the main open questions that affect architecture decisions.

## Current Priority Questions

### Product / Scope

- What is part of version 1?
- What is future scope only?
- Is citizen-to-citizen sharing in scope for the first implementation?

### Frontend

- Is there one frontend application with separate areas, or separate frontend apps for citizen and operator flows?
- How much logic should stay in the frontend vs backend?

### Backend

- Is NestJS the chosen framework for the main backend?
- What belongs in the main backend from day one?
- What should explicitly not belong in the main backend?

### Worker / Compute

- Is the worker introduced in version 1 or later?
- Is route calculation its only responsibility initially?
- Should the worker write directly to the database or only return results?

### Data

- Do we use one PostgreSQL database with PostGIS for everything?
- Should data be separated by schema?
- What data is canonical vs derived?

### Runtime

- Which flows must feel real-time?
- What should be synchronous?
- What should be asynchronous?

### Repo / Delivery

- What is the minimal monorepo structure for the first iteration?
- What CI checks are required before merging to main?
