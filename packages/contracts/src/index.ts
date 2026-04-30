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

export interface AuthMeResponse {
  id: string;
  email: string;
  role: UserRole;
  email_verified: boolean;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  ok: true;
  reset_token?: string;
}

export interface ResetPasswordRequest {
  token: string;
  new_password: string;
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

/** Ecoponto completo (mapa + backoffice). */
export type EcopontoNivel = 'baixo' | 'medio' | 'alto' | 'cheio'
export type EcopontoSensor = 'online' | 'offline'

export interface EcopontoRecord {
  id: string
  nome: string
  codigo: string | null
  morada: string
  zona: string | null
  distancia_label: string
  ocupacao: number
  nivel: EcopontoNivel
  tipos: string[]
  sensor_estado: EcopontoSensor
  ultima_recolha: string | null
  ultima_atualizacao: string | null
  lat: number
  lng: number
  ativo: boolean
  ordem: number
}

export interface ListEcopontosResponse {
  ecopontos: EcopontoRecord[]
}

export interface CreateEcopontoRequest {
  nome: string
  codigo?: string
  morada: string
  zona?: string
  ocupacao: number
  tipos?: string[]
  sensor_estado?: EcopontoSensor
  ultima_recolha?: string
  lat: number
  lng: number
  ordem?: number
}

export interface UpdateEcopontoRequest {
  nome?: string
  codigo?: string
  morada?: string
  zona?: string
  ocupacao?: number
  tipos?: string[]
  sensor_estado?: EcopontoSensor
  ultima_recolha?: string
  lat?: number
  lng?: number
  ativo?: boolean
  ordem?: number
}

/** Feed agregado da página home (ecopontos, partilhas, notícias + métricas do cidadão). */
export interface HomeEcoponto {
  id: string;
  nome: string;
  distancia: string;
  ocupacao: number;
  map_url: string;
}

export interface HomePartilha {
  id: string;
  titulo: string;
  utilizador: string;
  zona: string;
}

export interface HomeNoticia {
  id: string;
  imagem_url: string;
  titulo: string;
  resumo: string;
  data: string;
  tempo_leitura: string;
}

export interface HomeAlerta {
  nome: string;
  ocupacao: number;
}

export interface HomeGamification {
  nivel: string;
  pontos: number;
  pontos_proximo: number;
}

export interface HomeImpacto {
  reciclagem_kg: number;
  comunidade_pax: number;
  arvores_equivalentes: number;
}

export interface HomeReportsResumo {
  ativos: number;
  resolvidos: number;
  total: number;
  progresso: number;
  proximo_nivel: string;
}

export interface HomeViewer {
  id: string;
  nome: string | null;
  email: string;
  role: UserRole;
}

export interface HomeFeedResponse {
  ecopontos: HomeEcoponto[];
  partilhas: HomePartilha[];
  noticias: HomeNoticia[];
  alerta: HomeAlerta | null;
  viewer: HomeViewer | null;
  gamification: HomeGamification;
  impacto: HomeImpacto;
  reports: HomeReportsResumo;
}

/** Resposta para a página /quiz (Desafio da Semana) baseada em dados do utilizador. */
export interface QuizHero {
  titulo: string;
  bonus_xp: number;
  tempo_limite_seconds: number;
}

export interface QuizUserStats {
  pontos: number;
  nivel: string;
  proximoNivel: string;
  xp: number; // percentagem 0-100
  faltam_pts: number;
  streak: number; // dias/atividade consecutiva (derivado de reports resolvidos)
  posicao: number; // posição no ranking da zona/bairro (derivado)
}

export interface QuizRankingEntry {
  id: string;
  nome: string;
  pontos: number;
  avatar: string; // iniciais
  isMe: boolean;
}

export type QuizAchievementKey =
  | 'eco_sabio'
  | 'olho_vivo'
  | 'reciclagem_pro'
  | 'mestre_da_rua'
  | 'lenda_urbana'
  | 'benfeitor';

export interface QuizAchievement {
  key: QuizAchievementKey;
  nome: string;
  desc: string;
  unlocked: boolean;
}

export interface QuizMeResponse {
  hero: QuizHero;
  userStats: QuizUserStats;
  ranking: QuizRankingEntry[];
  conquistas: QuizAchievement[];
}

