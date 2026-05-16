import type {
  AuthMeResponse,
  CitizenSelfProfileResponse,
  ForgotPasswordResponse,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
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

export async function loginRequest(body: LoginRequest): Promise<LoginResponse> {
  return fetchJson('/v1/auth/login', {
    baseUrl: clientEnv.apiBaseUrl,
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export async function getMe(accessToken: string): Promise<AuthMeResponse> {
  return fetchJson('/v1/auth/me', {
    baseUrl: clientEnv.apiBaseUrl,
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
}

export async function getCitizenProfile(accessToken: string): Promise<CitizenSelfProfileResponse> {
  return fetchJson('/v1/cidadaos/me', {
    baseUrl: clientEnv.apiBaseUrl,
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
}

export async function updateCitizenProfile(
  accessToken: string,
  payload: { nome_completo?: string },
): Promise<CitizenSelfProfileResponse> {
  return fetchJson('/v1/cidadaos/me', {
    baseUrl: clientEnv.apiBaseUrl,
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
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
