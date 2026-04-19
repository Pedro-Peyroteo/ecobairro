import { Link } from "@tanstack/react-router";

import { cn } from "../../lib/utils/cn";

type AreaNavigationProps = {
  areaLabel: string;
  basePath: "/app" | "/admin";
};

const baseLinkClassName =
  "rounded-full border border-white/12 px-3 py-2 text-sm font-medium text-[var(--text-muted)] transition hover:border-white/30 hover:text-[var(--text-strong)]";

export function AreaNavigation({
  areaLabel,
  basePath,
}: AreaNavigationProps) {
  return (
    <nav aria-label={`${areaLabel} navigation`} className="flex flex-wrap gap-2">
      <Link
        className={baseLinkClassName}
        activeProps={{ className: cn(baseLinkClassName, "bg-white/10 text-[var(--text-strong)]") }}
        to={basePath}
      >
        Overview
      </Link>
      <Link
        className={baseLinkClassName}
        activeProps={{ className: cn(baseLinkClassName, "bg-white/10 text-[var(--text-strong)]") }}
        to={`${basePath}/dashboard`}
      >
        Dashboard Placeholder
      </Link>
      <Link className={baseLinkClassName} to="/">
        Back To Home
      </Link>
    </nav>
  );
}
