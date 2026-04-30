import { createFileRoute } from '@tanstack/react-router'
import { AlertCircle, Clock3, Download, FileText, Loader2, Search } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { requireRole } from '@/lib/auth'
import { getAccessToken, getUser } from '@/lib/auth'
import { useEffect, useMemo, useState } from 'react'
import { fetchJson } from '@/lib/http/fetch-json'
import { clientEnv } from '@/lib/env'
import type { ListReportsResponse, ReportRecord, ReportStatus } from '@ecobairro/contracts'

export const Route = createFileRoute('/_layoutmain/dashboard')({
  beforeLoad: requireRole(['operador', 'admin']),
  component: DashboardPage,
})

const estadoBadge: Record<ReportStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pendente: { label: 'Pendente', variant: 'outline' },
  analise: { label: 'Em análise', variant: 'default' },
  resolvido: { label: 'Resolvido', variant: 'secondary' },
  rejeitado: { label: 'Rejeitado', variant: 'destructive' },
}

function DashboardPage() {
  const user = getUser()
  const [pesquisa, setPesquisa] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reports, setReports] = useState<ReportRecord[]>([])
  const [totals, setTotals] = useState({
    all: 0,
    pendente: 0,
    analise: 0,
    resolvido: 0,
    rejeitado: 0,
  })

  useEffect(() => {
    const accessToken = getAccessToken()
    if (!accessToken) {
      setError('Sessão inválida. Faça login novamente.')
      setLoading(false)
      return
    }

    const headers = { Authorization: `Bearer ${accessToken}` }

    const load = async () => {
      try {
        setLoading(true)
        setError(null)

        const [recent, all, pendente, analise, resolvido, rejeitado] = await Promise.all([
          fetchJson<ListReportsResponse>('/v1/reports?page=1&pageSize=50', {
            baseUrl: clientEnv.apiBaseUrl,
            headers,
          }),
          fetchJson<ListReportsResponse>('/v1/reports?page=1&pageSize=1', { baseUrl: clientEnv.apiBaseUrl, headers }),
          fetchJson<ListReportsResponse>('/v1/reports?page=1&pageSize=1&status=pendente', { baseUrl: clientEnv.apiBaseUrl, headers }),
          fetchJson<ListReportsResponse>('/v1/reports?page=1&pageSize=1&status=analise', { baseUrl: clientEnv.apiBaseUrl, headers }),
          fetchJson<ListReportsResponse>('/v1/reports?page=1&pageSize=1&status=resolvido', { baseUrl: clientEnv.apiBaseUrl, headers }),
          fetchJson<ListReportsResponse>('/v1/reports?page=1&pageSize=1&status=rejeitado', { baseUrl: clientEnv.apiBaseUrl, headers }),
        ])

        setReports(recent.reports)
        setTotals({
          all: all.total,
          pendente: pendente.total,
          analise: analise.total,
          resolvido: resolvido.total,
          rejeitado: rejeitado.total,
        })
      } catch {
        setError('Não foi possível carregar os dados do dashboard.')
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [])

  const reportesFiltrados = useMemo(() => reports.filter(r => {
    const matchSearch = pesquisa === '' || r.local.toLowerCase().includes(pesquisa.toLowerCase()) || r.tipo.toLowerCase().includes(pesquisa.toLowerCase())
    const matchEstado = filtroEstado === 'todos' || r.status === filtroEstado
    return matchSearch && matchEstado
  }), [reports, pesquisa, filtroEstado])

  const kpiCards = [
    { title: 'Total de Reportes', value: totals.all, extra: 'registos em base de dados', icon: FileText },
    { title: 'Pendentes', value: totals.pendente, extra: 'a aguardar triagem', icon: Clock3 },
    { title: 'Em Análise', value: totals.analise, extra: 'em processamento', icon: Loader2 },
    { title: 'Resolvidos', value: totals.resolvido, extra: 'fechados com sucesso', icon: FileText },
    { title: 'Rejeitados', value: totals.rejeitado, extra: 'encerrados como inválidos', icon: AlertCircle },
    { title: 'Taxa de Resolução', value: `${totals.all > 0 ? Math.round((totals.resolvido / totals.all) * 100) : 0}%`, extra: 'resolvidos / total', icon: FileText },
  ] as const

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* Banner */}
      <Card className="relative overflow-hidden border-none shadow-md bg-gradient-to-r from-[var(--card)] to-[var(--primary-light)]">
        <CardContent className="p-6 sm:p-8">
          <div className="relative z-10">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Bem-vindo, <span className="text-[var(--primary)]">{(user?.name ?? 'Utilizador').split(' ')[0]}</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Resumo operacional da plataforma ecoBairro — {new Date().toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
          {loading && <Loader2 className="w-6 h-6 animate-spin text-[var(--primary)]" />}
        </CardContent>
      </Card>

      {error && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* KPIs */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {kpiCards.map((kpi) => {
          const Icon = kpi.icon
          return (
            <Card key={kpi.title} className="border border-border/70 shadow-sm rounded-xl overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between pb-1 pt-4 px-4">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider leading-tight">{kpi.title}</p>
                <div className="flex items-center justify-center w-7 h-7 rounded-lg shrink-0 bg-primary/10">
                  <Icon className="w-3.5 h-3.5 text-primary" />
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <p className="text-xl font-bold text-foreground">{loading ? '-' : kpi.value}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{kpi.extra}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Tabela reportes */}
      <Card className="border border-border/70 shadow-sm rounded-xl overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base">Reportes Recentes</CardTitle>
              <CardDescription>Últimas ocorrências registadas na plataforma</CardDescription>
            </div>
            <div className="flex gap-2 items-center">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                <input type="text" placeholder="Pesquisar..." value={pesquisa} onChange={e => setPesquisa(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 w-44" />
              </div>
              <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-xl border border-border bg-card text-foreground focus:outline-none">
                <option value="todos">Todos</option>
                <option value="pendente">Pendente</option>
                <option value="analise">Em análise</option>
                <option value="resolvido">Resolvido</option>
                <option value="rejeitado">Rejeitado</option>
              </select>
              <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl border border-border bg-card text-foreground hover:bg-accent transition-colors">
                <Download className="w-3.5 h-3.5" /> CSV
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  {['ID', 'Local', 'Tipo', 'Zona', 'Estado', 'Há'].map(h => (
                    <th key={h} className="text-left px-4 py-2.5 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reportesFiltrados.map((r, i) => {
                  const badge = estadoBadge[r.status]
                  return (
                    <tr key={r.id} className={`border-b border-border/50 hover:bg-muted/20 transition-colors ${i % 2 === 0 ? '' : 'bg-muted/10'}`}>
                      <td className="px-4 py-2.5"><code className="text-[11px] text-muted-foreground">{r.id.slice(0, 8)}</code></td>
                      <td className="px-4 py-2.5 text-xs text-foreground truncate max-w-[160px]">{r.local}</td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground">{r.tipo}</td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground">-</td>
                      <td className="px-4 py-2.5">
                        <Badge variant={badge.variant} className="text-[10px]">{badge.label}</Badge>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground whitespace-nowrap">{timeAgo(r.data)}</td>
                    </tr>
                  )
                })}
                {reportesFiltrados.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-xs text-muted-foreground">Nenhum reporte encontrado</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function timeAgo(value: string): string {
  const date = new Date(value)
  const diffMs = Date.now() - date.getTime()
  const minutes = Math.floor(diffMs / 60000)

  if (minutes < 1) return 'agora'
  if (minutes < 60) return `${minutes}min`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`

  const days = Math.floor(hours / 24)
  return `${days}d`
}
