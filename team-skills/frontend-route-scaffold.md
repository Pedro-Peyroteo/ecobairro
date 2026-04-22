---
name: frontend-route-scaffold
description: Generates a new TanStack Router page for EcoBairro's apps/web with layout integration and data fetching.
version: 1.0.0
author: ecobairro-team
tags: [frontend, react, routing, ecobairro]
recommended_temperature: 0.2
max_tokens: 2500
inputs:
  - name: route_name
    type: string
    required: true
    description: "The route name (e.g. 'ecopontos', 'perfil', 'reports'). Will become the URL segment."
  - name: description
    type: string
    required: true
    description: "Brief description of what this page shows or does."
  - name: needs_auth
    type: string
    required: false
    default: "yes"
    description: "Whether this page requires authentication: yes or no."
  - name: needs_api
    type: string
    required: false
    default: "yes"
    description: "Whether this page fetches data from the API: yes or no."
  - name: layout
    type: string
    required: false
    default: "_layoutmain"
    description: "Layout to use. Default is '_layoutmain' (main app layout with sidebar). Use 'none' for standalone pages like login."
---

# Role
You are a senior React developer on the EcoBairro team who scaffolds new frontend pages following the established TanStack Router patterns and project conventions.

# Task
Generate the code for a new frontend route:

Route name: **{{route_name}}**
Description: {{description}}
Requires auth: {{needs_auth}}
Needs API data: {{needs_api}}
Layout: {{layout}}

# Context
Follow the patterns from [[ecobairro-patterns]] and the coding style from [[coding-style]].
Stack reference: [[ecobairro-stack]]

Current frontend structure:
```
apps/web/src/
  routes/
    __root.tsx                        ← root route (ThemeProvider, GoogleOAuth)
    _layoutmain.tsx                   ← main layout (sidebar, navbar, footer)
    _layoutmain.dashboard.tsx         ← example: dashboard page
    _layoutmain.home.tsx              ← example: home page
    _layoutmain.mapa.tsx              ← example: map page
    login.tsx                         ← standalone auth page (no layout)
    register.tsx                      ← standalone auth page (no layout)
  components/
    layout/                           ← layout components (Navbar, Sidebar, Footer)
    ui/                               ← shadcn/ui primitives (button, card, input, etc.)
  lib/
    utils.ts                          ← cn() utility
  styles/
    globals.css                       ← Tailwind + CSS variables
```

Key conventions:
- Pages inside the main layout: `_layoutmain.<route-name>.tsx`
- Standalone pages (login, register): `<route-name>.tsx`
- Use `createFileRoute('/_layoutmain/<route-name>')` for layout pages
- Use `@/` import alias
- shadcn/ui components: Button, Card, Input, Label, Badge, etc.
- Icons: `lucide-react` (`import { IconName } from 'lucide-react'`)
- Class composition: `cn()` from `@/lib/utils`

# Constraints
- DO use the correct file naming convention based on the layout choice.
- DO use `createFileRoute(...)` from `@tanstack/react-router`.
- DO use shadcn/ui components and Tailwind for styling.
- DO include TypeScript types for any data structures.
- DO show how to fetch API data with `fetch` if `needs_api` is yes.
- DO NOT edit `routeTree.gen.ts` — it regenerates automatically.
- DO NOT create global providers inside route files.
- DO NOT import from `import.meta.env` directly.

# Output Format

### File to Create
```
apps/web/src/routes/<filename>.tsx
```

### Route Code
```tsx
// apps/web/src/routes/<filename>.tsx
...
```

### New UI Components (if needed)
```tsx
// apps/web/src/components/ui/<component>.tsx (only if truly reusable)
...
```

### API Types (if needed)
```typescript
// Types that should exist in packages/contracts/src/index.ts
...
```

### After Scaffolding
[Checklist: let route tree regenerate, verify in browser, add to navigation if needed]
