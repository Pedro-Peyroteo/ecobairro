import { SurfaceCard } from "../ui/surface-card";

type PlaceholderSection = {
  title: string;
  description: string;
  bullets: string[];
};

type PlaceholderPageProps = {
  eyebrow: string;
  title: string;
  summary: string;
  routePath: string;
  ownershipNote: string;
  sections: PlaceholderSection[];
};

export function PlaceholderPage({
  eyebrow,
  title,
  summary,
  routePath,
  ownershipNote,
  sections,
}: PlaceholderPageProps) {
  return (
    <div className="space-y-6">
      <section className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
        <SurfaceCard eyebrow={eyebrow} title={title} description={summary}>
          <div className="flex flex-wrap gap-3 text-sm text-[var(--text-muted)]">
            <span className="tag">Route: {routePath}</span>
            <span className="tag">Placeholder Only</span>
            <span className="tag">Ready For Handoff</span>
          </div>
        </SurfaceCard>

        <SurfaceCard
          eyebrow="Ownership"
          title="Replace Me Safely"
          description={ownershipNote}
        >
          <p className="text-sm leading-6 text-[var(--text-muted)]">
            Keep shared layout chrome in <code>src/components/layout</code> and
            shared primitives in <code>src/components/ui</code>. Feature teams
            can now own the route internals.
          </p>
        </SurfaceCard>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {sections.map((section) => (
          <SurfaceCard
            key={section.title}
            eyebrow="Placeholder Section"
            title={section.title}
            description={section.description}
          >
            <ul className="space-y-2 text-sm leading-6 text-[var(--text-muted)]">
              {section.bullets.map((bullet) => (
                <li key={bullet} className="flex gap-2">
                  <span
                    aria-hidden="true"
                    className="pt-1 text-[var(--accent-strong)]"
                  >
                    *
                  </span>
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </SurfaceCard>
        ))}
      </section>
    </div>
  );
}
