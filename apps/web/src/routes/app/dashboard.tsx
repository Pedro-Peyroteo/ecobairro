import { createFileRoute } from "@tanstack/react-router";

import { PlaceholderPage } from "../../components/layout/placeholder-page";

export const Route = createFileRoute("/app/dashboard")({
  component: CitizenDashboardPlaceholderPage,
});

export function CitizenDashboardPlaceholderPage() {
  return (
    <PlaceholderPage
      eyebrow="Citizen Placeholder"
      title="Citizen Dashboard Placeholder"
      summary="This nested route exists to prove the app shell can host deeper route trees without prescribing any domain UI. Replace the content here when a citizen-facing dashboard is ready."
      routePath="/app/dashboard"
      ownershipNote="Feature teams can evolve this route however they need while preserving the shared routing, provider setup, and layout conventions already established in the scaffold."
      sections={[
        {
          title: "Route Ownership",
          description:
            "Keep route-specific concerns local and leave app-wide infrastructure alone unless it is genuinely shared.",
          bullets: [
            "Add real domain components only when the dashboard scope is defined.",
            "Promote UI to shared folders only when more than one route needs it.",
          ],
        },
        {
          title: "Integration Ready",
          description:
            "The scaffold already includes the minimum plumbing for future data and state work.",
          bullets: [
            "Use the root query client instead of creating route-local providers.",
            "Keep backend integration flowing through the existing Nest API and analytics services.",
          ],
        },
        {
          title: "Extension Notes",
          description:
            "Nothing here is a product commitment; it is only a stable handoff point.",
          bullets: [
            "Replace cards, copy, and structure freely when product work starts.",
            "Keep shared route conventions visible so new teammates can navigate the app quickly.",
          ],
        },
      ]}
    />
  );
}
