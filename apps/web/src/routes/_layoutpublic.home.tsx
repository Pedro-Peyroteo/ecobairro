import { createFileRoute } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  MapPin, TrendingUp, ChevronRight, Star, AlertTriangle, Recycle, Users, Leaf,
  FileText, CheckCircle, Package, Gift, Newspaper, Calendar, Clock
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

export const Route = createFileRoute('/_layoutpublic/home')({
  component: HomePage,
})

/* ─── Helpers ─── */
function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

function useCountUp(target: number, duration = 1000) {
  const [value, setValue] = useState(0)
  const rafRef = useRef<number | null>(null)
  useEffect(() => {
    let start: number | null = null
    const step = (ts: number) => {
      if (!start) start = ts
      const progress = Math.min((ts - start) / duration, 1)
      const ease = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(target * ease))
      if (progress < 1) rafRef.current = requestAnimationFrame(step)
    }
    rafRef.current = requestAnimationFrame(step)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [target, duration])
  return value
}

function Counter({ to }: { to: number }) {
  const v = useCountUp(to)
  return <>{v.toLocaleString('pt-PT')}</>
}

import { 
  mockUser, alertaCritico, atalhos, ecopontos, reports, partilhas, noticias 
} from '@/mocks/homeMocks'

function ecoState(pct: number) {
  if (pct >= 80) return { label: 'Cheio', color: '#f87171', barColor: '#f87171cc' }
  if (pct >= 50) return { label: 'Moderado', color: '#fb923c', barColor: '#fb923ccc' }
  return { label: 'Disponível', color: 'oklch(0.55 0.18 150)', barColor: 'oklch(0.55 0.18 150 / 0.85)' }
}

/* ─── Página ─── */
function HomePage() {
  const stored = sessionStorage.getItem('user')
  const currentUser = stored ? JSON.parse(stored) : { id: 'guest', nome: 'Visitante', email: 'guest@eco.pt', role: 'guest' }
  const isGuest = currentUser.role === 'guest' || (currentUser.role === 'cidadao' && currentUser.email === 'demo@eco.pt')

  const greeting = getGreeting()
  const userDisplayName = currentUser.nome || currentUser.name || 'ecoBairro'
  const firstName = isGuest ? 'ecoBairro' : userDisplayName.split(' ')[0]
  const pontosRestantes = mockUser.pontosProximo - mockUser.pontos
  const progresso = Math.round((mockUser.pontos / mockUser.pontosProximo) * 100)

  return (
    <div className="flex flex-col gap-10 pb-12 max-w-2xl mx-auto lg:max-w-none">

      {/* ── 1. Banner principal ── */}
      <Card className="relative overflow-hidden border-none shadow-sm bg-[var(--card)]">
        {/* Decoração direita: círculos sobrepostos como no Materialize */}
        <div className="absolute right-0 top-0 h-full w-40 pointer-events-none overflow-hidden">
          <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-[var(--primary)]/[0.07]" />
          <div className="absolute -right-4 -bottom-14 w-52 h-52 rounded-full bg-[var(--primary)]/[0.05]" />
        </div>

        <CardContent className="p-6 relative z-10 flex flex-col sm:flex-row sm:items-center gap-5 justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{greeting} 👋</p>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {isGuest ? 'Bem-vindo ao ' : 'Bem-vindo de volta, '}
              <span className="text-[var(--primary)]">{firstName}</span>!
            </h1>
            <p className="text-sm text-muted-foreground">
              {isGuest 
                ? 'Acompanhe as últimas novidades e participe na nossa comunidade para um bairro mais sustentável.'
                : 'Aqui tem o resumo da sua atividade no ecoBairro.'}
            </p>
          </div>
          {!isGuest && (
            <div className="flex flex-col gap-2 sm:items-end min-w-[190px]">
              <div className="flex items-center justify-between w-full text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Star className="w-3 h-3 text-[var(--primary)]" />
                  {mockUser.nivel}
                </span>
                <span><Counter to={mockUser.pontos} /> / {mockUser.pontosProximo} pts</span>
              </div>
              <Progress value={progresso} className="h-1.5 w-full [&>div]:bg-[var(--primary)]" />
              <p className="text-[11px] text-muted-foreground">
                Faltam <span className="font-semibold text-foreground">{pontosRestantes} pts</span> para {reports.proximoNivel}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {!isGuest && (
        <>
          {/* ── 2. Atalhos Rápidos ── */}
          <div className="grid grid-cols-3 gap-3">
        {atalhos.map((a) => {
          const Icon = a.icon
          return (
            <button
              key={a.label}
              className="flex flex-col items-center gap-2.5 p-4 rounded-xl bg-card border border-border hover:border-[var(--primary)]/40 hover:shadow-sm transition-all active:scale-[0.97] cursor-pointer"
            >
              <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-[var(--primary)]/10">
                <Icon className="w-5 h-5 text-[var(--primary)]" />
              </div>
              <span className="text-xs font-medium text-foreground leading-tight text-center">{a.label}</span>
            </button>
          )
        })}
      </div>

      {/* ── 3. Ecopontos Favoritos ── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[var(--primary)]" />
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Ecopontos Favoritos</h2>
          </div>
          <button className="flex items-center gap-1 text-xs text-[var(--primary)] font-medium hover:underline">
            Ver mapa <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar gap-3 pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-3">
          {ecopontos.map((eco) => {
            const state = ecoState(eco.ocupacao)
            return (
              <Card key={eco.id} className="min-w-[240px] sm:min-w-0 snap-start shrink-0 border border-border/70 shadow-sm rounded-xl hover:shadow-md transition-all cursor-pointer">
                <CardContent className="p-4 space-y-3">
                  <div className="flex justify-between items-start gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-foreground truncate">{eco.nome}</p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span>{eco.distancia}</span>
                      </div>
                    </div>
                    <div className="w-11 h-11 rounded-lg overflow-hidden shrink-0 ring-1 ring-border relative flex items-center justify-center">
                      <img src={eco.mapUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
                      <MapPin className="relative z-10 w-3 h-3 fill-red-500 text-white drop-shadow" strokeWidth={1.5} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${eco.ocupacao}%`, backgroundColor: state.barColor }}
                      />
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-muted-foreground">{eco.ocupacao}% ocupado</span>
                      <span className="font-medium" style={{ color: state.color }}>{state.label}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>

      {/* ── 4. Alerta ecoponto crítico (após ecopontos) ── */}
      <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">{alertaCritico.nome}</p>
          <p className="text-xs text-muted-foreground">{alertaCritico.ocupacao}% ocupado — evite depositar resíduos por agora</p>
        </div>
        <Badge variant="outline" className="text-[10px] shrink-0 border-amber-400/50 text-amber-600">Atenção</Badge>
      </div>

      {/* ── 5. Impacto pessoal ── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-[var(--primary)]" />
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">O seu impacto este ano</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label: 'Reciclagem', value: 34, unit: 'kg', icon: Recycle, color: 'oklch(0.55 0.18 150)', desc: 'resíduos reciclados' },
            { label: 'Comunidade', value: 1200, unit: 'pax', icon: Users, color: '#60a5fa', desc: 'membros ativos' },
            { label: 'Ecossistema', value: 3, unit: 'árvores', icon: Leaf, color: 'oklch(0.55 0.18 150)', desc: 'CO₂ poupado' },
          ].map((item) => {
            const Icon = item.icon
            return (
              <Card key={item.label} className="border border-border/70 shadow-sm rounded-xl overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{item.label}</CardTitle>
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg" style={{ backgroundColor: `color-mix(in srgb, ${item.color} 12%, transparent)` }}>
                    <Icon className="w-4 h-4" style={{ color: item.color }} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">
                    <Counter to={item.value} /> <span className="text-sm font-medium text-muted-foreground">{item.unit}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{item.desc}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>

      {/* ── 6. Resumo Reports ── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-[var(--primary)]" />
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Histórico de Reports</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label: 'Ativos', value: reports.ativos, icon: TrendingUp, color: '#fb923c' },
            { label: 'Resolvidos', value: reports.resolvidos, icon: CheckCircle, color: 'oklch(0.55 0.18 150)' },
            { label: 'Total', value: reports.total, icon: Package, color: '#8A93A4' },
          ].map((stat) => {
            const Icon = stat.icon
            return (
              <Card key={stat.label} className="border border-border/70 shadow-sm rounded-xl overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{stat.label}</CardTitle>
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg" style={{ backgroundColor: `color-mix(in srgb, ${stat.color} 12%, transparent)` }}>
                    <Icon className="w-4 h-4" style={{ color: stat.color }} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground"><Counter to={stat.value} /></div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Reportes enviados</p>
                </CardContent>
              </Card>
            )
          })}
        </div>
        <div className="bg-card border border-border/70 shadow-sm rounded-xl p-4 space-y-2">
          <Progress value={reports.progresso} className="h-2 [&>div]:bg-[var(--primary)]" />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{reports.progresso}% para subir de nível</span>
            <span>Próximo nível: <span className="font-medium text-foreground">{reports.proximoNivel}</span></span>
          </div>
        </div>
      </section>

      {/* ── 7. Partilhas Locais ── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-[var(--primary)]" />
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Partilhas na sua zona</h2>
          </div>
          <button className="flex items-center gap-1 text-xs text-[var(--primary)] font-medium hover:underline">
            Ver todas <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex flex-col rounded-xl border border-border/70 bg-card overflow-hidden divide-y divide-border">
          {partilhas.map((p) => (
            <div key={p.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors cursor-pointer">
              <div className="w-8 h-8 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center shrink-0">
                <Package className="w-4 h-4 text-[var(--primary)]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground truncate">{p.titulo}</p>
                <p className="text-xs text-muted-foreground">{p.utilizador} · {p.zona}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground/40 shrink-0" />
            </div>
          ))}
          {/* CTA Drag-feel para nova partilha */}
          <button className="flex items-center justify-center gap-2 px-4 py-3.5 hover:bg-muted/30 transition-colors cursor-pointer group">
            <div className="w-8 h-8 rounded-lg border-2 border-dashed border-border group-hover:border-[var(--primary)]/50 flex items-center justify-center transition-colors shrink-0">
              <Gift className="w-4 h-4 text-muted-foreground group-hover:text-[var(--primary)] transition-colors" />
            </div>
            <span className="text-sm text-muted-foreground group-hover:text-[var(--primary)] transition-colors font-medium">
              Partilhar algo da minha casa
            </span>
          </button>
        </div>
      </section>
      </>
      )}

      {/* ── 8. Notícias ── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Newspaper className="w-4 h-4 text-[var(--primary)]" />
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Notícias e Campanhas</h2>
          </div>
          <button className="flex items-center gap-1 text-xs text-[var(--primary)] font-medium hover:underline">
            Ver todas <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar gap-3 pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-3">
          {noticias.map((n) => (
            <Card key={n.id} className="min-w-[272px] sm:min-w-0 snap-start shrink-0 overflow-hidden shadow-sm border border-border/70 hover:shadow-md transition-all cursor-pointer group rounded-xl">
              <div className="h-36 w-full overflow-hidden bg-muted">
                <img src={n.imagem} alt={n.titulo} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              </div>
              <CardContent className="p-4 space-y-1.5">
                <p className="font-semibold text-sm text-foreground leading-snug group-hover:text-[var(--primary)] transition-colors">{n.titulo}</p>
                <p className="text-xs text-muted-foreground line-clamp-2">{n.resumo}</p>
                <div className="flex items-center gap-3 pt-1 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{n.data}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{n.tempo}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

    </div>
  )
}
