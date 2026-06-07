// Fix #3: tokens removidos de todos os pedidos — autenticação via cookies HttpOnly.
// fetchJson já envia credentials:'include', o browser inclui o cookie access_token automaticamente.
import type {
  AuthMeResponse,
  CitizenSelfProfileResponse,
  EnableTwoFactorResponse,
  ForgotPasswordResponse,
  ListActiveSessionsResponse,
  ListSecurityLogsResponse,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegenerateBackupCodesResponse,
  SetupTwoFactorResponse,
  TwoFactorStatusResponse,
  VerifyTwoFactorRequest,
} from '@ecobairro/contracts'
import { clientEnv } from '@/lib/env'
import { fetchJson } from '@/lib/http/fetch-json'
import type { UserRole } from '@/types'

export async function registerRequest(body: RegisterRequest) {
  return fetchJson('/v1/auth/register', {
    baseUrl: clientEnv.apiBaseUrl,
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export async function verifyEmailRequest(token: string): Promise<void> {
  return fetchJson('/v1/auth/verify-email', {
    baseUrl: clientEnv.apiBaseUrl,
    method: 'POST',
    body: JSON.stringify({ token }),
  })
}

export async function resendVerificationRequest(email: string): Promise<void> {
  return fetchJson('/v1/auth/resend-verification', {
    baseUrl: clientEnv.apiBaseUrl,
    method: 'POST',
    body: JSON.stringify({ email }),
  })
}

export async function loginRequest(body: LoginRequest): Promise<LoginResponse> {
  return fetchJson('/v1/auth/login', {
    baseUrl: clientEnv.apiBaseUrl,
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export async function refreshRequest(): Promise<LoginResponse> {
  return fetchJson('/v1/auth/refresh', {
    baseUrl: clientEnv.apiBaseUrl,
    method: 'POST',
  })
}

export async function getMe(): Promise<AuthMeResponse> {
  return fetchJson('/v1/auth/me', {
    baseUrl: clientEnv.apiBaseUrl,
    method: 'POST',
  })
}

export async function getCitizenProfile(): Promise<CitizenSelfProfileResponse> {
  return fetchJson('/v1/cidadaos/me', {
    baseUrl: clientEnv.apiBaseUrl,
    method: 'GET',
  })
}

export async function updateCitizenProfile(
  payload: { nome_completo?: string },
): Promise<CitizenSelfProfileResponse> {
  return fetchJson('/v1/cidadaos/me', {
    baseUrl: clientEnv.apiBaseUrl,
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export async function forgotPasswordRequest(email: string): Promise<ForgotPasswordResponse> {
  return fetchJson('/v1/auth/forgot-password', {
    baseUrl: clientEnv.apiBaseUrl,
    method: 'POST',
    body: JSON.stringify({ email }),
  })
}

export async function resetPasswordRequest(token: string, newPassword: string): Promise<void> {
  await fetchJson('/v1/auth/reset-password', {
    baseUrl: clientEnv.apiBaseUrl,
    method: 'POST',
    body: JSON.stringify({ token, new_password: newPassword }),
  })
}

export async function verifyTwoFactorRequest(body: VerifyTwoFactorRequest): Promise<LoginResponse> {
  return fetchJson('/v1/auth/verify-2fa', {
    baseUrl: clientEnv.apiBaseUrl,
    method: 'POST',
    body: JSON.stringify(body),
  })
}

// ─── 2FA ──────────────────────────────────────────────────────────────────

export async function twoFactorStatus(): Promise<TwoFactorStatusResponse> {
  return fetchJson('/v1/auth/2fa/status', {
    baseUrl: clientEnv.apiBaseUrl,
  })
}

export async function twoFactorSetup(): Promise<SetupTwoFactorResponse> {
  return fetchJson('/v1/auth/2fa/setup', {
    baseUrl: clientEnv.apiBaseUrl,
    method: 'POST',
  })
}

export async function twoFactorEnable(code: string): Promise<EnableTwoFactorResponse> {
  return fetchJson('/v1/auth/2fa/enable', {
    baseUrl: clientEnv.apiBaseUrl,
    method: 'POST',
    body: JSON.stringify({ code }),
  })
}

export async function twoFactorDisable(password: string): Promise<void> {
  await fetchJson('/v1/auth/2fa/disable', {
    baseUrl: clientEnv.apiBaseUrl,
    method: 'POST',
    body: JSON.stringify({ password }),
  })
}

export async function twoFactorRevealCodes(password: string): Promise<RegenerateBackupCodesResponse> {
  return fetchJson('/v1/auth/2fa/backup-codes/reveal', {
    baseUrl: clientEnv.apiBaseUrl,
    method: 'POST',
    body: JSON.stringify({ password }),
  })
}

// ─── Sessões ──────────────────────────────────────────────────────────────

export async function listSessions(): Promise<ListActiveSessionsResponse> {
  return fetchJson('/v1/security/sessions', {
    baseUrl: clientEnv.apiBaseUrl,
  })
}

export async function revokeSession(sessionId: string): Promise<void> {
  await fetchJson(`/v1/security/sessions/${sessionId}`, {
    baseUrl: clientEnv.apiBaseUrl,
    method: 'DELETE',
  })
}

export async function revokeAllSessions(): Promise<void> {
  await fetchJson('/v1/security/sessions', {
    baseUrl: clientEnv.apiBaseUrl,
    method: 'DELETE',
  })
}

// ─── Logs de segurança ─────────────────────────────────────────────────────

export async function listSecurityLogs(
  page = 1,
  pageSize = 20,
): Promise<ListSecurityLogsResponse> {
  return fetchJson(`/v1/security/logs?page=${page}&pageSize=${pageSize}`, {
    baseUrl: clientEnv.apiBaseUrl,
  })
}

export function toUiRole(role: AuthMeResponse['role']): UserRole {
  switch (role) {
    case 'CIDADAO':
      return 'cidadao'
    case 'OPERADOR_VEOLIA':
      return 'operador'
    case 'TECNICO_AUTARQUIA':
      return 'tecnico_autarquia'
    case 'TECNICO_CCDR':
      return 'tecnico_ccdr'
    case 'ADMIN':
      return 'admin'
    default:
      return 'guest'
  }
}
