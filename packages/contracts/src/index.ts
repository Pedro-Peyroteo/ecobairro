// ─── Runtime health ───────────────────────────────────────────────────────────

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

// ─── Auth ─────────────────────────────────────────────────────────────────────

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

// ─── Citizen profile ──────────────────────────────────────────────────────────

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

// ─── Zonas ────────────────────────────────────────────────────────────────────

export type ZonaTipo =
  | 'OPERACIONAL'
  | 'RESIDENCIAL'
  | 'PRIORITARIA_IOT'
  | 'ADMINISTRATIVA';

export interface ZonaListItem {
  id: string;
  nome: string;
  tipo: string;
  ativa: boolean;
  entidade_responsavel: string | null;
}

export interface ZonaDetail {
  id: string;
  nome: string;
  descricao: string | null;
  tipo: string;
  ativa: boolean;
  limite_antispam_reports: number;
  janela_antispam_horas: number;
  entidade_responsavel: string | null;
  alertas_config: Record<string, unknown>;
  criado_em: string;
  atualizado_em: string;
}

// ─── Ecopontos ────────────────────────────────────────────────────────────────

export type TipologiaMaterial =
  | 'VIDRO'
  | 'PAPEL'
  | 'PLASTICO'
  | 'ORGANICO'
  | 'GERAL'
  | 'OUTROS';

export type EcopontoEstado =
  | 'CHEIO'
  | 'DISPONIVEL'
  | 'SEM_SENSOR'
  | 'AVARIADO'
  | 'MANUTENCAO';

export interface EcopontoEstadoInfo {
  nivel_enchimento: number | null;
  estado: EcopontoEstado;
  ultima_leitura_em: string | null;
  device_id: string | null;
}

export interface EcopontoListItem {
  id: string;
  nome: string;
  latitude: number;
  longitude: number;
  tipologias: string[];
  tem_sensor: boolean;
  estado: string;
  nivel_enchimento: number | null;
}

export interface EcopontoDetail {
  id: string;
  codigo_externo: string | null;
  nome: string;
  descricao: string | null;
  latitude: number;
  longitude: number;
  morada_textual: string | null;
  zona_id: string;
  tipologias: string[];
  tem_sensor: boolean;
  acessibilidade: Record<string, unknown>;
  horario: Record<string, unknown> | null;
  ativo: boolean;
  criado_em: string;
  atualizado_em: string;
  estado: EcopontoEstadoInfo;
}

export interface CreateEcopontoRequest {
  codigo_externo?: string;
  nome: string;
  descricao?: string;
  latitude: number;
  longitude: number;
  morada_textual?: string;
  zona_id: string;
  tipologias: string[];
  tem_sensor?: boolean;
  acessibilidade?: Record<string, unknown>;
  horario?: Record<string, unknown>;
}

// ─── IoT ──────────────────────────────────────────────────────────────────────

export interface TelemetriaRequest {
  device_id: string;
  ecoponto_id: string;
  nivel_enchimento?: number;
  estado_reportado?: string;
  metadata?: Record<string, unknown>;
}

export interface TelemetriaResponse {
  queued: true;
}

// ─── Reports ──────────────────────────────────────────────────────────────────

export type ReportCategoria =
  | 'ECOPONTO_CHEIO'
  | 'ECOPONTO_PARTIDO'
  | 'DEPOSICAO_ILEGAL'
  | 'ODORES'
  | 'GAIVOTAS_ORGANICOS'
  | 'VANDALISMO'
  | 'OUTRO';

export type ReportEstado =
  | 'RECEBIDO'
  | 'EM_ANALISE'
  | 'EM_RESOLUCAO'
  | 'RESOLVIDO'
  | 'REJEITADO';

export interface CreateReportRequest {
  ecoponto_id?: string;
  categoria: ReportCategoria;
  descricao?: string;
  latitude: number;
  longitude: number;
  localizacao_manual?: boolean;
  foto_url?: string;
}

export interface CreateReportResponse {
  report?: ReportDetail;
  /** Present when a near-identical open report already exists */
  duplicado?: {
    id: string;
    numero: string;
  };
}

export interface ReportListItem {
  id: string;
  numero: string;
  categoria: string;
  estado: string;
  criado_em: string;
}

export interface ReportDetail {
  id: string;
  numero: string;
  cidadao_id: string;
  ecoponto_id: string | null;
  zona_id: string;
  categoria: string;
  descricao: string | null;
  latitude: number;
  longitude: number;
  localizacao_manual: boolean;
  foto_url: string | null;
  estado: string;
  motivo_rejeicao: string | null;
  entidade_responsavel: string | null;
  atribuido_a: string | null;
  report_pai_id: string | null;
  num_subscricoes: number;
  criado_em: string;
  atualizado_em: string;
}

export interface UpdateReportEstadoRequest {
  estado: ReportEstado;
  motivo_rejeicao?: string;
  nota?: string;
}

// ─── Notifications ────────────────────────────────────────────────────────────

export interface NotificacaoItem {
  id: string;
  tipo: string;
  titulo: string;
  corpo: string;
  lida: boolean;
  criado_em: string;
}

export interface UnreadCountResponse {
  count: number;
}

// ─── Analytics routes (served by FastAPI /analytics/*) ───────────────────────
// These types describe what the React front-end expects from FastAPI.
// NestJS does NOT serve these endpoints; Nginx routes /analytics/* to FastAPI.

export interface EcopontosProximosRequest {
  latitude: number;
  longitude: number;
  raio_metros?: number;
  tipologia?: TipologiaMaterial;
}

export interface EcopontoProximoItem extends EcopontoListItem {
  distancia_metros: number;
}

export interface HeatmapZonaResponse {
  zona_id: string;
  pontos: Array<{
    latitude: number;
    longitude: number;
    peso: number;
  }>;
}

export interface KpiZonaResponse {
  zona_id: string;
  total_reports: number;
  reports_resolvidos: number;
  tempo_medio_resolucao_horas: number | null;
  enchimento_medio_pct: number | null;
  periodo_dias: number;
}
