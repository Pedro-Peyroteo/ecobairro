import type { ReactNode } from "react";

import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import type { ErrorComponentProps } from "@tanstack/react-router";
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

import appCssHref from "../styles/app.css?url";
import { RootFrame } from "../components/layout/root-frame";
import { RootNavigation } from "../components/layout/root-navigation";
import { DefaultCatchBoundary } from "../components/ui/default-catch-boundary";
import { NotFound } from "../components/ui/not-found";
import { clientEnv } from "../lib/env";
import type { RouterAppContext } from "../router";

export const Route = createRootRouteWithContext<RouterAppContext>()({
  head: () => ({
    meta: [
      {
        title: `${clientEnv.appName} | Frontend Scaffold`,
      },
      {
        name: "description",
        content:
          "TanStack Start scaffold for route ownership, layout placeholders, and teammate handoff.",
      },
    ],
    links: [{ href: appCssHref, rel: "stylesheet" }],
  }),
  component: RootComponent,
  errorComponent: RootErrorBoundary,
  notFoundComponent: NotFound,
});

export function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta content="width=device-width, initial-scale=1" name="viewport" />
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <RootDocument>
      <QueryClientProvider client={queryClient}>
        <RootFrame appName={clientEnv.appName} navigation={<RootNavigation />}>
          <Outlet />
        </RootFrame>
        {import.meta.env.DEV ? (
          <>
            <TanStackRouterDevtools position="bottom-right" />
            <ReactQueryDevtools buttonPosition="bottom-left" />
          </>
        ) : null}
      </QueryClientProvider>
    </RootDocument>
  );
}

function RootErrorBoundary(props: ErrorComponentProps) {
  return (
    <RootDocument>
      <RootFrame appName={clientEnv.appName} navigation={<RootNavigation />}>
        <DefaultCatchBoundary {...props} />
      </RootFrame>
    </RootDocument>
  );
}
