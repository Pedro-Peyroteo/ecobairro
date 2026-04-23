import { createFileRoute } from '@tanstack/react-router'
import { requireRole } from '@/lib/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, TrendingDown, BarChart3, MapPin, FileText, Users, Recycle } from 'lucide-react'

export const Route = createFileRoute('/_layoutmain/analytics')({
  beforeLoad: requireRole(['tecnico_autarquia', 'tecnico_ccdr', 'admin']),
  component: AnalyticsPage,
})

/* ── Helpers ── */
function BarChart({ data, color = 'var(--primary)' }: { data: { label: string; value: number }[]; color?: string }) {
  const max = Math.max(...data.map(d => d.value), 1)
  return (
    <div className="flex items-end gap-2 h-32 mt-4">
      {data.map(({ label, value }) => (
        <div key={label} className="flex flex-col items-center gap-1 flex-1">
          <span className="text-[10px] font-semibold text-foreground">{value}</span>
          <div className="w-full rounded-t-md transition-all duration-500" style={{ height: `${(value / max) * 96}px`, backgroundColor: color, opacity: 0.85 }} />
          <span className="text-[9px] text-muted-foreground truncate w-full text-center">{label}</span>
        </div>
      ))}
    </div>
  )
}

function DonutSegment({ pct, color, label, value }: { pct: number; color: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
      <span className="text-xs text-foreground flex-1">{label}</span>
      <span className="text-xs font-semibold text-foreground">{value}</span>
      <span className="text-[10px] text-muted-foreground w-8 text-right">{pct}%</span>
    </div>
  )
}

const reportesMensais = [
  { label: 'Jul', value: 38 }, { label: 'Ago', value: 52 }, { label: 'Set', value: 47 },
  { label: 'Out', value: 61 }, { label: 'Nov', value: 74 }, { label: 'Dez', value: 89 },
  { label: 'Jan', value: 103 },
]

const resolucaoMensais = [
  { label: 'Jul', value: 30 }, { label: 'Ago', value: 44 }, { label: 'Set', value: 40 },
  { label: 'Out', value: 55 }, { label: 'Nov', value: 68 }, { label: 'Dez', value: 75 },
  { label: 'Jan', value: 91 },
]

const ecopontosPorZona = [
  { label: 'Norte', value: 42 }, { label: 'Sul', value: 38 }, { label: 'Este', value: 29 },
  { label: 'Oeste', value: 35 }, { label: 'Centro', value: 51 },
]

function AnalyticsPage() {
  return (
    <div className="flex flex-col gap-8 pb-12">

      <div>
        <h1 className="text-xl font-bold text-foreground">Analytics</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Visão geral do desempenho do sistema — Janeiro 2026</p>
      </div>

      {/* KPIs topo */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Reportes este mês',    value: '103',  delta: '+16%',  up: true,  icon: FileText,  color: '#60a5fa'               },
          { label: 'Taxa de resolução',    value: '88%',  delta: '+4pp',  up: true,  icon: TrendingUp, color: 'oklch(0.55 0.18 150)' },
          { label: 'Ecopontos ativos',     value: '195',  delta: '-3',    up: false, icon: Recycle,   color: '#fb923c'               },
          { label: 'Utilizadores ativos',  value: '1.2k', delta: '+120',  up: true,  icon: Users,     color: '#a78bfa'               },
        ].map(({ label, value, delta, up, icon: Icon, color }) => (
          <Card key={label} className="border border-border/70 shadow-sm rounded-xl">
            <CardHeader className="flex flex-row items-center justify-between pb-1 pt-4 px-4">
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{label}</p>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)` }}>
                <Icon className="w-3.5 h-3.5" style={{ color }} />
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <p className="text-2xl font-bold text-foreground">{value}</p>
              <div className={`flex items-center gap-1 mt-1 text-[11px] font-medium ${up ? 'text-emerald-600' : 'text-red-500'}`}>
                {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {delta} vs mês anterior
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Gráficos linha 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border border-border/70 shadow-sm rounded-xl">
          <CardHeader className="pb-0">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <BarChart3 className="w-4 h-4 text-[var(--primary)]" />
              Reportes submetidos (últimos 7 meses)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart data={reportesMensais} color="var(--primary)" />
          </CardContent>
        </Card>

        <Card className="border border-border/70 shadow-sm rounded-xl">
          <CardHeader className="pb-0">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              Reportes resolvidos (últimos 7 meses)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart data={resolucaoMensais} color="oklch(0.55 0.18 150)" />
          </CardContent>
        </Card>
      </div>

      {/* Gráficos linha 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border border-border/70 shadow-sm rounded-xl">
          <CardHeader className="pb-0">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <MapPin className="w-4 h-4 text-amber-500" />
              Ecopontos por zona
            </CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart data={ecopontosPorZona} color="#f59e0b" />
          </CardContent>
        </Card>

        <Card className="border border-border/70 shadow-sm rounded-xl">
          <CardHeader className="pb-0">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <FileText className="w-4 h-4 text-[var(--primary)]" />
              Tipos de reporte — Janeiro
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 pt-4">
            {[
              { label: 'Ecoponto Cheio',    value: '38',  pct: 37, color: '#60a5fa'               },
              { label: 'Deposição Ilegal',  value: '27',  pct: 26, color: '#f87171'               },
              { label: 'Dano Equipamento',  value: '21',  pct: 20, color: '#fb923c'               },
              { label: 'Odores',            value: '11',  pct: 11, color: '#a78bfa'               },
              { label: 'Vandalismo',        value: '6',   pct:  6, color: 'oklch(0.55 0.18 150)'  },
            ].map(s => <DonutSegment key={s.label} {...s} />)}
            <div className="mt-3 h-3 rounded-full overflow-hidden flex">
              {[
                { pct: 37, color: '#60a5fa' }, { pct: 26, color: '#f87171' },
                { pct: 20, color: '#fb923c' }, { pct: 11, color: '#a78bfa' },
                { pct: 6,  color: 'oklch(0.55 0.18 150)' },
              ].map((s, i) => (
                <div key={i} style={{ width: `${s.pct}%`, backgroundColor: s.color }} />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela top zonas */}
      <Card className="border border-border/70 shadow-sm rounded-xl overflow-hidden">
        <CardHeader className="pb-0">
          <CardTitle className="text-sm font-semibold">Desempenho por zona</CardTitle>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {['Zona', 'Reportes', 'Resolvidos', 'Taxa', 'Ecopontos'].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { zona: 'Centro',  reportes: 38, resolvidos: 35, taxa: 92, ecopontos: 51 },
                { zona: 'Norte',   reportes: 27, resolvidos: 23, taxa: 85, ecopontos: 42 },
                { zona: 'Sul',     reportes: 22, resolvidos: 19, taxa: 86, ecopontos: 38 },
                { zona: 'Oeste',   reportes: 10, resolvidos: 9,  taxa: 90, ecopontos: 35 },
                { zona: 'Este',    reportes: 6,  resolvidos: 5,  taxa: 83, ecopontos: 29 },
              ].map((r, i) => (
                <tr key={r.zona} className={`border-b border-border/50 hover:bg-muted/20 ${i % 2 === 0 ? '' : 'bg-muted/10'}`}>
                  <td className="px-4 py-2.5 text-xs font-medium text-foreground">{r.zona}</td>
                  <td className="px-4 py-2.5 text-xs text-foreground">{r.reportes}</td>
                  <td className="px-4 py-2.5 text-xs text-foreground">{r.resolvidos}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden max-w-[80px]">
                        <div className="h-full rounded-full" style={{ width: `${r.taxa}%`, backgroundColor: r.taxa >= 90 ? 'oklch(0.55 0.18 150)' : r.taxa >= 85 ? '#fb923c' : '#f87171' }} />
                      </div>
                      <span className="text-xs font-semibold text-foreground">{r.taxa}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-foreground">{r.ecopontos}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
