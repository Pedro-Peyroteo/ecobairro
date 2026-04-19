import { Link } from "@tanstack/react-router";

import { cn } from "../../lib/utils/cn";

const baseLinkClassName =
  "rounded-full border border-white/12 px-3 py-2 text-sm font-medium text-[var(--text-muted)] transition hover:border-white/30 hover:text-[var(--text-strong)]";

export function RootNavigation() {
  return (
    <nav aria-label="Primary navigation" className="flex flex-wrap gap-2">
      <Link
        className={baseLinkClassName}
        activeProps={{ className: cn(baseLinkClassName, "bg-white/10 text-[var(--text-strong)]") }}
        to="/"
      >
        Home
      </Link>
      <Link
        className={baseLinkClassName}
        activeProps={{ className: cn(baseLinkClassName, "bg-white/10 text-[var(--text-strong)]") }}
        to="/app"
      >
        Citizen Area
      </Link>
      <Link
        className={baseLinkClassName}
        activeProps={{ className: cn(baseLinkClassName, "bg-white/10 text-[var(--text-strong)]") }}
        to="/admin"
      >
        Admin Area
      </Link>
    </nav>
  );
}
