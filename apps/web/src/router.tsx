import type { QueryClient } from "@tanstack/react-query";
import { createRouter as createTanStackRouter } from "@tanstack/react-router";

import { DefaultCatchBoundary } from "./components/ui/default-catch-boundary";
import { NotFound } from "./components/ui/not-found";
import { RoutePending } from "./components/ui/route-pending";
import { createQueryClient } from "./lib/query/client";
import { routeTree } from "./routeTree.gen";

export type RouterAppContext = {
  queryClient: QueryClient;
};

export function createRouter() {
  const queryClient = createQueryClient();

  return createTanStackRouter({
    routeTree,
    context: {
      queryClient,
    },
    defaultPreload: "intent",
    defaultErrorComponent: DefaultCatchBoundary,
    defaultNotFoundComponent: NotFound,
    defaultPendingComponent: RoutePending,
    scrollRestoration: true,
  });
}

let router: ReturnType<typeof createRouter> | undefined;

export function getRouter() {
  if (!router) {
    router = createRouter();
  }

  return router;
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
