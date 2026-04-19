import { createFileRoute } from "@tanstack/react-router";

import { SurfaceCard } from "../components/ui/surface-card";
import { clientEnv } from "../lib/env";

export const Route = createFileRoute("/")({
  component: HomePage,
});

export function HomePage() {
  return (
    <section className="space-y-6">
      <header className="surface-panel space-y-5 px-6 py-6 sm:px-8">
        <div className="space-y-3">
          <p className="eyebrow">Team Handoff Surface</p>
          <h2 className="max-w-3xl text-3xl font-semibold tracking-tight text-[var(--text-strong)] sm:text-4xl">
            TanStack Start scaffolding is in place. Feature teams can take over
            from here.
          </h2>
          <p className="max-w-3xl text-base leading-7 text-[var(--text-muted)]">
            This root page is intentionally generic. It documents the route
            boundaries, shared folders, and environment assumptions without
            drifting into feature-owned UI.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 text-sm text-[var(--text-muted)]">
          <span className="tag">App Name: {clientEnv.appName}</span>
          <span className="tag">API: {clientEnv.apiBaseUrl}</span>
          <span className="tag">Analytics: {clientEnv.analyticsBaseUrl}</span>
        </div>
      </header>

      <section className="grid gap-4 lg:grid-cols-3">
        <SurfaceCard
          eyebrow="Routes"
          title="Route Files Only"
          description="All route authoring now lives under `src/routes`, with `/`, `/app`, and `/admin` ready for expansion."
        >
          <ul className="space-y-2 text-sm leading-6 text-[var(--text-muted)]">
            <li>
              <code>src/routes/__root.tsx</code> owns the document shell and
              providers.
            </li>
            <li>
              <code>src/routes/app/*</code> is the citizen-side route group.
            </li>
            <li>
              <code>src/routes/admin/*</code> is the operator/admin route group.
            </li>
          </ul>
        </SurfaceCard>

        <SurfaceCard
          eyebrow="Shared UI"
          title="Neutral Primitives"
          description="The scaffold only ships shared shells and presentational cards, leaving domain UI decisions to the feature teams."
        >
          <ul className="space-y-2 text-sm leading-6 text-[var(--text-muted)]">
            <li>
              <code>src/components/layout</code> contains the app and area-level
              framing.
            </li>
            <li>
              <code>src/components/ui</code> contains small reusable surfaces
              and boundaries.
            </li>
            <li>
              Feature-specific UI should be introduced by the teams that own it.
            </li>
          </ul>
        </SurfaceCard>

        <SurfaceCard
          eyebrow="Infra"
          title="Ready For Wiring"
          description="Typed env access, a generic HTTP helper, and a shared Query client are available without forcing any domain-specific data layer."
        >
          <ul className="space-y-2 text-sm leading-6 text-[var(--text-muted)]">
            <li>
              <code>src/lib/env.ts</code> owns client-side runtime variables.
            </li>
            <li>
              <code>src/lib/http/fetch-json.ts</code> is the generic fetch
              wrapper.
            </li>
            <li>
              <code>src/lib/query/client.ts</code> configures the app-level
              Query client.
            </li>
          </ul>
        </SurfaceCard>
      </section>
    </section>
  );
}
