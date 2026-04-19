# Frontend Scaffold Guide

## Purpose

This document explains the frontend scaffold currently living in `apps/web`.

The goal of this scaffold is not to ship feature UI. Its job is to give the team:

- a stable frontend runtime
- a clear route structure
- shared layout and UI primitives
- a minimal app infrastructure layer
- a predictable place for future feature code

In short: this is the handoff foundation that lets feature teams start building without first debating frontend architecture.

## What We Chose

### Runtime

The frontend now uses **TanStack Start** in `apps/web`.

Why:

- it gives us a modern React app runtime with first-class TanStack Router support
- it keeps routing, document/head handling, and app bootstrapping in one place
- it leaves the door open for SSR and server functions later if the team needs them
- it works well with the current monorepo setup and Vite-based workflow

### Rendering mode

We chose **SPA mode first**.

Why:

- the current project phase is scaffolding, not SEO or server-rendered product pages
- SPA mode is simpler to reason about while the API remains the main backend surface
- it reduces the amount of runtime complexity teammates need to understand on day one
- it still keeps a path open for future SSR if requirements change

This choice lives in [apps/web/vite.config.ts](../apps/web/vite.config.ts).

### Routing

We chose **TanStack Router file-based routing**.

Why:

- routes are easy to find because the folder structure mirrors URL structure
- teammates can add pages by adding files in `src/routes`
- route ownership is visible at a glance
- TanStack generates the route tree for us, reducing manual wiring

This is why `src/routes` is treated as the only route-authoring surface.

### Data layer

We added **TanStack Query**, but only as shared plumbing.

Why:

- future feature teams will almost certainly need caching, async state, and request lifecycle handling
- it is better to set up one app-wide Query client now than let each feature create its own pattern
- we wanted the infrastructure ready without prematurely defining feature-specific data hooks

Important:

- we did **not** add domain query hooks
- we did **not** add a full API SDK
- we did **not** add auth flows

### Styling

We chose **Tailwind v4** plus a small **CSS variable token layer**.

Why:

- Tailwind gives teams speed when building feature UI
- CSS variables keep global color and surface decisions centralized
- this combination is light enough for scaffolding without committing the team to a heavyweight component system yet

### App boundary

We kept **one frontend app** in `apps/web` with two route groups:

- `/app` for citizen-facing work
- `/admin` for operator/admin-facing work

Why:

- the repo already had a single `web` app and matching Docker/Nginx wiring
- one app is enough for the current phase
- route groups give us separation without creating extra apps, duplicated config, or duplicated shared UI

## Why We Did Not Build Feature UI

This scaffold intentionally stops at placeholders.

Why:

- feature ownership belongs to other teammates
- scaffolding should provide structure, not make product decisions on behalf of feature teams
- a placeholder route is easier to replace than a half-finished “example feature” that becomes accidental architecture

That is why the routes currently render neutral placeholder pages and ownership notes instead of domain-specific workflows.

## Directory Structure

Current structure:

```text
apps/web/
  src/
    components/
      layout/
      ui/
    lib/
      http/
      query/
      utils/
    routes/
      admin/
      app/
      __root.tsx
      index.tsx
    styles/
    test/
    routeTree.gen.ts
    router.tsx
    vite-env.d.ts
```

### `src/routes`

This is the most important folder.

What it does:

- defines the application routes
- defines route layouts
- defines route pages
- is the source input for TanStack Router generation

Why it exists:

- keeps route ownership obvious
- makes URLs map directly to files
- reduces hidden router setup

Current route shape:

- `/` from [apps/web/src/routes/index.tsx](../apps/web/src/routes/index.tsx)
- `/app` from [apps/web/src/routes/app/index.tsx](../apps/web/src/routes/app/index.tsx)
- `/app/dashboard` from [apps/web/src/routes/app/dashboard.tsx](../apps/web/src/routes/app/dashboard.tsx)
- `/admin` from [apps/web/src/routes/admin/index.tsx](../apps/web/src/routes/admin/index.tsx)
- `/admin/dashboard` from [apps/web/src/routes/admin/dashboard.tsx](../apps/web/src/routes/admin/dashboard.tsx)

### `src/routes/__root.tsx`

This is the app root route.

What it does:

- defines the HTML document wrapper
- injects the main stylesheet
- provides app-wide metadata
- mounts the shared `RootFrame`
- mounts the TanStack Query provider
- mounts Router and Query devtools in development
- provides shared error and not-found handling

Why it exists:

- every route should inherit one consistent app shell
- global providers belong in one place
- the team should not repeat layout chrome or providers inside feature routes

### `src/router.tsx`

This is the router factory.

What it does:

- imports the generated route tree
- creates the app Query client
- creates the TanStack Router instance
- registers default pending, error, and not-found UI
- exports the router type registration for TanStack

Why it exists:

- keeps router creation centralized
- gives the app one shared router configuration
- ensures route generation and runtime router config stay connected

### `src/routeTree.gen.ts`

This file is **generated**.

What it does:

- converts the file-based route structure into the internal TanStack route tree
- gives TanStack Router the typed route map it needs

Why it exists:

- file-based routing needs a generated output file
- this keeps route registration automatic

Important:

- do **not** edit this file manually
- it will be regenerated by TanStack when routes change

### `src/components/layout`

This folder contains shared layout-level components.

What it does:

- `root-frame.tsx`: the app-wide outer shell and global chrome
- `root-navigation.tsx`: the top navigation between scaffold areas
- `area-shell.tsx`: shared framing for route groups like `/app` and `/admin`
- `area-navigation.tsx`: local navigation for those route groups
- `placeholder-page.tsx`: neutral route placeholder template

Why this folder exists:

- layout decisions should be shared
- feature teams should not rebuild top-level shells page by page
- keeping layout separate from UI primitives makes ownership clearer

### `src/components/ui`

This folder contains small shared UI primitives and boundary components.

What it does:

- `surface-card.tsx`: a reusable content surface
- `default-catch-boundary.tsx`: shared error UI
- `not-found.tsx`: shared not-found UI
- `route-pending.tsx`: shared loading placeholder

Why this folder exists:

- these pieces are generic enough to reuse across routes
- they are not tied to one route group
- they are intentionally minimal so we do not impose a full design system too early

### `src/lib`

This folder contains shared application infrastructure.

It is for code that is not presentation and not route definitions.

#### `src/lib/env.ts`

What it does:

- reads frontend env vars
- provides defaults
- throws if values are blank or invalid

Current variables:

- `VITE_APP_NAME`
- `VITE_API_BASE_URL`
- `VITE_ANALYTICS_BASE_URL`

Why it exists:

- reading env vars directly all over the app creates duplication and inconsistency
- centralizing env parsing makes future changes safer

#### `src/lib/http/fetch-json.ts`

What it does:

- wraps `fetch`
- builds URLs with query parameters
- parses JSON or text responses
- throws a typed `HttpError` for failed responses

Why it exists:

- feature teams need one sane default request helper
- it avoids repeating low-level fetch and error boilerplate
- it is generic enough to replace later if the team adopts a more specific API client

#### `src/lib/query/client.ts`

What it does:

- creates the app-wide TanStack Query client
- sets default query behavior

Why it exists:

- the app should have one shared Query client
- default query behavior belongs in one place

#### `src/lib/utils/cn.ts`

What it does:

- joins CSS class strings conditionally

Why it exists:

- keeps component class composition readable
- gives the team a simple utility without adding a larger dependency

### `src/styles`

This folder contains global styling.

What it does:

- `tokens.css` defines CSS custom properties like colors and text tones
- `app.css` imports Tailwind and defines global shared classes like `surface-panel`, `tag`, and `action-link`

Why it exists:

- tokens should live outside components
- global app styling should be separated from route logic
- Tailwind utilities are useful, but a few shared semantic classes reduce repetition

### `src/test`

This folder contains shared frontend test setup and app-level tests.

What it does:

- `setup.ts` loads Testing Library matchers
- route and layout tests verify the scaffold still renders and behaves as expected

Why it exists:

- the scaffold itself is now a product of the repo and should be protected from accidental breakage
- we want baseline tests even before feature work starts

## How The App Boots

The startup flow is:

1. Vite starts the app using TanStack Start from [apps/web/vite.config.ts](../apps/web/vite.config.ts).
2. TanStack Start scans `src/routes`.
3. TanStack generates `src/routeTree.gen.ts`.
4. [apps/web/src/router.tsx](../apps/web/src/router.tsx) creates the router using that generated route tree.
5. [apps/web/src/routes/__root.tsx](../apps/web/src/routes/__root.tsx) provides the document shell, Query provider, global layout, and shared boundaries.
6. Nested route files render inside `<Outlet />`.

## Why The Route Groups Look The Way They Do

We split the app into:

- `src/routes/app`
- `src/routes/admin`

Why:

- it creates a clear separation between the two broad product areas already known in the project
- teammates can immediately see where new pages belong
- shared area-specific layout can live once in `route.tsx`

This is why [apps/web/src/routes/app/route.tsx](../apps/web/src/routes/app/route.tsx) and [apps/web/src/routes/admin/route.tsx](../apps/web/src/routes/admin/route.tsx) exist even though they currently render placeholders.

They are route-group layout boundaries, not feature pages.

## Why We Committed The Generated Route Tree

We committed `src/routeTree.gen.ts` on purpose.

Why:

- the app needs it for type-safe routing
- teammates should not have to guess whether a missing generated file is expected
- keeping it committed avoids “works on my machine” issues when someone checks out the repo fresh

The rule is simple:

- route files are authored by humans
- `routeTree.gen.ts` is authored by the generator

## Why These Dependencies Exist

Main runtime dependencies in [apps/web/package.json](../apps/web/package.json):

- `@tanstack/react-start`: frontend app runtime
- `@tanstack/react-router`: routing
- `@tanstack/react-query`: shared async state and data caching
- `react` and `react-dom`: React runtime

Main dev dependencies:

- `vite`: dev/build tool
- `@vitejs/plugin-react`: React support for Vite
- `@tanstack/router-plugin`: route generation support
- `tailwindcss` and `@tailwindcss/vite`: styling
- `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`: test baseline
- router/query devtools: useful during development, excluded from production behavior

## Why The Versions Were Pinned

The TanStack Start stack was pinned to exact versions instead of loose ranges.

Why:

- TanStack Start is still moving quickly
- router, start, and plugin packages need to stay in sync
- exact versions reduce surprise breakage during the early scaffolding phase

## What Is Intentionally Missing

This scaffold does **not** define:

- authentication flows
- protected route logic
- feature-specific API hooks
- feature folders by domain
- a full design system
- real product pages

Why:

- those decisions belong to the feature teams and future implementation work
- the scaffold should enable product work, not pre-empt it

## How To Extend It Safely

### Add a new route

1. Add a file under `src/routes`.
2. Use `createFileRoute(...)`.
3. Let TanStack regenerate `src/routeTree.gen.ts`.

Good examples:

- add `src/routes/app/profile.tsx` for `/app/profile`
- add `src/routes/admin/users.tsx` for `/admin/users`

### Add shared layout

If the code affects route framing or shared navigation, place it in:

- `src/components/layout`

### Add small reusable UI

If the code is generic and presentational, place it in:

- `src/components/ui`

### Add app-wide infrastructure

If the code is shared logic and not UI, place it in:

- `src/lib`

### Add feature-specific code later

When feature work begins, route files can either:

- keep route-specific logic local to the route
- or introduce feature folders once repeated domain logic actually exists

We intentionally did not create speculative `features/*` folders yet, because that would pretend we know future feature boundaries before the team has built them.

## Commands The Team Should Know

From the repo root:

```bash
pnpm --filter @ecobairro/web dev
pnpm --filter @ecobairro/web lint
pnpm --filter @ecobairro/web typecheck
pnpm --filter @ecobairro/web test
pnpm --filter @ecobairro/web build
```

## Mental Model

If you only remember one thing, remember this:

- `routes` define where the app goes
- `layout` defines shared page structure
- `ui` defines small reusable presentation pieces
- `lib` defines shared non-UI infrastructure
- `routeTree.gen.ts` is generated glue

That separation is the main architectural choice behind this scaffold.

## Current Validation

The scaffold was validated with:

- `pnpm --filter @ecobairro/web lint`
- `pnpm --filter @ecobairro/web typecheck`
- `pnpm --filter @ecobairro/web test`
- `pnpm --filter @ecobairro/web build`

## Future Evolution

This scaffold can evolve in a few directions later:

- add auth and protected route boundaries
- add real domain query hooks or a typed API client
- add SSR if the product truly benefits from it
- add a fuller design system once repeated UI patterns emerge

Those are intentionally deferred until they are justified by real feature work.
