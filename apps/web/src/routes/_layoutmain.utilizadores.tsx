import { createFileRoute } from '@tanstack/react-router'
import { requireRole } from '@/lib/auth'
import { getAccessToken } from '@/lib/auth'
import { Card } from '@/components/ui/card'
import { Search, Shield, CheckCircle, XCircle, ChevronDown, Loader } from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
import { fetchJson } from '@/lib/http/fetch-json'
import { getApiErrorMessage } from '@/lib/http/api-error'
import { clientEnv } from '@/lib/env'
import type { ListUsersResponse, UserRecord } from '@ecobairro/contracts'

export const Route = createFileRoute('/_layoutmain/utilizadores')({
  beforeLoad: requireRole(['admin']),
  component: UtilizadoresPage,
})

type FrontRole = 'cidadao' | 'operador' | 'tecnico_autarquia' | 'tecnico_ccdr' | 'admin'

const papelConfig: Record<string, { label: string; color: string }> = {
  cidadao:            { label: 'Cidadão',         color: '#60a5fa'               },
  operador:           { label: 'Operador',         color: '#fb923c'               },
  tecnico_autarquia:  { label: 'Téc. Autarquia',   color: '#a78bfa'               },
  tecnico_ccdr:       { label: 'Téc. CCDR',        color: '#f472b6'               },
  admin:              { label: 'Administrador',    color: 'oklch(0.55 0.18 150)'  },
}

const papeis: FrontRole[] = ['cidadao', 'operador', 'tecnico_autarquia', 'tecnico_ccdr', 'admin']

function authHeaders() {
  const tok = getAccessToken()
  return tok ? { Authorization: `Bearer ${tok}` } : {}
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' })
}

function UtilizadoresPage() {
  const [users, setUsers]           = useState<UserRecord[]>([])
  const [total, setTotal]           = useState(0)
  const [loading, setLoading]       = useState(true)
  const [listError, setListError]   = useState<string | null>(null)
  const [pesquisa, setPesquisa]     = useState('')
  const [filtroPapel, setFiltroPapel] = useState<FrontRole | 'todos'>('todos')
  const [filtroAtivo, setFiltroAtivo] = useState<'todos' | 'ativo' | 'inativo'>('todos')

  const load = useCallback(async () => {
    setLoading(true)
    setListError(null)
    try {
      const params: Record<string, string> = {}
      if (pesquisa.trim())         params['q']     = pesquisa.trim()
      if (filtroPapel !== 'todos') params['role']  = filtroPapel
      if (filtroAtivo !== 'todos') params['ativo'] = filtroAtivo === 'ativo' ? 'true' : 'false'
      params['pageSize'] = '100'

      const resp = await fetchJson<ListUsersResponse>('/v1/users', {
        baseUrl: clientEnv.apiBaseUrl,
        headers: authHeaders(),
        params,
      })
      setUsers(resp.users)
      setTotal(resp.total)
    } catch (err) {
      setUsers([])
      setTotal(0)
      setListError(getApiErrorMessage(err, 'Não foi possível carregar os utilizadores.'))
    } finally {
      setLoading(false)
    }
  }, [pesquisa, filtroPapel, filtroAtivo])

  useEffect(() => { void load() }, [load])

  const ativos   = users.filter(u => u.ativo).length
  const inativos = users.filter(u => !u.ativo).length
  const admins   = users.filter(u => u.role === 'admin').length

  function displayName(u: UserRecord) {
    return u.nome ?? u.email.split('@')[0] ?? '—'
  }

  function initials(u: UserRecord) {
    const name = u.nome ?? u.email
    return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
  }

  return (
    <div className="flex flex-col gap-8 pb-12">
      {listError && (
        <div role="alert" aria-live="polite" className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive flex items-center justify-between gap-3">
          <span>{listError}</span>
          <button onClick={() => void load()} className="text-xs font-medium underline-offset-2 hover:underline">Tentar novamente</button>
        </div>
      )}

      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">Gestão de Utilizadores</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {loading ? '…' : `${total} utilizador${total !== 1 ? 'es' : ''} registado${total !== 1 ? 's' : ''}`}
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total',    value: total,    color: '#60a5fa'               },
          { label: 'Ativos',   value: ativos,   color: 'oklch(0.55 0.18 150)' },
          { label: 'Inativos', value: inativos, color: '#f87171'               },
          { label: 'Admins',   value: admins,   color: '#a78bfa'               },
        ].map((s) => (
          <Card key={s.label} className="border border-border/70 shadow-sm rounded-xl p-4">
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{s.label}</p>
            <p className="text-2xl font-bold mt-1" style={{ color: s.color }}>{s.value}</p>
          </Card>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Pesquisar nome ou email..."
            value={pesquisa}
            onChange={(e) => setPesquisa(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-sm rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)]/50 transition-all"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={filtroPapel}
            onChange={(e) => setFiltroPapel(e.target.value as FrontRole | 'todos')}
            className="px-3 py-2 text-xs rounded-xl border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30"
          >
            <option value="todos">Todos os papéis</option>
            {papeis.map(p => <option key={p} value={p}>{papelConfig[p]?.label}</option>)}
          </select>
          <select
            value={filtroAtivo}
            onChange={(e) => setFiltroAtivo(e.target.value as 'todos' | 'ativo' | 'inativo')}
            className="px-3 py-2 text-xs rounded-xl border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30"
          >
            <option value="todos">Todos</option>
            <option value="ativo">Ativos</option>
            <option value="inativo">Inativos</option>
          </select>
        </div>
      </div>

      {/* Tabela */}
      <Card className="border border-border/70 shadow-sm rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Utilizador</th>
                <th className="text-left px-4 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Papel</th>
                <th className="text-left px-4 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Desde</th>
                <th className="text-left px-4 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Estado</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Loader className="w-5 h-5 animate-spin" />
                      <span className="text-sm">A carregar…</span>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-muted-foreground text-sm">
                    <div className="flex flex-col items-center gap-2">
                      <Shield className="w-8 h-8 opacity-30" />
                      Nenhum utilizador encontrado
                    </div>
                  </td>
                </tr>
              ) : users.map((u, i) => {
                const cfg = papelConfig[u.role] ?? { label: u.role, color: '#94a3b8' }
                return (
                  <tr key={u.id} className={`border-b border-border/50 hover:bg-muted/20 transition-colors ${i % 2 === 0 ? '' : 'bg-muted/10'}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-[var(--primary)] flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {initials(u)}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-foreground">{displayName(u)}</p>
                          <p className="text-[10px] text-muted-foreground">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="relative inline-block">
                        <span
                          className="pl-2 pr-4 py-1 text-[10px] font-medium rounded-full"
                          style={{ color: cfg.color, backgroundColor: `color-mix(in srgb, ${cfg.color} 12%, transparent)` }}
                        >
                          {cfg.label}
                        </span>
                        <ChevronDown className="absolute right-0.5 top-1/2 -translate-y-1/2 w-2.5 h-2.5 pointer-events-none opacity-50" style={{ color: cfg.color }} />
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <p className="text-xs text-muted-foreground">{formatDate(u.criado_em)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className={`flex items-center gap-1 text-[10px] font-medium w-fit px-2 py-0.5 rounded-full ${u.ativo ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30' : 'text-muted-foreground bg-muted'}`}>
                        {u.ativo ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {u.ativo ? 'Ativo' : 'Inativo'}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
