export function RoutePending() {
  return (
    <section className="surface-panel max-w-3xl space-y-4 px-6 py-6 sm:px-8">
      <p className="eyebrow">Loading Route</p>
      <div className="space-y-3">
        <div className="h-6 w-52 animate-pulse rounded-full bg-white/10" />
        <div className="h-4 w-full animate-pulse rounded-full bg-white/8" />
        <div className="h-4 w-2/3 animate-pulse rounded-full bg-white/8" />
      </div>
    </section>
  );
}
