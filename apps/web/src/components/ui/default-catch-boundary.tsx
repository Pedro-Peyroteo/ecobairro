import type { ErrorComponentProps } from "@tanstack/react-router";

export function DefaultCatchBoundary({
  error,
  reset,
}: ErrorComponentProps) {
  const message =
    error instanceof Error ? error.message : "An unexpected error occurred.";

  return (
    <section className="surface-panel max-w-3xl space-y-5 px-6 py-6 sm:px-8">
      <p className="eyebrow">Application Error</p>
      <div className="space-y-3">
        <h2 className="text-2xl font-semibold tracking-tight text-[var(--text-strong)]">
          This placeholder route failed to render.
        </h2>
        <p className="text-sm leading-6 text-[var(--text-muted)]">{message}</p>
      </div>
      <button className="action-link" onClick={() => reset()}>
        Try Again
      </button>
    </section>
  );
}
