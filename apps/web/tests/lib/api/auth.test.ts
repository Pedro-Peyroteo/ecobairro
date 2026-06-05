import { describe, it, expect } from 'vitest'
import { toUiRole } from '@/lib/api/auth'

describe('toUiRole (backend → frontend role mapping)', () => {
  it('CIDADAO → cidadao', () => {
    expect(toUiRole('CIDADAO')).toBe('cidadao')
  })

  it('OPERADOR_VEOLIA → operador', () => {
    expect(toUiRole('OPERADOR_VEOLIA')).toBe('operador')
  })

  it('TECNICO_AUTARQUIA → tecnico_autarquia', () => {
    expect(toUiRole('TECNICO_AUTARQUIA')).toBe('tecnico_autarquia')
  })

  it('TECNICO_CCDR → tecnico_ccdr', () => {
    expect(toUiRole('TECNICO_CCDR')).toBe('tecnico_ccdr')
  })

  it('ADMIN → admin', () => {
    expect(toUiRole('ADMIN')).toBe('admin')
  })

  it('role desconhecido cai para guest (defesa)', () => {
    expect(toUiRole('UNKNOWN_ROLE' as never)).toBe('guest')
  })
})
