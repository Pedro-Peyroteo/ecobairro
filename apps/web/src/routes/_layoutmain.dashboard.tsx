import { createFileRoute } from '@tanstack/react-router'
import { MapPin, FileText, Trash2, Users, TrendingUp, TrendingDown, AlertCircle, Wifi, WifiOff, Download, Search } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { requireRole } from '@/lib/auth'
import { getUser } from '@/lib/auth'
import { useState } from 'react'

export const Route = createFileRoute('/_layoutmain/dashboard')({
  beforeLoad: requireRole(['operador', 'admin']),
  component: DashboardPage,
})

const kpiCards = [
  { title: 'Ecopontos Ativos',    value: '195', extra: '53 offline',    icon: MapPin,  trend: 'up',      trendVal: '+4 este mês',            color: '#60a5fa' },
  { title: 'Reportes Abertos',    value: '37',  extra: '5 críticos',    icon: FileText,trend: 'down',     trendVal: '-12 vs semana passada',   color: '#fb923c' },
  { title: 'Recolhas Pendentes',  value: '14',  extra: '3 urgentes',    icon: Trash2,  trend: 'neutral',  trendVal: 'igual à semana passada',  color: '#f87171' },
  { title: 'Utilizadores Ativos', value: '1.2k',extra: '+89 este mês',  icon: Users,   trend: 'up',       trendVal: '+8% vs mês anterior',     color: 'oklch(0.55 0.18 150)' },
  { title: 'Sensores Online',     value: '141', extra: '54 com alertas',icon: Wifi,    trend: 'down',     trendVal: '-12 offline',             color: '#22c55e' },
  { title: 'Zonas Cobertas',      value: '5',   extra: '100% cobertura',icon: MapPin,  trend: 'neutral',  trendVal: 'sem alterações',          color: '#a78bfa' },
]

const allReports = [
  { id: '#R-0295', local: 'Praça do Rossio',         tipo: 'Ecoponto cheio',     estado: 'critico',   tempo: '30min', zona: 'Centro' },
  { id: '#R-0294', local: 'R. Vera Cruz, 33',         tipo: 'Deposição ilegal',   estado: 'aberto',    tempo: '1h',    zona: 'Centro' },
  { id: '#R-0293', local: 'Av. Beira-Mar',            tipo: 'Sensor offline',     estado: 'em_curso',  tempo: '2h',    zona: 'Oeste'  },
  { id: '#R-0292', local: 'Campus Universitário',     tipo: 'Tampa danificada',   estado: 'em_curso',  tempo: '4h',    zona: 'Norte'  },
  { id: '#R-0291', local: 'Av. da República, 45',     tipo: 'Ecoponto cheio',     estado: 'aberto',    tempo: '5h',    zona: 'Centro' },
  { id: '#R-0290', local: 'R. das Flores, 12',        tipo: 'Vidro derramado',    estado: 'em_curso',  tempo: '8h',    zona: 'Norte'  },
  { id: '#R-0289', local: 'Praça do Comércio',        tipo: 'Ecoponto danificado',estado: 'resolvido', tempo: '1d',    zona: 'Centro' },
  { id: '#R-0288', local: 'R. Augusta, 78',           tipo: 'Odor intenso',       estado: 'resolvido', tempo: '1d',    zona: 'Este'   },
  { id: '#R-0287', local: 'Av. L. Peixinho, 90',      tipo: 'Porta bloqueada',    estado: 'resolvido', tempo: '2d',    zona: 'Norte'  },
  { id: '#R-0286', local: 'R. da Glória, 45',         tipo: 'Vandalismo',         estado: 'rejeitado', tempo: '3d',    zona: 'Sul'    },
]

const estadoBadge: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; color: string }> = {
  critico:   { label: 'Crítico',   variant: 'destructive', color: '#f87171' },
  aberto:    { label: 'Aberto',    variant: 'outline',     color: '#fb923c' },
  em_curso:  { label: 'Em curso',  variant: 'default',     color: '#60a5fa' },
  resolvido: { label: 'Resolvido', variant: 'secondary',   color: 'oklch(0.55 0.18 150)' },
  rejeitado: { label: 'Rejeitado', variant: 'secondary',   color: '#94a3b8' },
}

function DashboardPage() {
  const user = getUser()
  const [pesquisa, setPesquisa] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('todos')

  const reportesFiltrados = allReports.filter(r => {
    const matchSearch = pesquisa === '' || r.local.toLowerCase().includes(pesquisa.toLowerCase()) || r.tipo.toLowerCase().includes(pesquisa.toLowerCase())
    const matchEstado = filtroEstado === 'todos' || r.estado === filtroEstado
    return matchSearch && matchEstado
  })

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
          <div className="hidden sm:flex absolute right-6 -bottom-4 opacity-10 pointer-events-none">
            <TrendingUp className="w-36 h-36 text-[var(--primary)]" />
          </div>
        </CardContent>
      </Card>

      {/* KPIs */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {kpiCards.map((kpi) => {
          const Icon = kpi.icon
          return (
            <Card key={kpi.title} className="border border-border/70 shadow-sm rounded-xl overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between pb-1 pt-4 px-4">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider leading-tight">{kpi.title}</p>
                <div className="flex items-center justify-center w-7 h-7 rounded-lg shrink-0" style={{ backgroundColor: `color-mix(in srgb, ${kpi.color} 12%, transparent)` }}>
                  <Icon className="w-3.5 h-3.5" style={{ color: kpi.color }} />
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <p className="text-xl font-bold text-foreground">{kpi.value}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{kpi.extra}</p>
                <div className={`flex items-center gap-0.5 mt-1 text-[10px] font-medium ${kpi.trend === 'up' ? 'text-emerald-600' : kpi.trend === 'down' ? 'text-red-500' : 'text-muted-foreground'}`}>
                  {kpi.trend === 'up' && <TrendingUp className="w-3 h-3" />}
                  {kpi.trend === 'down' && <TrendingDown className="w-3 h-3" />}
                  {kpi.trend === 'neutral' && <AlertCircle className="w-3 h-3" />}
                  <span className="truncate">{kpi.trendVal}</span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Alertas rápidos */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: '5 sensores com bateria crítica (<10%)', icon: WifiOff, color: '#f87171', action: 'Ver sensores' },
          { label: '3 ecopontos cheios sem recolha há +2 dias', icon: AlertCircle, color: '#fb923c', action: 'Ver fila' },
          { label: '2 operadores sem tarefas atribuídas', icon: Users, color: '#60a5fa', action: 'Ver fila' },
        ].map(({ label, icon: Icon, color, action }) => (
          <div key={label} className="flex items-center gap-3 p-3 rounded-xl border" style={{ borderColor: `color-mix(in srgb, ${color} 30%, transparent)`, backgroundColor: `color-mix(in srgb, ${color} 6%, transparent)` }}>
            <Icon className="w-4 h-4 shrink-0" style={{ color }} />
            <p className="text-xs text-foreground flex-1">{label}</p>
            <button className="text-xs font-medium hover:underline shrink-0" style={{ color }}>{action}</button>
          </div>
        ))}
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
                <option value="critico">Crítico</option>
                <option value="aberto">Aberto</option>
                <option value="em_curso">Em curso</option>
                <option value="resolvido">Resolvido</option>
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
                  const badge = estadoBadge[r.estado]
                  return (
                    <tr key={r.id} className={`border-b border-border/50 hover:bg-muted/20 transition-colors ${i % 2 === 0 ? '' : 'bg-muted/10'}`}>
                      <td className="px-4 py-2.5"><code className="text-[11px] text-muted-foreground">{r.id}</code></td>
                      <td className="px-4 py-2.5 text-xs text-foreground truncate max-w-[160px]">{r.local}</td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground">{r.tipo}</td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground">{r.zona}</td>
                      <td className="px-4 py-2.5">
                        <Badge variant={badge.variant} className="text-[10px]">{badge.label}</Badge>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground whitespace-nowrap">{r.tempo}</td>
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
