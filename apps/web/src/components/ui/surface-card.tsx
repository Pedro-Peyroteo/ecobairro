import type { ReactNode } from "react";

type SurfaceCardProps = {
  eyebrow: string;
  title: string;
  description: string;
  children?: ReactNode;
};

export function SurfaceCard({
  eyebrow,
  title,
  description,
  children,
}: SurfaceCardProps) {
  return (
    <article className="surface-panel space-y-4 px-5 py-5 sm:px-6">
      <div className="space-y-2">
        <p className="eyebrow">{eyebrow}</p>
        <h2 className="text-xl font-semibold tracking-tight text-[var(--text-strong)]">
          {title}
        </h2>
        <p className="text-sm leading-6 text-[var(--text-muted)]">
          {description}
        </p>
      </div>
      {children}
    </article>
  );
}
