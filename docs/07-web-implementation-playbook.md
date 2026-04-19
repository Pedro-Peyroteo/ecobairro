# Web Implementation Playbook

## Purpose

This document explains how teammates should implement work inside `apps/web` as it exists today.

Use this guide when you are:

- adding a new page
- extending an existing route group
- introducing shared UI
- wiring API calls
- adding frontend tests

This is the "how to build on the scaffold" companion to [docs/06-frontend-scaffold.md](06-frontend-scaffold.md), which explains the architecture and why the stack was chosen.

## Quick Mental Model

Before changing anything in `apps/web`, keep this split in mind:

- `src/routes`: route files and route layouts
- `src/components/layout`: app-level and area-level page framing
- `src/components/ui`: small shared presentational building blocks
- `src/lib`: shared non-UI infrastructure
- `src/styles`: global styles and tokens
- `src/test`: shared test setup and app-level tests

If a file does not clearly belong in one of those buckets, pause and simplify the change before introducing a new pattern.

## Implementation Workflow

For most frontend work, the safe order is:

1. Decide which route owns the work.
2. Add or update the route file under `src/routes`.
3. Add shared layout or UI only if the route needs reusable structure.
4. Add data access through `src/lib/http` and TanStack Query when the route needs remote data.
5. Add or update tests.
6. Run validation before opening a PR.

That order keeps route ownership obvious and prevents shared abstractions from appearing too early.

## Step 1: Pick The Correct Route Area

Today the app has three main route areas:

- `/` for the neutral entry page
- `/app/*` for citizen-facing pages
- `/admin/*` for operator/admin pages

Examples:

- a citizen profile page should live under `src/routes/app`
- an internal moderation or operations page should live under `src/routes/admin`
- a global landing or handoff page should live under `src/routes`

Relevant files:

- [apps/web/src/routes/index.tsx](../apps/web/src/routes/index.tsx)
- [apps/web/src/routes/app/route.tsx](../apps/web/src/routes/app/route.tsx)
- [apps/web/src/routes/admin/route.tsx](../apps/web/src/routes/admin/route.tsx)

## Step 2: Add Or Update A Route

Routes are authored with TanStack Router file-based routing.

That means the file path defines the URL.

Examples:

- `src/routes/app/profile.tsx` becomes `/app/profile`
- `src/routes/admin/users.tsx` becomes `/admin/users`

Start from an existing route as a template:

- [apps/web/src/routes/app/index.tsx](../apps/web/src/routes/app/index.tsx)
- [apps/web/src/routes/admin/dashboard.tsx](../apps/web/src/routes/admin/dashboard.tsx)

The usual route pattern is:

```tsx
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/app/profile")({
  component: AppProfilePage,
});

function AppProfilePage() {
  return <div>Replace with real page content.</div>;
}
```

Rules:

- keep route files focused on route ownership
- do not place global providers inside route files
- prefer extracting reusable UI instead of growing one route into a giant file

## Step 3: Let TanStack Regenerate The Route Tree

After adding or renaming route files, TanStack regenerates [apps/web/src/routeTree.gen.ts](../apps/web/src/routeTree.gen.ts).

Important rules:

- do not edit `routeTree.gen.ts` manually
- do commit it after route changes
- treat it as generated source, not as disposable build output

This file exists so the app keeps typed route definitions in sync with the `src/routes` tree.

## Step 4: Decide Whether The Change Is Route-Local Or Shared

Before creating new shared code, ask:

- is this used in only one route right now?
- is the reuse real, or am I guessing future reuse?

Use these rules:

- keep code inside the route when the behavior is local
- move code to `components/ui` when it is a small reusable presentational piece
- move code to `components/layout` when it affects shared page framing or navigation
- move code to `lib` when it is shared non-UI infrastructure

Avoid creating speculative feature folders unless repeated domain logic actually appears.

## Step 5: Use The Existing Layout Layer Correctly

The scaffold already has two layout levels:

- root app shell in [apps/web/src/components/layout/root-frame.tsx](../apps/web/src/components/layout/root-frame.tsx)
- area shells in [apps/web/src/components/layout/area-shell.tsx](../apps/web/src/components/layout/area-shell.tsx)

Use `components/layout` for:

- shared headers
- section navigation
- common content framing
- route-group shells

Do not use `components/layout` for:

- one-off cards
- small buttons
- domain-specific widgets that only one page needs

If a component mostly answers "how is this page area structured?", it is probably layout code.

## Step 6: Use `components/ui` For Neutral Presentational Pieces

`components/ui` is for reusable pieces that stay generic across routes.

Current examples:

- [apps/web/src/components/ui/surface-card.tsx](../apps/web/src/components/ui/surface-card.tsx)
- [apps/web/src/components/ui/route-pending.tsx](../apps/web/src/components/ui/route-pending.tsx)
- [apps/web/src/components/ui/not-found.tsx](../apps/web/src/components/ui/not-found.tsx)

Use `components/ui` when a component is:

- generic
- presentational
- not tied to one route group
- not coupled to one domain feature

Do not put API calls, route ownership logic, or app-wide providers in `components/ui`.

## Step 7: Add Data Access Through The Shared HTTP And Query Layer

The current scaffold already gives you:

- a generic request helper in [apps/web/src/lib/http/fetch-json.ts](../apps/web/src/lib/http/fetch-json.ts)
- an app-wide Query client in [apps/web/src/lib/query/client.ts](../apps/web/src/lib/query/client.ts)
- env configuration in [apps/web/src/lib/env.ts](../apps/web/src/lib/env.ts)

Preferred pattern:

1. Add a small route-specific loader function or query function.
2. Use `fetchJson` for the network call.
3. Use TanStack Query in the route component if the data is client-fetched.

Example shape:

```tsx
import { useQuery } from "@tanstack/react-query";

import { fetchJson } from "../lib/http/fetch-json";
import { clientEnv } from "../lib/env";

function ExamplePage() {
  const reportsQuery = useQuery({
    queryKey: ["reports"],
    queryFn: () =>
      fetchJson("/api/reports", {
        baseUrl: clientEnv.apiBaseUrl,
      }),
  });

  if (reportsQuery.isPending) {
    return <div>Loading...</div>;
  }

  if (reportsQuery.isError) {
    return <div>Something went wrong.</div>;
  }

  return <pre>{JSON.stringify(reportsQuery.data, null, 2)}</pre>;
}
```

Guidelines:

- keep `fetchJson` as the low-level default unless there is a strong reason to replace it
- avoid scattering raw `fetch(...)` calls through route files
- prefer one clear query per route need over inventing a full SDK too early

## Step 8: Read Env Vars Only Through `clientEnv`

Do not read `import.meta.env` directly across the app.

Instead, use [apps/web/src/lib/env.ts](../apps/web/src/lib/env.ts).

Why:

- env parsing stays centralized
- validation stays consistent
- future env changes only need one update path

If a new frontend env var is truly needed:

1. add it to `src/lib/env.ts`
2. document it in `.env.example`
3. mention it in the relevant docs if teammates need to set it locally

## Step 9: Style With Existing Tokens And Shared Classes First

The current styling layer lives in:

- [apps/web/src/styles/tokens.css](../apps/web/src/styles/tokens.css)
- [apps/web/src/styles/app.css](../apps/web/src/styles/app.css)

Preferred styling order:

1. reuse an existing semantic class if one already exists
2. use Tailwind utilities when the styling is local to the component
3. add or extend tokens when the design decision is global

Good use cases for tokens:

- shared colors
- consistent text tones
- surface backgrounds

Good use cases for local utilities:

- one-off spacing
- grid tweaks
- local alignment

Avoid burying the same magic values in multiple route files.

## Step 10: Keep Providers And Global Wiring In The Root

Global providers already live in [apps/web/src/routes/\_\_root.tsx](../apps/web/src/routes/__root.tsx).

That file owns:

- document shell
- app stylesheet link
- Query client provider
- devtools
- root layout
- root-level error and not-found behavior

Only change `__root.tsx` when the behavior is truly global.

Do not move route-specific concerns into the root just because they are shared by two nearby pages.

## Step 11: Add Tests Close To The Current Patterns

The scaffold already includes:

- [apps/web/src/test/home-page.test.tsx](../apps/web/src/test/home-page.test.tsx)
- [apps/web/src/components/layout/root-frame.test.tsx](../apps/web/src/components/layout/root-frame.test.tsx)
- [apps/web/src/lib/env.test.ts](../apps/web/src/lib/env.test.ts)

Use these as the baseline.

Testing rules:

- test behavior, not implementation trivia
- add route tests when route output or loading states change
- add utility tests when shared logic gains branching behavior
- keep test names readable and feature-focused

## Step 12: Run The Normal Frontend Validation Set

From the repo root:

```bash
pnpm --filter @ecobairro/web lint
pnpm --filter @ecobairro/web typecheck
pnpm --filter @ecobairro/web test
pnpm --filter @ecobairro/web build
```

Run all four before opening a frontend PR unless the change is docs-only.

## Suggested Route Implementation Checklist

Use this checklist when implementing a new page:

1. Choose the correct route area: `/`, `/app`, or `/admin`.
2. Create or update the route file in `src/routes`.
3. Reuse an existing layout shell if possible.
4. Extract only truly shared UI into `components/ui`.
5. Use `fetchJson` and Query when the page needs API data.
6. Keep env access inside `clientEnv`.
7. Let `routeTree.gen.ts` regenerate and commit it.
8. Add or update tests.
9. Run `lint`, `typecheck`, `test`, and `build`.

## What Not To Do

Avoid these mistakes:

- editing `routeTree.gen.ts` manually
- creating new global providers inside route files
- putting domain-specific feature logic into generic `components/ui`
- reading `import.meta.env` directly all over the app
- adding broad shared abstractions before real reuse exists
- committing `.tanstack`, `.output`, or `.nitro`

## Recommended First References

When implementing in `apps/web`, start by reading:

- [docs/06-frontend-scaffold.md](06-frontend-scaffold.md)
- [apps/web/src/routes/\_\_root.tsx](../apps/web/src/routes/__root.tsx)
- [apps/web/src/router.tsx](../apps/web/src/router.tsx)
- [apps/web/src/lib/http/fetch-json.ts](../apps/web/src/lib/http/fetch-json.ts)
- one route file close to the area you are changing

That is usually enough context to make a clean change without re-learning the whole stack from scratch.
