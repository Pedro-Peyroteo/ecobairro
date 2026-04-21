import { createFileRoute } from '@tanstack/react-router'
import { MapPin, FileText, Trash2, Users, TrendingUp, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { User } from '@/types'

export const Route = createFileRoute('/_layoutmain/dashboard')({
  component: DashboardPage,
})

const kpiCards = [
  {
    title: 'Ecopontos Ativos',
    value: '248',
    change: '+4 este mês',
    icon: MapPin,
    trend: 'up',
  },
  {
    title: 'Reportes Abertos',
    value: '37',
    change: '-12 vs semana passada',
    icon: FileText,
    trend: 'down',
  },
  {
    title: 'Recolhas Pendentes',
    value: '14',
    change: '3 urgentes',
    icon: Trash2,
    trend: 'neutral',
  },
  {
    title: 'Utilizadores Ativos',
    value: '1.204',
    change: '+89 este mês',
    icon: Users,
    trend: 'up',
  },
]

const recentReports = [
  { id: '#R-0291', local: 'Av. da República, 45', tipo: 'Ecoponto cheio', estado: 'aberto', tempo: '2h' },
  { id: '#R-0290', local: 'R. das Flores, 12', tipo: 'Vidro derramado', estado: 'em_curso', tempo: '5h' },
  { id: '#R-0289', local: 'Praça do Comércio', tipo: 'Ecoponto danificado', estado: 'resolvido', tempo: '1d' },
  { id: '#R-0288', local: 'R. Augusta, 78', tipo: 'Odor intenso', estado: 'em_curso', tempo: '1d' },
]

const estadoBadge: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  aberto: { label: 'Aberto', variant: 'destructive' },
  em_curso: { label: 'Em curso', variant: 'default' },
  resolvido: { label: 'Resolvido', variant: 'secondary' },
}

function DashboardPage() {
  const stored = sessionStorage.getItem('user')
  const user: User = stored ? JSON.parse(stored) : { id: '1', name: 'Demo', email: 'demo@eco.pt', role: 'cidadao' }

  return (
    <div className="space-y-6">
      {/* Welcome Banner (Materialize Style) */}
      <Card className="relative overflow-hidden mb-8 border-none shadow-md bg-gradient-to-r from-[var(--card)] to-[var(--primary-light)]">
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-4 relative z-10 max-w-xl">
              <div className="space-y-1">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--foreground)]">
                  Bem-vindo de volta, <span className="text-[var(--primary)]">{((user as any).nome || user.name || 'Utilizador').split(' ')[0]}</span>! 🎉
                </h1>
                <p className="text-[0.9375rem] text-muted-foreground leading-relaxed text-balance">
                  Aqui tem o resumo operacional da plataforma ecoBairro.
                  Os reportes mensais aumentaram em <span className="font-medium text-foreground">12%</span>.
                </p>
              </div>
            </div>
            
            <div className="hidden sm:flex absolute right-6 -bottom-6 opacity-20 dark:opacity-10 pointer-events-none">
              <TrendingUp className="w-40 h-40 text-[var(--primary)]" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((kpi) => {
          const Icon = kpi.icon
          return (
            <Card key={kpi.title} className="border border-border/70 shadow-sm rounded-xl overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{kpi.title}</CardTitle>
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{kpi.value}</div>
                <p className="flex items-center gap-1 text-[11px] text-muted-foreground mt-1">
                  {kpi.trend === 'up' && <TrendingUp className="w-3 h-3 text-green-500" />}
                  {kpi.trend === 'down' && <TrendingUp className="w-3 h-3 text-red-500 rotate-180" />}
                  {kpi.trend === 'neutral' && <AlertCircle className="w-3 h-3 text-amber-500" />}
                  {kpi.change}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Recent reports */}
      <Card className="border border-border/70 shadow-sm rounded-xl overflow-hidden">
        <CardHeader>
          <CardTitle>Reportes Recentes</CardTitle>
          <CardDescription>Últimas ocorrências registadas na plataforma</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {/* Header row */}
            <div className="grid grid-cols-[auto_1fr_1fr_auto_auto] gap-4 px-3 py-2 text-xs font-medium text-muted-foreground">
              <span>ID</span>
              <span>Local</span>
              <span>Tipo</span>
              <span>Estado</span>
              <span>Há</span>
            </div>
            <div className="divide-y divide-border">
              {recentReports.map((r) => {
                const badge = estadoBadge[r.estado]
                return (
                  <div
                    key={r.id}
                    className="grid grid-cols-[auto_1fr_1fr_auto_auto] gap-4 items-center px-3 py-3 text-sm hover:bg-muted/50 transition-colors"
                  >
                    <span className="font-mono text-xs text-muted-foreground">{r.id}</span>
                    <span className="truncate">{r.local}</span>
                    <span className="text-muted-foreground truncate">{r.tipo}</span>
                    <Badge variant={badge.variant} className="text-xs">
                      {badge.label}
                    </Badge>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">{r.tempo}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
