import { redirect } from '@tanstack/react-router'
import type { User, UserRole } from '@/types'

const ACCESS_TOKEN_KEY = 'access_token'
const REFRESH_TOKEN_KEY = 'refresh_token'

export function getUser(): User | null {
  const stored = sessionStorage.getItem('user')
  if (!stored) return null
  try {
    return JSON.parse(stored) as User
  } catch {
    return null
  }
}

export function setAuthSession(input: {
  user: User
  accessToken: string
  refreshToken: string
}) {
  sessionStorage.setItem('user', JSON.stringify(input.user))
  sessionStorage.setItem(ACCESS_TOKEN_KEY, input.accessToken)
  sessionStorage.setItem(REFRESH_TOKEN_KEY, input.refreshToken)
}

export function clearAuthSession() {
  sessionStorage.removeItem('user')
  sessionStorage.removeItem(ACCESS_TOKEN_KEY)
  sessionStorage.removeItem(REFRESH_TOKEN_KEY)
}

export function getAccessToken(): string | null {
  return sessionStorage.getItem(ACCESS_TOKEN_KEY)
}

export function requireAuth() {
  const user = getUser()
  if (!user || user.role === 'guest') {
    throw redirect({ to: '/login' })
  }
  return { user }
}

export function requireRole(allowed: UserRole[]) {
  return () => {
    const user = getUser()
    if (!user || user.role === 'guest') {
      throw redirect({ to: '/login' })
    }
    if (!allowed.includes(user.role)) {
      throw redirect({ to: '/home' })
    }
    return { user }
  }
}
