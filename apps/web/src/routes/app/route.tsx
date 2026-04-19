import { Outlet, createFileRoute } from "@tanstack/react-router";

import { AreaNavigation } from "../../components/layout/area-navigation";
import { AreaShell } from "../../components/layout/area-shell";

export const Route = createFileRoute("/app")({
  component: AppAreaLayout,
});

function AppAreaLayout() {
  return (
    <AreaShell
      eyebrow="Route Group"
      title="Citizen Route Group"
      summary="Shared framing for citizen-facing routes. Feature teams can add or replace nested route content here without changing the root application shell."
      navigation={<AreaNavigation areaLabel="Citizen area" basePath="/app" />}
    >
      <Outlet />
    </AreaShell>
  );
}
