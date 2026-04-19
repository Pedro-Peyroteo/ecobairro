import type { ReactNode } from "react";

type AreaShellProps = {
  eyebrow: string;
  title: string;
  summary: string;
  navigation: ReactNode;
  children: ReactNode;
};

export function AreaShell({
  eyebrow,
  title,
  summary,
  navigation,
  children,
}: AreaShellProps) {
  return (
    <section className="space-y-6">
      <header className="surface-panel space-y-5 px-6 py-6 sm:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-3">
            <p className="eyebrow">{eyebrow}</p>
            <h1 className="max-w-3xl text-3xl font-semibold tracking-tight text-[var(--text-strong)] sm:text-4xl">
              {title}
            </h1>
            <p className="max-w-2xl text-base leading-7 text-[var(--text-muted)]">
              {summary}
            </p>
          </div>
          {navigation}
        </div>
      </header>

      {children}
    </section>
  );
}
