import { createFileRoute } from "@tanstack/react-router";

import { PlaceholderPage } from "../../components/layout/placeholder-page";

export const Route = createFileRoute("/app/")({
  component: CitizenIndexPage,
});

export function CitizenIndexPage() {
  return (
    <PlaceholderPage
      eyebrow="Citizen Placeholder"
      title="Citizen Area"
      summary="This route is intentionally neutral. It gives future citizen-facing work a clear starting point without pre-shaping the feature scope or building UI that belongs to another team."
      routePath="/app"
      ownershipNote="Citizen feature teams can replace this page with their own flows while keeping the app shell, shared primitives, and route boundaries already established by the scaffold."
      sections={[
        {
          title: "Shared Foundations",
          description:
            "This app-level scaffold owns only cross-cutting concerns that every route can reuse.",
          bullets: [
            "The root route provides document chrome, providers, and global boundaries.",
            "The `/app` layout handles section-level framing so feature routes can stay focused.",
          ],
        },
        {
          title: "Route Handoff",
          description:
            "This placeholder is meant to be replaced, not polished into a final feature.",
          bullets: [
            "Swap in real citizen flows when the owning team is ready.",
            "Keep new shared UI inside `src/components/ui` only when it serves more than one route.",
          ],
        },
        {
          title: "Future Growth",
          description:
            "The route tree already supports deeper nesting without any structural migration.",
          bullets: [
            "Add child routes under `src/routes/app` as requirements arrive.",
            "Introduce domain-specific folder structure only when the team knows what belongs together.",
          ],
        },
      ]}
    />
  );
}
