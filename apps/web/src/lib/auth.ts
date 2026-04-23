import { redirect } from '@tanstack/react-router'
import type { User, UserRole } from '@/types'

export function getUser(): User | null {
  const stored = sessionStorage.getItem('user')
  if (!stored) return null
  try {
    return JSON.parse(stored) as User
  } catch {
    return null
  }
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
