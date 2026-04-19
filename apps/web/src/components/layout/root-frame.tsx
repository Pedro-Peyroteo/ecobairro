import type { ReactNode } from "react";

type RootFrameProps = {
  appName: string;
  navigation: ReactNode;
  children: ReactNode;
};

export function RootFrame({ appName, navigation, children }: RootFrameProps) {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[var(--page-bg)] text-[var(--text-strong)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(111,175,142,0.22),transparent_34%),radial-gradient(circle_at_right,rgba(224,141,78,0.18),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.02),transparent)]" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 pb-10 pt-5 sm:px-6 lg:px-8">
        <header className="surface-panel sticky top-4 z-10 mb-6 flex flex-col gap-5 px-5 py-5 backdrop-blur sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <p className="eyebrow">Frontend Scaffold</p>
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-[var(--text-strong)] sm:text-2xl">
                {appName}
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-[var(--text-muted)]">
                TanStack Start skeleton for route ownership, shared layout
                primitives, and teammate handoff. Product-specific UI belongs in
                future feature work, not in this scaffold.
              </p>
            </div>
          </div>

          {navigation}
        </header>

        <main className="flex-1">{children}</main>

        <footer className="mt-8 border-t border-white/10 px-1 pt-6 text-sm text-[var(--text-muted)]">
          Shared layout lives in <code>src/components/layout</code>. Shared
          primitives live in <code>src/components/ui</code>. Routes are authored
          only from <code>src/routes</code>.
        </footer>
      </div>
    </div>
  );
}
