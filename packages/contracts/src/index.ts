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
  nome_completo?: string;
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

export interface ReportStatsByStatus {
  pendente: number;
  analise: number;
  resolvido: number;
  rejeitado: number;
}

export interface ReportZonaStat {
  zona: string;
  total: number;
}

export interface ReportStatsResponse {
  total: number;
  byStatus: ReportStatsByStatus;
  zonas: ReportZonaStat[];
  recent: ReportRecord[];
  scope: 'me' | 'global';
}

export interface ReportStatsQuery {
  recentLimit?: number;
  scope?: 'me' | 'global';
}

/** Ecoponto completo (mapa + backoffice). */
export type EcopontoNivel = 'baixo' | 'medio' | 'alto' | 'cheio'
export type EcopontoSensor = 'online' | 'offline' | 'alerta'

export interface EcopontoRecord {
  id: string
  nome: string
  codigo: string | null
  morada: string
  codigo_postal: string | null
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
  bateria: number | null
  temperatura: number | null
  ativo: boolean
  ordem: number
}

export interface ListEcopontosQuery {
  /** Pesquisa de texto livre: nome, morada, código postal, zona */
  q?: string
  /** Filtrar por zona */
  zona?: string
  /** Filtrar por código postal (prefixo) */
  codigo_postal?: string
  /** Filtrar por tipo de resíduo */
  tipo?: string
  /** Filtrar por nível de ocupação */
  nivel?: EcopontoNivel
  /** Incluir inativos */
  todos?: boolean
}

export interface ListEcopontosResponse {
  ecopontos: EcopontoRecord[]
  total: number
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

/** Notícias e eventos da plataforma. */
export interface NoticiaRecord {
  id: string;
  titulo: string;
  resumo: string;
  imagem_url: string;
  tag: string;
  destaque: boolean;
  data: string;
  tempo_leitura_min: number;
}

export interface ListNoticiasResponse {
  noticias: NoticiaRecord[];
  page: number;
  pageSize: number;
  total: number;
}

export interface ListNoticiasQuery {
  q?: string;
  page?: number;
  pageSize?: number;
}

/** Utilizadores (admin). */
export interface UserRecord {
  id: string;
  email: string;
  role: string;
  nome: string | null;
  ativo: boolean;
  criado_em: string;
}

export interface ListUsersResponse {
  users: UserRecord[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ListUsersQuery {
  role?: string;
  q?: string;
  ativo?: boolean;
  page?: number;
  pageSize?: number;
}

/** Analytics agregados. */
export interface AnalyticsMonthly {
  label: string;
  value: number;
}

export interface AnalyticsTipo {
  tipo: string;
  total: number;
  pct: number;
}

export interface AnalyticsZona {
  zona: string;
  ecopontos: number;
  reportes: number;
  resolvidos: number;
}

export interface AnalyticsKpis {
  reports_total: number;
  reports_mes: number;
  taxa_resolucao: number;
  ecopontos_ativos: number;
  users_total: number;
}

export interface PublicStatsResponse {
  ecopontos_ativos: number;
  cidadaos_total: number;
  taxa_resolucao: number;
}

export interface AnalyticsResponse {
  kpis: AnalyticsKpis;
  reports_mensais: AnalyticsMonthly[];
  resolucao_mensais: AnalyticsMonthly[];
  tipos: AnalyticsTipo[];
  zonas: AnalyticsZona[];
}

/** Partilhas locais (troca de objetos na comunidade). */
export type PartilhaCategoria = 'moveis' | 'eletro' | 'livros' | 'roupa';

export interface PartilhaRecord {
  id: string;
  titulo: string;
  autorNome: string;
  zona: string;
  categoria: PartilhaCategoria;
  imagem_url: string | null;
  data: string;
  user_id: string | null;
}

export interface ListPartilhasResponse {
  partilhas: PartilhaRecord[];
  page: number;
  pageSize: number;
  total: number;
}

export interface CreatePartilhaRequest {
  titulo: string;
  zona: string;
  categoria: PartilhaCategoria;
  imagem_url?: string;
}

export interface CreatePartilhaResponse {
  partilha: PartilhaRecord;
}

export interface ListPartilhasQuery {
  categoria?: PartilhaCategoria;
  q?: string;
  page?: number;
  pageSize?: number;
}

/** Feed agregado da página home (ecopontos, partilhas, notícias + métricas do cidadão). */
export interface HomeEcoponto {
  id: string;
  nome: string;
  distancia: string;
  ocupacao: number;
  map_url: string;
}

export interface ListFavoritosResponse {
  ecopontos: HomeEcoponto[];
}

export interface AddFavoritoRequest {
  ecoponto_id: string;
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

/** Fila de prioridades (tarefas operacionais). */
export type TarefaPrioridade = 'critica' | 'alta' | 'normal' | 'baixa'
export type TarefaEstado = 'pendente' | 'em_curso' | 'resolvido'

export interface TarefaRecord {
  id: string;
  titulo: string;
  local: string;
  tipo: string;
  prioridade: TarefaPrioridade;
  estado: TarefaEstado;
  atribuido: string | null;
  criado_em: string;
}

export interface ListFilaResponse {
  tarefas: TarefaRecord[];
  total: number;
}

export interface UpdateTarefaRequest {
  prioridade?: TarefaPrioridade;
  estado?: TarefaEstado;
  atribuido?: string | null;
}

/** Pedidos de recolha de monos/entulho. */
export type RecolhaStatus = 'pendente' | 'agendado' | 'concluido'

export interface RecolhaRecord {
  id: string;
  tipo: string;
  subtipo: string;
  morada: string;
  status: RecolhaStatus;
  obs: string | null;
  data_pedido: string;
  data_prevista: string | null;
  user_id: string | null;
}

export interface ListRecolhasResponse {
  recolhas: RecolhaRecord[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CreateRecolhaRequest {
  tipo: string;
  subtipo: string;
  morada: string;
  obs?: string;
}

export interface CreateRecolhaResponse {
  recolha: RecolhaRecord;
}

/** Campanhas / mensagens institucionais. */
export type CampanhaEstado = 'rascunho' | 'publicada' | 'expirada'

export interface CampanhaRecord {
  id: string;
  titulo: string;
  corpo: string;
  estado: CampanhaEstado;
  data_criacao: string;
  data_validade: string;
  autor: string;
}

export interface ListCampanhasResponse {
  campanhas: CampanhaRecord[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CreateCampanhaRequest {
  titulo: string;
  corpo: string;
  dataValidade: string;
}

export interface UpdateCampanhaRequest {
  titulo?: string;
  corpo?: string;
  estado?: CampanhaEstado;
  data_validade?: string;
}

export interface ListCampanhasQuery {
  estado?: CampanhaEstado;
  q?: string;
  page?: number;
  pageSize?: number;
}

/** Audit logs. */
export type AuditAcao = 'login' | 'logout' | 'create' | 'update' | 'delete' | 'config'

export interface AuditLogRecord {
  id: string;
  utilizador: string;
  papel: string;
  acao: AuditAcao;
  descricao: string;
  ip: string;
  data: string;
  hora: string;
}

export interface ListAuditLogsResponse {
  logs: AuditLogRecord[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ListAuditLogsQuery {
  acao?: AuditAcao | 'login_logout';
  q?: string;
  page?: number;
  pageSize?: number;
}

/** Rotas de recolha. */
export type RotaEstado = 'ativa' | 'concluida' | 'pendente'

export interface RotaRecord {
  id: string;
  nome: string;
  operador: string;
  estado: RotaEstado;
  ecopontos: number;
  distancia: string;
  duracao: string;
  waypoints: [number, number][];
  cor: string;
}

export interface ListRotasResponse {
  rotas: RotaRecord[];
  total: number;
}

export interface UpdateRotaRequest {
  estado?: RotaEstado;
  operador?: string;
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

// ────────────────────────────────────────────────────────────────────────────
// SEGURANÇA / 2FA / SESSÕES
// ────────────────────────────────────────────────────────────────────────────

export type TwoFactorType = 'NONE' | 'TOTP_APP' | 'EMAIL';

export interface VerifyTwoFactorRequest {
  pre_auth_token: string;
  code: string;
}

export interface SetupTwoFactorResponse {
  secret: string;
  otpauth_url: string;
  qr_code_data_url: string;
}

export interface EnableTwoFactorRequest {
  code: string;
}

export interface EnableTwoFactorResponse {
  enabled: true;
  backup_codes: string[];
}

export interface DisableTwoFactorRequest {
  password: string;
}

export interface RegenerateBackupCodesRequest {
  password: string;
}

export interface RegenerateBackupCodesResponse {
  backup_codes: string[];
}

export interface RevealBackupCodesRequest {
  password: string;
}

export interface RevealBackupCodesResponse {
  backup_codes: string[];
}

export interface TwoFactorStatusResponse {
  enabled: boolean;
  type: TwoFactorType;
  backup_codes_remaining: number;
}

export interface ActiveSessionRecord {
  id: string;
  ip_address: string;
  user_agent: string | null;
  device: string | null;
  browser: string | null;
  os: string | null;
  criado_em: string;
  expires_at: string;
  current: boolean;
}

export interface ListActiveSessionsResponse {
  sessions: ActiveSessionRecord[];
}

export type SecurityEventType =
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILED'
  | 'PASSWORD_CHANGED'
  | 'TWO_FACTOR_ENABLED'
  | 'TWO_FACTOR_DISABLED'
  | 'ACCOUNT_LOCKED'
  | 'DEVICE_REVOKED';

export interface SecurityLogRecord {
  id: string;
  event: SecurityEventType;
  ip_address: string;
  user_agent: string | null;
  criado_em: string;
}

export interface ListSecurityLogsResponse {
  logs: SecurityLogRecord[];
  page: number;
  pageSize: number;
  total: number;
}

