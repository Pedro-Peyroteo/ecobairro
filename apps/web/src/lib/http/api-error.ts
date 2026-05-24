import { HttpError } from '@/lib/http/fetch-json'

/**
 * Mensagens que vêm do framework (Express/Nest) e que não devem ser
 * mostradas literalmente ao utilizador final. Quando o backend devolve
 * uma destas, ignoramos e cai para a mensagem por defeito do contexto.
 */
const TECHNICAL_MESSAGE_PATTERNS: RegExp[] = [
  /^Cannot (GET|POST|PUT|PATCH|DELETE) /i,
  /^Internal server error$/i,
  /^Service Unavailable$/i,
  /^Bad Gateway$/i,
  /^ECONNREFUSED/i,
  /^ENOTFOUND/i,
  /PrismaClient/i,
]

function isTechnical(message: string): boolean {
  return TECHNICAL_MESSAGE_PATTERNS.some((re) => re.test(message))
}

/**
 * Mensagem amigável para um determinado status HTTP, usada quando a
 * mensagem do backend é técnica ou não existe.
 */
function fallbackForStatus(status: number, fallback: string): string {
  if (status >= 500) {
    return 'Serviço indisponível neste momento. Tente novamente daqui a pouco.'
  }
  if (status === 401) return 'Sessão inválida ou expirada. Inicie sessão novamente.'
  if (status === 403) return 'Não tem permissão para esta acção.'
  if (status === 404) return 'O recurso pedido não foi encontrado.'
  if (status === 409) return 'Já existe um registo com estes dados.'
  if (status === 429) return 'Demasiadas tentativas. Tente novamente mais tarde.'
  return fallback
}

/**
 * Devolve uma mensagem pronta para mostrar ao utilizador.
 *
 * - 5xx → "Serviço indisponível…" (independentemente do que veio no body)
 * - 4xx com mensagem do domínio (curta, em PT) → usa essa mensagem
 * - 4xx com mensagem técnica ("Cannot POST /…", stack traces, etc.) → mapeia para status
 * - Não-HttpError ou body vazio → usa o `fallback` fornecido
 */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof HttpError)) {
    return fallback
  }

  const statusFallback = fallbackForStatus(error.status, fallback)

  if (error.status >= 500) {
    return statusFallback
  }

  const { body } = error
  if (typeof body === 'object' && body !== null && 'message' in body) {
    const raw = (body as { message: unknown }).message
    const candidate =
      typeof raw === 'string'
        ? raw
        : Array.isArray(raw) && raw.length > 0
          ? String(raw[0])
          : ''

    if (candidate && !isTechnical(candidate) && candidate.length < 200) {
      return candidate
    }
  }

  return statusFallback
}
