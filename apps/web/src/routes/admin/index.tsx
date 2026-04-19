import { createFileRoute } from "@tanstack/react-router";

import { PlaceholderPage } from "../../components/layout/placeholder-page";

export const Route = createFileRoute("/admin/")({
  component: AdminIndexPage,
});

export function AdminIndexPage() {
  return (
    <PlaceholderPage
      eyebrow="Admin Placeholder"
      title="Admin And Operator Area"
      summary="This route is a neutral handoff point for future operator and administration flows. It provides the shared framing and ownership boundaries without pre-building product UI."
      routePath="/admin"
      ownershipNote="Teams working on operator or administration flows can replace this page with real route content without changing the app shell, router setup, or shared runtime foundation."
      sections={[
        {
          title: "What Stays Shared",
          description:
            "The scaffold keeps only the infrastructure and presentation chrome that every route can reuse.",
          bullets: [
            "Shared layout and navigation live outside feature-owned route internals.",
            "The TanStack Start root already wires app-wide providers and error boundaries.",
          ],
        },
        {
          title: "What Teams Own",
          description:
            "Feature teams should treat this page as a replaceable placeholder, not a template they must preserve.",
          bullets: [
            "Introduce domain-specific components when admin requirements are ready.",
            "Colocate route-only pieces near the route and promote them to shared folders only when reused.",
          ],
        },
        {
          title: "Suggested First Moves",
          description:
            "These are safe next steps once an admin feature begins, without forcing structure too early.",
          bullets: [
            "Add data loaders or query hooks only when a route starts consuming real backend surfaces.",
            "Keep new route files inside `src/routes/admin` so ownership remains easy to scan.",
          ],
        },
      ]}
    />
  );
}
