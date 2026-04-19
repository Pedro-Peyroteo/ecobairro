import { createFileRoute } from "@tanstack/react-router";

import { PlaceholderPage } from "../../components/layout/placeholder-page";

export const Route = createFileRoute("/admin/dashboard")({
  component: AdminDashboardPlaceholderPage,
});

export function AdminDashboardPlaceholderPage() {
  return (
    <PlaceholderPage
      eyebrow="Admin Placeholder"
      title="Admin Dashboard Placeholder"
      summary="This route exists to demonstrate nested admin routing and shared layout reuse. Replace the sections below with the actual admin or operator-facing dashboard when that work starts."
      routePath="/admin/dashboard"
      ownershipNote="Admin feature teams should replace these panels with their own domain routes, widgets, and data workflows while keeping the route and layout conventions intact."
      sections={[
        {
          title: "Shared Shell Space",
          description:
            "Use this space for page-level composition inside the existing admin area shell.",
          bullets: [
            "Leave the surrounding `/admin` layout responsible for area navigation and top-level framing.",
            "Add feature-level components inside the route module or a future feature-owned folder when real work begins.",
          ],
        },
        {
          title: "Data Entry Point",
          description:
            "The scaffold already includes query and HTTP primitives so teams do not need to re-plumb them.",
          bullets: [
            "Use the shared query client from the app root.",
            "Use the generic `fetchJson` helper or replace it later with a more specific API layer if the team decides to.",
          ],
        },
        {
          title: "Extension Notes",
          description:
            "This card intentionally avoids any domain-specific assumptions.",
          bullets: [
            "Add route-local loading, not-found, or error states only when the route starts owning real behavior.",
            "Prefer shared UI primitives over copy-pasted page chrome.",
          ],
        },
      ]}
    />
  );
}
