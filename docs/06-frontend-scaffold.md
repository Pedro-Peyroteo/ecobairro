# Frontend Scaffold Guide

## Purpose

This document explains the frontend scaffold currently living in `apps/web`.

The goal of this scaffold is not to ship feature UI. Its job is to give the team:

- a stable frontend runtime (Vite + TanStack Router SPA)
- a clear route structure with authentication-aware layouts
- a shared vertical navigation layout and UI component library
- a minimal app infrastructure layer (env, HTTP, query)
- a predictable place for future feature code

## What We Chose

### Runtime

The frontend uses **Vite + TanStack Router** in SPA mode in `apps/web`.

Why:

- straightforward SPA architecture, easy to reason about during the scaffolding phase
- TanStack Router provides file-based routing with full TypeScript type safety
- leaves the door open for SSR adoption later if the product needs it
- works well with the current monorepo setup

### Routing

We chose **TanStack Router file-based flat routes** with the `_layoutmain` prefix convention.

Why:

- flat file names mirror URL structure without nested folders
- the `_layoutmain` prefix attaches all dashboard routes to one shared layout
- teammates can add pages by adding a single file in `src/routes`
- TanStack generates the route tree automatically

This is why `src/routes` is treated as the only route-authoring surface.

### Data layer

We provide **TanStack Query** as shared plumbing via `QueryClientProvider` in `main.tsx`.

Why:

- feature teams will need caching, async state, and request lifecycle management
- one app-wide Query client avoids each feature inventing its own pattern
- infrastructure is ready without prematurely defining feature-specific hooks

Important:

- we did **not** add domain query hooks — those belong to feature work
- we did **not** add a full API SDK — use `fetchJson` from `src/lib/http`
- we did **not** add server-side auth flows — session is stored client-side for now

### Styling

We chose **Tailwind v4** with a **CSS variable token layer** in `src/styles/globals.css`.

Tokens cover: colors (primary green, backgrounds, sidebar), borders, shadows, and border-radius scale.
Light and dark modes are supported via the `.dark` class (managed by `next-themes`).

### Layout

The scaffold provides a **vertical sidebar layout** via `_layoutmain.tsx` which wraps all authenticated dashboard routes:

- collapsible sidebar (`Navigation`) on desktop
- drawer (`Sheet`) on mobile
- top `Navbar` with user menu
- `Footer`

Authentication is enforced via `requireAuth()` in `beforeLoad` on the `_layoutmain` route.

## Directory Structure

```text
apps/web/
  src/
    @layouts/
      VerticalLayout.tsx          ← Sidebar + content grid
      components/vertical/        ← Layout sub-components
    components/
      layout/
        vertical/
          Navigation.tsx          ← Sidebar nav items (role-aware)
          Navbar.tsx              ← Top bar with user menu
          NavbarContent.tsx
          Footer.tsx
          FooterContent.tsx
        shared/
          Logo.tsx
      ui/                         ← shadcn/ui primitives (Radix-based)
    lib/
      env.ts                      ← Centralized VITE_* env access
      auth.ts                     ← getUser(), requireAuth(), requireRole()
      utils.ts                    ← cn() class merge utility
      http/
        fetch-json.ts             ← Typed fetch wrapper + HttpError
      query/
        client.ts                 ← createQueryClient() factory
    mocks/                        ← Static placeholder data (remove in production)
    routes/
      __root.tsx                  ← App root: ThemeProvider + GoogleOAuthProvider
      _layoutmain.tsx             ← Authenticated layout shell (auth guard)
      _layoutmain.home.tsx        ← /home
      _layoutmain.dashboard.tsx   ← /dashboard
      _layoutmain.mapa.tsx        ← /mapa
      _layoutmain.ecopontos.tsx   ← /ecopontos
      _layoutmain.reportes.tsx    ← /reportes
      _layoutmain.recolhas.tsx    ← /recolhas
      _layoutmain.partilhas.tsx   ← /partilhas
      _layoutmain.campanhas.tsx   ← /campanhas
      _layoutmain.noticias.tsx    ← /noticias
      _layoutmain.quiz.tsx        ← /quiz
      _layoutmain.rotas.tsx       ← /rotas
      _layoutmain.zonas.tsx       ← /zonas
      _layoutmain.utilizadores.tsx← /utilizadores
      _layoutmain.audit.tsx       ← /audit
      _layoutmain.analytics.tsx   ← /analytics
      _layoutmain.fila.tsx        ← /fila
      _layoutmain.mapa-sensores.tsx← /mapa-sensores
      _layoutmain.configuracoes.tsx← /configuracoes
      login.tsx                   ← /login
      register.tsx                ← /register
      forgot-password.tsx         ← /forgot-password
      index.tsx                   ← / (redirect to /home)
    styles/
      globals.css                 ← Tailwind import, CSS tokens, dark mode, scrollbar
    types/
      index.ts                    ← UserRole, User, NavItem types
    routeTree.gen.ts              ← Generated — do NOT edit manually
    main.tsx                      ← App entry: QueryClientProvider + RouterProvider
```

## Authentication Model

Authentication is session-based on the client:

- `sessionStorage.getItem('user')` holds the current `User` object after login
- `requireAuth()` in `src/lib/auth.ts` redirects unauthenticated users to `/login`
- `requireRole(allowed)` redirects users whose role is not in the allowed list to `/home`
- The `_layoutmain` route runs `requireAuth` in `beforeLoad` — all protected routes inherit this guard automatically

**Important:** this is a scaffold-level auth mechanism. Replace with a proper JWT refresh flow connected to the NestJS API when building the real auth feature.

## Infrastructure Layer (`src/lib`)

### `src/lib/env.ts`

Centralized env var parsing. Never read `import.meta.env` directly in route or component files.

```ts
import { clientEnv } from '@/lib/env'

const url = `${clientEnv.apiBaseUrl}/v1/reports`
```

Available vars:

- `VITE_API_BASE_URL` — defaults to `/api`
- `VITE_ANALYTICS_BASE_URL` — defaults to `/analytics`
- `VITE_APP_NAME` — defaults to `ecoBairro`
- `VITE_GOOGLE_CLIENT_ID` — optional, disables Google OAuth when absent

### `src/lib/http/fetch-json.ts`

Typed `fetch` wrapper. Use for all API calls.

```ts
import { fetchJson, HttpError } from '@/lib/http/fetch-json'
import { clientEnv } from '@/lib/env'

try {
  const data = await fetchJson<MyResponse>('/v1/ecopontos', {
    baseUrl: clientEnv.apiBaseUrl,
    params: { zona: '123' },
  })
} catch (err) {
  if (err instanceof HttpError) {
    console.error(err.status, err.body)
  }
}
```

### `src/lib/query/client.ts`

Creates the app-wide `QueryClient`. Already wired in `main.tsx` via `QueryClientProvider`. Use TanStack Query hooks anywhere:

```ts
import { useQuery } from '@tanstack/react-query'
import { fetchJson } from '@/lib/http/fetch-json'
import { clientEnv } from '@/lib/env'

const { data, isPending, isError } = useQuery({
  queryKey: ['ecopontos'],
  queryFn: () => fetchJson('/v1/ecopontos', { baseUrl: clientEnv.apiBaseUrl }),
})
```

### `src/lib/utils.ts`

`cn()` utility for class composition with clsx + tailwind-merge.

```ts
import { cn } from '@/lib/utils'

<div className={cn('base-class', condition && 'conditional-class')} />
```

## How The App Boots

1. Vite starts the app from `apps/web/vite.config.ts`.
2. `TanStackRouterVite` plugin scans `src/routes` and generates `src/routeTree.gen.ts`.
3. `main.tsx` creates a `QueryClient` and wraps the app in `QueryClientProvider` + `RouterProvider`.
4. `__root.tsx` provides `ThemeProvider` (next-themes) and optional `GoogleOAuthProvider`.
5. `_layoutmain.tsx` runs `requireAuth()` — unauthenticated users are redirected to `/login`.
6. Authenticated route files render inside `<Outlet />` within the vertical layout.

## Route Pattern

```tsx
// src/routes/_layoutmain.feature-name.tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_layoutmain/feature-name')({
  component: FeatureNamePage,
})

function FeatureNamePage() {
  return <div>Feature content</div>
}
```

- Auth pages (`login`, `register`, `forgot-password`): directly in `src/routes/` without layout prefix.
- Dashboard pages: use the `_layoutmain.<name>.tsx` convention.
- Do **not** edit `routeTree.gen.ts` manually — it is regenerated by TanStack on every route change.

## UI Components (`src/components/ui`)

Based on **shadcn/ui** (Radix UI primitives + Tailwind). Current components:

`avatar`, `badge`, `button`, `card`, `dropdown-menu`, `input`, `label`, `progress`, `sheet`

All components use the `cn()` utility and CSS token variables. Add new components following the existing pattern.

## How To Extend Safely

### Add a new dashboard route

1. Create `src/routes/_layoutmain.<route-name>.tsx`
2. Use `createFileRoute('/_layoutmain/<route-name>')({...})`
3. Let TanStack regenerate `routeTree.gen.ts`
4. Commit both files

### Add shared layout components

Place in `src/components/layout/` (shared framing, navigation, shells).

### Add small reusable UI primitives

Place in `src/components/ui/` (generic, presentational, not domain-coupled).

### Add app-wide infrastructure

Place in `src/lib/` (shared non-UI logic: HTTP, query, auth, env).

### Add feature-specific code

Keep route-specific logic local to the route file first. Extract to a feature folder only when repeated domain logic genuinely appears.

## What Is Intentionally Missing

This scaffold does **not** define:

- real API calls (all data is from `src/mocks/` — replace with `fetchJson` + `useQuery`)
- JWT refresh flow (scaffold uses `sessionStorage` — implement proper auth with the NestJS API)
- feature-specific API hooks (those belong to feature work)
- a full design system specification (patterns emerge from the existing component set)

## Commands

From the repo root:

```bash
pnpm --filter @ecobairro/web dev
pnpm --filter @ecobairro/web lint
pnpm --filter @ecobairro/web typecheck
pnpm --filter @ecobairro/web build
```

## Mental Model

- `routes/` — where the app goes and who can go there
- `@layouts/` + `components/layout/` — shared page framing and navigation
- `components/ui/` — small reusable presentational primitives
- `lib/` — shared non-UI infrastructure (env, http, query, auth)
- `styles/` — global CSS tokens and Tailwind config
- `routeTree.gen.ts` — generated glue, never edit manually
