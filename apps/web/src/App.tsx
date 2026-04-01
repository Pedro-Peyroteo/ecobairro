import type { RuntimeServiceName } from '@ecobairro/contracts';

type RuntimeCard = {
  name: RuntimeServiceName;
  summary: string;
  endpoint: string;
};

const apiBase = import.meta.env.VITE_API_BASE_URL ?? '/api';
const analyticsBase = import.meta.env.VITE_ANALYTICS_BASE_URL ?? '/analytics';

const runtimeCards: RuntimeCard[] = [
  {
    name: 'web',
    summary: 'Placeholder runtime for citizen and operator experiences.',
    endpoint: '/',
  },
  {
    name: 'api',
    summary: 'Main NestJS backend surface for health and future domain workflows.',
    endpoint: `${apiBase}/health`,
  },
  {
    name: 'analytics',
    summary: 'FastAPI analytics sidecar for readiness checks and future compute tasks.',
    endpoint: `${analyticsBase}/health`,
  },
  {
    name: 'postgres',
    summary: 'Primary PostGIS-backed data layer for geospatial and operational data.',
    endpoint: 'internal only',
  },
  {
    name: 'redis',
    summary: 'Local cache and async support dependency in the base stack.',
    endpoint: 'internal only',
  },
  {
    name: 'nginx',
    summary: 'Single local entrypoint that will route traffic across the stack.',
    endpoint: 'http://localhost:8080',
  },
];

export default function App() {
  return (
    <main className="shell">
      <section className="hero">
        <p className="eyebrow">EcoBairro Runtime Foundation</p>
        <h1>Frontend placeholder for the containerized local stack.</h1>
        <p className="intro">
          This app exists to prove the frontend runtime boots cleanly and is ready
          to connect to the API and analytics services in later phases.
        </p>
        <div className="endpoint-strip">
          <a href={`${apiBase}/health`}>API health</a>
          <a href={`${analyticsBase}/health`}>Analytics health</a>
        </div>
      </section>

      <section className="grid" aria-label="Runtime services">
        {runtimeCards.map((card) => (
          <article key={card.name} className="card">
            <p className="card-name">{card.name}</p>
            <p className="card-summary">{card.summary}</p>
            <p className="card-endpoint">{card.endpoint}</p>
          </article>
        ))}
      </section>
    </main>
  );
}

