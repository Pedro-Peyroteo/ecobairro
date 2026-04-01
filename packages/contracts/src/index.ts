export type RuntimeServiceName =
  | 'web'
  | 'api'
  | 'analytics'
  | 'postgres'
  | 'redis'
  | 'nginx';

export type ServiceStatus = 'ok' | 'error';

export type DependencyStatus = 'up' | 'down';

export interface DependencyHealth {
  name: string;
  status: DependencyStatus;
  details?: string;
}

export interface ServiceHealthPayload {
  service: string;
  status: ServiceStatus;
  timestamp: string;
  dependencies?: DependencyHealth[];
}

