import { redirect } from '@tanstack/react-router'
import type { User, UserRole } from '@/types'

// Fix #3: tokens já não são guardados no frontend — estão em cookies HttpOnly.
// Apenas o objeto User (sem dados sensíveis) fica em sessionStorage para UX.
const USER_KEY = 'user'

export function getUser(): User | null {
  const stored = sessionStorage.getItem(USER_KEY)
  if (!stored) return null
  try {
    return JSON.parse(stored) as User
  } catch {
    return null
  }
}

export function setAuthSession(input: { user: User }) {
  sessionStorage.setItem(USER_KEY, JSON.stringify(input.user))
}

export function clearAuthSession() {
  sessionStorage.removeItem(USER_KEY)
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
