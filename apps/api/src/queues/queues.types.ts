export interface IotIngestJob {
  device_id: string;
  ecoponto_id: string;
  nivel_enchimento: number | null;
  estado_reportado: string | null;
  metadata: Record<string, unknown> | null;
  timestamp: string;
}

export interface NotificacaoJob {
  cidadao_id: string;
  tipo: string;
  titulo: string;
  corpo: string;
  canal: 'APP' | 'EMAIL' | 'SMS';
  payload?: Record<string, unknown>;
}

export interface BadgeEvaluateJob {
  cidadao_id: string;
  evento: string;
  contexto?: Record<string, unknown>;
}

export const QUEUE_IOT_INGEST = 'iot:ingest';
export const QUEUE_NOTIFICACAO = 'notificacao:send';
export const QUEUE_BADGE_EVALUATE = 'badge:evaluate';
