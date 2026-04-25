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

export type UserRole =
  | 'CIDADAO'
  | 'OPERADOR_VEOLIA'
  | 'TECNICO_AUTARQUIA'
  | 'TECNICO_CCDR'
  | 'ADMIN';

export interface RegisterRequest {
  email: string;
  password: string;
  phone?: string;
  rgpd_accepted: boolean;
}

export interface RegisterResponse {
  id: string;
  email: string;
  role: UserRole;
  email_verified: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  requires_2fa: boolean;
  pre_auth_token: string | null;
}

export interface RefreshRequest {
  refresh_token: string;
}

export interface CitizenSelfProfileResponse {
  id: string;
  email: string;
  phone: string | null;
  role: 'CIDADAO';
  email_verified: boolean;
  nome_completo: string | null;
  gamification_opt_in: boolean;
  notificacao_prefs: Record<string, unknown> | null;
  dashboard_widgets: Record<string, unknown> | null;
  criado_em: string;
}

export interface UpdateCitizenSelfProfileRequest {
  phone?: string;
  nome_completo?: string;
  gamification_opt_in?: boolean;
  notificacao_prefs?: Record<string, unknown>;
  dashboard_widgets?: Record<string, unknown>;
}

export type ReportStatus = 'pendente' | 'analise' | 'resolvido' | 'rejeitado';

export type ReportTipo =
  | 'Ecoponto Cheio'
  | 'Deposição Ilegal'
  | 'Dano em Equipamento'
  | 'Odores'
  | 'Vandalismo';

export interface ReportRecord {
  id: string;
  titulo: string;
  tipo: ReportTipo;
  descricao: string;
  local: string;
  data: string;
  status: ReportStatus;
  imagem?: string;
  user_id: string;
}

export interface CreateReportRequest {
  titulo: string;
  tipo: ReportTipo;
  descricao: string;
  local: string;
  imagem?: string;
}

export interface CreateReportResponse {
  report: ReportRecord;
}

export interface ListReportsQuery {
  status?: ReportStatus;
  tipo?: ReportTipo;
  q?: string;
  page?: number;
  pageSize?: number;
}

export interface ListReportsResponse {
  reports: ReportRecord[];
  page: number;
  pageSize: number;
  total: number;
}

export interface UpdateReportStatusRequest {
  status: ReportStatus;
}

export interface UpdateReportStatusResponse {
  report: ReportRecord;
}

