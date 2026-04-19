import { Link } from "@tanstack/react-router";

export function NotFound() {
  return (
    <section className="surface-panel max-w-3xl space-y-5 px-6 py-6 sm:px-8">
      <p className="eyebrow">Not Found</p>
      <div className="space-y-3">
        <h2 className="text-2xl font-semibold tracking-tight text-[var(--text-strong)]">
          This placeholder route does not exist yet.
        </h2>
        <p className="text-sm leading-6 text-[var(--text-muted)]">
          Add a new file under <code>src/routes</code> or update an existing
          route module to extend the app structure.
        </p>
      </div>
      <Link className="action-link" to="/">
        Return Home
      </Link>
    </section>
  );
}
