import { Outlet, createFileRoute } from "@tanstack/react-router";

import { AreaNavigation } from "../../components/layout/area-navigation";
import { AreaShell } from "../../components/layout/area-shell";

export const Route = createFileRoute("/admin")({
  component: AdminAreaLayout,
});

function AdminAreaLayout() {
  return (
    <AreaShell
      eyebrow="Route Group"
      title="Admin Route Group"
      summary="Shared framing for operator and admin-owned routes. Teams can add or replace nested route content here without changing the application root."
      navigation={<AreaNavigation areaLabel="Admin area" basePath="/admin" />}
    >
      <Outlet />
    </AreaShell>
  );
}
