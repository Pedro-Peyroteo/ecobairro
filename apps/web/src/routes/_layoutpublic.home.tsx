import { createFileRoute, Link } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { SplineScene } from '@/components/ui/splite'
import { Spotlight } from '@/components/ui/spotlight'
import {
  MapPin, TrendingUp, ChevronRight, Star, AlertTriangle, Recycle, Users, Leaf,
  FileText, CheckCircle, Package, Gift, Newspaper, Calendar, Clock,
  PlusCircle, Truck, Trophy, LogIn, UserPlus,
} from 'lucide-react'
import { useEffect, useRef, useState, type ElementType, type ReactNode } from 'react'
import { fetchJson } from '@/lib/http/fetch-json'
import { clientEnv } from '@/lib/env'
import { getAccessToken } from '@/lib/auth'
import type { HomeFeedResponse } from '@ecobairro/contracts'

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

const atalhos = [
  { label: 'Criar Reporte', icon: PlusCircle, to: '/reportes', search: { novo: '1' } as const },
  { label: 'Pedir Recolha', icon: Truck,       to: '/recolhas', search: { novo: '1' } as const },
  { label: 'Quiz Semanal',  icon: Trophy,      to: '/quiz',     search: undefined },
] as const

function ecoState(pct: number) {
  if (pct >= 80) return { label: 'Cheio', color: '#f87171', barColor: '#f87171cc' }
  if (pct >= 50) return { label: 'Moderado', color: '#fb923c', barColor: '#fb923ccc' }
  return { label: 'Disponível', color: 'oklch(0.55 0.18 150)', barColor: 'oklch(0.55 0.18 150 / 0.85)' }
}

const COMMUNITY_STATS = {
  cidadaos: 1200,
  reports: 340,
  resolvidos: 89, // percent — update manually as platform grows
} as const

const MOCK_NOTICIAS = [
  {
    id: 'n1',
    titulo: 'Campanha de Recolha de Resíduos Elétricos em Lisboa',
    resumo: 'A câmara municipal lança nova iniciativa para recolha gratuita de equipamentos elétricos e eletrónicos em todos os bairros da cidade durante o mês de junho.',
    gradient: 'linear-gradient(135deg, #134e3a 0%, #0a2e22 100%)',
    icon: Recycle,
    data: '14 Mai 2026',
    tempo_leitura: '3 min',
  },
  {
    id: 'n2',
    titulo: 'Novo Ecoponto Instalado na Rua da Palma — Porto',
    resumo: 'Moradores do Bonfim celebram a instalação de três novos ecopontos com separação de vidro, papel e embalagens, fruto de 240 reports enviados pela plataforma ecoBairro.',
    gradient: 'linear-gradient(135deg, #1a3a5c 0%, #0d1f38 100%)',
    icon: MapPin,
    data: '10 Mai 2026',
    tempo_leitura: '2 min',
  },
  {
    id: 'n3',
    titulo: 'Dia do Ambiente: Plantação de 500 Árvores nas Cidades',
    resumo: 'No próximo dia 5 de junho, voluntários e cidadãos são convidados a participar na maior ação de plantação urbana dos últimos anos. Inscrição gratuita via ecoBairro.',
    gradient: 'linear-gradient(135deg, #1e3a1e 0%, #0e200e 100%)',
    icon: Leaf,
    data: '5 Mai 2026',
    tempo_leitura: '4 min',
  },
  {
    id: 'n4',
    titulo: 'Taxa de Reciclagem em Braga Sobe 34% em 2025',
    resumo: 'Os dados do relatório anual confirmam que a participação cidadã em plataformas como o ecoBairro contribuiu diretamente para o aumento da taxa de reciclagem no município.',
    gradient: 'linear-gradient(135deg, #2e1f4a 0%, #180e2a 100%)',
    icon: TrendingUp,
    data: '28 Abr 2026',
    tempo_leitura: '5 min',
  },
]

/* ─── Guest hero — full-screen split with Spline 3D ─── */
const SPLINE_SCENE = 'https://prod.spline.design/kZDDjO5HlviOn7dI/scene.splinecode'

function GuestHero({ cidadaos }: { cidadaos: number }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  useEffect(() => {
    if (videoRef.current) videoRef.current.playbackRate = 0.5
  }, [])

  return (
    <div
      className="relative w-full h-svh overflow-hidden flex items-center"
      style={{ background: 'linear-gradient(135deg, #0a0e0d 0%, #0d1117 40%, #0d0f1a 100%)' }}
    >
      {/* Background video */}
      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        style={{ opacity: 0.38, zIndex: 0 }}
      >
        <source src="/videopromocional_.mp4" type="video/mp4" />
      </video>

      {/* Dark gradient overlay over video */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          zIndex: 1,
          background: 'linear-gradient(135deg, rgba(10,14,13,0.92) 0%, rgba(13,17,23,0.82) 40%, rgba(13,15,26,0.88) 100%)',
        }}
        aria-hidden="true"
      />

      {/* ecoBairro brand — top-left anchor */}
      <div className="absolute top-5 left-8 md:left-14 lg:left-20 xl:left-28 flex items-center gap-2 z-20" style={{ zIndex: 20 }}>
        <div className="w-8 h-8 rounded-lg bg-[var(--primary)]/20 border border-[var(--primary)]/30 flex items-center justify-center">
          <Leaf className="w-4 h-4 text-[var(--primary)]" />
        </div>
        <span className="text-white font-bold text-lg tracking-tight select-none">
          eco<span className="text-[var(--primary)]">Bairro</span>
        </span>
      </div>

      {/* Spotlight beam — green tinted */}
      <Spotlight
        className="-top-40 left-0 md:left-60 md:-top-20"
        fill="oklch(0.65 0.18 150)"
      />

      {/* Ambient green glow — top-left corner */}
      <div
        className="absolute -top-40 -left-40 w-[700px] h-[700px] pointer-events-none"
        style={{
          zIndex: 2,
          background:
            'radial-gradient(circle, color-mix(in srgb, var(--primary) 10%, transparent) 0%, transparent 55%)',
        }}
        aria-hidden="true"
      />

      {/* ── Left: text content ── */}
      <div className="relative flex flex-col gap-7 flex-1 px-8 md:px-14 lg:px-20 xl:px-28" style={{ zIndex: 10 }}>
        {/* Animated badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--primary)]/30 bg-[var(--primary)]/10 px-4 py-1.5 w-fit">
          <span
            className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] animate-pulse motion-reduce:animate-none"
            aria-hidden="true"
          />
          <span className="text-xs font-semibold tracking-wide text-[var(--primary)]">
            Plataforma de Cidadania Ativa
          </span>
        </div>

        {/* Headline */}
        <div className="space-y-4">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-black leading-[1.04] tracking-tight text-white">
            O teu bairro<br />
            mais{' '}
            <span
              className="text-[var(--primary)]"
              style={{ textShadow: '0 0 40px color-mix(in srgb, var(--primary) 50%, transparent)' }}
            >
              sustentável
            </span>
          </h1>
          <p className="text-base text-white/55 max-w-sm leading-relaxed">
            Reporta problemas, partilha recursos e mede o impacto real da tua comunidade.
          </p>
        </div>

        {/* CTAs */}
        <div className="flex items-center gap-3 flex-wrap">
          <Button
            asChild
            className="gap-2 bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white min-h-[44px] px-7 font-semibold"
            style={{ boxShadow: '0 0 28px color-mix(in srgb, var(--primary) 45%, transparent)' }}
          >
            <Link to="/login">
              <LogIn className="w-4 h-4" />
              Entrar na plataforma
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="gap-2 min-h-[44px] px-7 border-white/20 text-white/80 hover:bg-white/10 hover:text-white bg-transparent font-semibold"
          >
            <Link to="/register">
              <UserPlus className="w-4 h-4" />
              Registar
            </Link>
          </Button>
        </div>

        {/* Stats pills */}
        <div className="flex items-center gap-3 flex-wrap">
          {[
            { value: cidadaos.toLocaleString('pt-PT'), label: 'Cidadãos' },
            { value: COMMUNITY_STATS.reports.toLocaleString('pt-PT'), label: 'Reports' },
            { value: `${COMMUNITY_STATS.resolvidos}%`, label: 'Resolvidos' },
          ].map((s) => (
            <div
              key={s.label}
              className="flex flex-col items-center px-5 py-2.5 rounded-full bg-white/[0.06] border border-white/10"
            >
              <span className="text-lg font-black text-white leading-none">{s.value}</span>
              <span className="text-[10px] text-white/40 mt-0.5 uppercase tracking-wide">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right: Spline 3D scene ── */}
      <div className="hidden md:block flex-1 h-full relative" style={{ zIndex: 10 }}>
        <SplineScene scene={SPLINE_SCENE} className="w-full h-full" />
      </div>

      {/* Bottom fade into next section */}
      <div
        className="absolute bottom-0 left-0 right-0 h-28 pointer-events-none"
        style={{ zIndex: 15, background: 'linear-gradient(transparent, var(--background))' }}
        aria-hidden="true"
      />
    </div>
  )
}

const GUEST_FEATURES = [
  {
    icon: FileText,
    title: 'Reportes',
    desc: 'Envia problemas com foto e localização diretamente para a câmara municipal.',
  },
  {
    icon: MapPin,
    title: 'Ecopontos',
    desc: 'Mapa de pontos de reciclagem com disponibilidade em tempo real.',
  },
  {
    icon: TrendingUp,
    title: 'Impacto',
    desc: 'Acompanha a tua contribuição ambiental e compara com os vizinhos.',
  },
] as const

function GuestFeatures() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {GUEST_FEATURES.map((f) => {
        const Icon = f.icon
        return (
          <div
            key={f.title}
            className="flex items-start gap-4 rounded-xl bg-card border border-border/70 p-5 shadow-sm"
          >
            <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center shrink-0">
              <Icon className="w-5 h-5 text-[var(--primary)]" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">{f.title}</p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{f.desc}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

const AVATAR_COLORS = [
  'bg-[var(--primary)]/60',
  'bg-[var(--primary)]/40',
  'bg-blue-400/60',
  'bg-purple-400/60',
] as const

function GuestTrustBar({ cidadaos }: { cidadaos: number }) {
  return (
    <div className="flex items-center gap-4 rounded-xl bg-card border border-border/70 px-5 py-4 shadow-sm">
      {/* Stacked avatars */}
      <div className="flex shrink-0" aria-hidden="true">
        {AVATAR_COLORS.map((cls, i) => (
          <div
            key={i}
            className={`w-8 h-8 rounded-full border-2 border-card shrink-0 ${cls}${i > 0 ? ' -ml-2' : ''}`}
          />
        ))}
      </div>
      {/* Text */}
      <p className="text-sm text-muted-foreground flex-1 min-w-0">
        Juntos com{' '}
        <span className="font-bold text-foreground">
          {cidadaos.toLocaleString('pt-PT')} vizinhos
        </span>{' '}
        ativos no ecoBairro
      </p>
      {/* Stars */}
      <span
        className="text-yellow-400 text-base shrink-0 select-none"
        aria-label="Classificação 5 estrelas"
      >
        ★★★★★
      </span>
    </div>
  )
}

/* ─── Section header helper ─── */
function SectionHeader({
  icon: Icon,
  title,
  action,
}: {
  icon: ElementType
  title: string
  action?: ReactNode
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center shrink-0">
          <Icon className="w-3.5 h-3.5 text-[var(--primary)]" />
        </div>
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      </div>
      {action}
    </div>
  )
}

/* ─── Organic blob hero decoration ─── */
function HeroBlob() {
  return (
    <div className="absolute right-0 top-0 h-full w-52 pointer-events-none overflow-hidden" aria-hidden="true">
      <svg viewBox="0 0 208 200" className="absolute right-0 top-0 h-full w-full text-[var(--primary)]" fill="none">
        <path d="M170 -30 Q230 50 190 115 Q150 180 90 162 Q30 144 48 82 Q66 20 130 -5 Q155 -18 170 -30Z" fill="currentColor" opacity="0.08" />
        <path d="M200 30 Q240 90 210 145 Q180 200 140 188 Q100 176 112 136 Q124 96 162 76 Q188 62 200 30Z" fill="currentColor" opacity="0.05" />
        <circle cx="195" cy="22" r="50" fill="currentColor" opacity="0.04" />
      </svg>
    </div>
  )
}

/* ─── Página ─── */
function HomePage() {
  const token = getAccessToken()
  const greeting = getGreeting()
  const [feed, setFeed] = useState<HomeFeedResponse | null>(null)
  const isGuest = !token || !feed?.viewer || feed.viewer.role !== 'CIDADAO'
  const userDisplayName = feed?.viewer?.nome ?? feed?.viewer?.email ?? 'ecoBairro'
  const firstName = isGuest ? 'ecoBairro' : userDisplayName.split(' ')[0]

  useEffect(() => {
    const headers: Record<string, string> = {}
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }

    const load = async () => {
      try {
        const data = await fetchJson<HomeFeedResponse>('/v1/home', {
          baseUrl: clientEnv.apiBaseUrl,
          headers,
        })
        setFeed(data)
      } catch {
        setFeed(null)
      }
    }

    void load()
  }, [token])

  const gamification = feed?.gamification ?? {
    nivel: 'Reciclador',
    pontos: 0,
    pontos_proximo: 500,
  }
  const pontosRestantes = Math.max(0, gamification.pontos_proximo - gamification.pontos)
  const progressoGamificacao = Math.round(
    (gamification.pontos / Math.max(gamification.pontos_proximo, 1)) * 100,
  )

  const reportStats = !isGuest && feed
    ? {
        ativos: feed.reports.ativos,
        resolvidos: feed.reports.resolvidos,
        total: feed.reports.total,
        progresso: feed.reports.progresso,
        proximoNivel: feed.reports.proximo_nivel,
      }
    : {
        ativos: 0,
        resolvidos: 0,
        total: 0,
        progresso: 0,
        proximoNivel: 'Reciclador Avançado',
      }

  const ecopontos = feed?.ecopontos ?? []
  const partilhas = feed?.partilhas ?? []
  const noticias = feed?.noticias ?? []
  const alertaCritico = feed?.alerta
  const impacto = feed?.impacto
  const cidadaosCount = feed?.impacto?.comunidade_pax || COMMUNITY_STATS.cidadaos

  // Guest: full-bleed hero then contained sections
  if (isGuest) {
    return (
      <>
        <GuestHero cidadaos={cidadaosCount} />
        <div className="w-full max-w-[1440px] mx-auto px-6 pb-16 flex flex-col gap-8">
          <GuestFeatures />
          <GuestTrustBar cidadaos={cidadaosCount} />
          <section className="space-y-4">
            <SectionHeader
              icon={Newspaper}
              title="Notícias e Campanhas"
              action={
                <Link
                  to="/login"
                  className="flex items-center gap-1 text-xs text-[var(--primary)] font-medium hover:underline"
                >
                  Ver todas <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              }
            />
            <div className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar gap-3 pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-4">
              {MOCK_NOTICIAS.map((n) => {
                const Icon = n.icon
                return (
                  <Link
                    key={n.id}
                    to="/login"
                    className="min-w-[272px] sm:min-w-0 snap-start shrink-0 group"
                  >
                    <Card className="overflow-hidden shadow-sm border border-border/70 hover:border-[var(--primary)]/40 hover:shadow-md transition-all rounded-xl h-full">
                      {/* Gradient banner instead of image */}
                      <div
                        className="h-28 w-full flex items-center justify-center relative overflow-hidden"
                        style={{ background: n.gradient }}
                      >
                        <Icon className="w-10 h-10 text-white/20 absolute" />
                        <div className="relative z-10 text-center px-4">
                          <Icon className="w-6 h-6 text-white/70 mx-auto mb-1" />
                        </div>
                      </div>
                      <CardContent className="p-4 space-y-1.5">
                        <p className="font-semibold text-sm text-foreground leading-snug group-hover:text-[var(--primary)] transition-colors">
                          {n.titulo}
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-2">{n.resumo}</p>
                        <div className="flex items-center gap-3 pt-1 text-[11px] text-muted-foreground">
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{n.data}</span>
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{n.tempo_leitura}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                )
              })}
            </div>
          </section>
        </div>
      </>
    )
  }

  return (
    <div className="flex flex-col gap-8 pb-12 max-w-2xl mx-auto lg:max-w-none">

      {/* ── Auth: banner com gamificação ── */}
      <Card
        className="relative overflow-hidden border-none shadow-sm"
        style={{ background: 'linear-gradient(135deg, color-mix(in oklch, var(--primary) 10%, var(--card)) 0%, var(--card) 65%)' }}
      >
        <HeroBlob />
        <CardContent className="p-6 relative z-10 flex flex-col sm:flex-row sm:items-center gap-5 justify-between">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{greeting} 👋</p>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Olá, <span className="text-[var(--primary)]">{firstName}</span>!
            </h1>
            <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
              Aqui está o resumo da sua atividade no ecoBairro.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:items-end min-w-[200px]">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-[var(--primary)]/10 rounded-full px-2.5 py-1">
                <Star className="w-3 h-3 text-[var(--primary)]" fill="currentColor" />
                <span className="text-xs font-semibold text-[var(--primary)]">{gamification.nivel}</span>
              </div>
              <span className="text-xs text-muted-foreground">
                <Counter to={gamification.pontos} /> pts
              </span>
            </div>
            <Progress value={progressoGamificacao} className="h-2 w-full [&>div]:bg-[var(--primary)]" />
            <p className="text-[11px] text-muted-foreground">
              Faltam <span className="font-semibold text-foreground">{pontosRestantes} pts</span> para{' '}
              <span className="font-medium">{reportStats.proximoNivel}</span>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ── Auth sections ── */}
      <>
        {/* ── 2. Atalhos Rápidos ── */}
          <div className="grid grid-cols-3 gap-3">
            {atalhos.map((a) => {
              const Icon = a.icon
              return (
                <Link
                  key={a.label}
                  to={a.to}
                  search={a.search}
                  className="flex flex-col items-center gap-3 p-5 rounded-xl bg-card border border-border hover:border-[var(--primary)]/40 hover:shadow-md transition-all active:scale-[0.97] cursor-pointer"
                >
                  <div className="w-12 h-12 flex items-center justify-center rounded-2xl bg-[var(--primary)]/10">
                    <Icon className="w-5 h-5 text-[var(--primary)]" />
                  </div>
                  <span className="text-xs font-semibold text-foreground leading-tight text-center">{a.label}</span>
                </Link>
              )
            })}
          </div>

          {/* ── 3. Ecopontos Favoritos ── */}
          <section className="space-y-4">
            <SectionHeader
              icon={MapPin}
              title="Ecopontos Favoritos"
              action={
                <button className="flex items-center gap-1 text-xs text-[var(--primary)] font-medium hover:underline cursor-pointer">
                  Ver mapa <ChevronRight className="w-3.5 h-3.5" />
                </button>
              }
            />
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
                          <img src={eco.map_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
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

          {/* ── 4. Alerta ecoponto crítico ── */}
          {alertaCritico && (
            <div className="flex items-center gap-3 rounded-xl border border-amber-400/30 bg-amber-50 dark:bg-amber-950/20 px-4 py-3.5">
              <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{alertaCritico.nome}</p>
                <p className="text-xs text-muted-foreground">{alertaCritico.ocupacao}% ocupado — evite depositar resíduos por agora</p>
              </div>
              <Badge variant="outline" className="text-[10px] shrink-0 border-amber-400/50 text-amber-600 bg-amber-50 dark:bg-amber-900/20">
                Atenção
              </Badge>
            </div>
          )}

          {/* ── 5. Impacto pessoal ── */}
          <section className="space-y-4">
            <SectionHeader icon={TrendingUp} title="O seu impacto este ano" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  label: 'Reciclagem',
                  value: impacto?.reciclagem_kg ?? 0,
                  unit: 'kg',
                  icon: Recycle,
                  color: 'oklch(0.55 0.18 150)',
                  desc: 'a partir dos seus reports resolvidos',
                },
                {
                  label: 'Comunidade',
                  value: impacto?.comunidade_pax ?? 0,
                  unit: 'pax',
                  icon: Users,
                  color: '#60a5fa',
                  desc: 'cidadãos registados na plataforma',
                },
                {
                  label: 'Ecossistema',
                  value: impacto?.arvores_equivalentes ?? 0,
                  unit: 'árvores',
                  icon: Leaf,
                  color: 'oklch(0.55 0.18 150)',
                  desc: 'equivalente da sua atividade',
                },
              ].map((item) => {
                const Icon = item.icon
                return (
                  <Card key={item.label} className="border border-border/70 shadow-sm rounded-xl overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{item.label}</CardTitle>
                      <div
                        className="flex items-center justify-center w-8 h-8 rounded-lg"
                        style={{ backgroundColor: `color-mix(in srgb, ${item.color} 12%, transparent)` }}
                      >
                        <Icon className="w-4 h-4" style={{ color: item.color }} />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-foreground">
                        <Counter to={item.value} />{' '}
                        <span className="text-sm font-medium text-muted-foreground">{item.unit}</span>
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
            <SectionHeader icon={FileText} title="Histórico de Reports" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { label: 'Ativos',     value: reportStats.ativos,     icon: TrendingUp,  color: '#fb923c' },
                { label: 'Resolvidos', value: reportStats.resolvidos, icon: CheckCircle, color: 'oklch(0.55 0.18 150)' },
                { label: 'Total',      value: reportStats.total,      icon: Package,     color: '#8A93A4' },
              ].map((stat) => {
                const Icon = stat.icon
                return (
                  <Card key={stat.label} className="border border-border/70 shadow-sm rounded-xl overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{stat.label}</CardTitle>
                      <div
                        className="flex items-center justify-center w-8 h-8 rounded-lg"
                        style={{ backgroundColor: `color-mix(in srgb, ${stat.color} 12%, transparent)` }}
                      >
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
              <Progress value={reportStats.progresso} className="h-2 [&>div]:bg-[var(--primary)]" />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{reportStats.progresso}% para subir de nível</span>
                <span>
                  Próximo nível:{' '}
                  <span className="font-medium text-foreground">{reportStats.proximoNivel}</span>
                </span>
              </div>
            </div>
          </section>

          {/* ── 7. Partilhas Locais ── */}
          <section className="space-y-4">
            <SectionHeader
              icon={Package}
              title="Partilhas na sua zona"
              action={
                <Link
                  to="/partilhas"
                  className="flex items-center gap-1 text-xs text-[var(--primary)] font-medium hover:underline"
                >
                  Ver todas <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              }
            />
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

      {/* ── 8. Notícias e Campanhas ── */}
      <section className="space-y-4">
        <SectionHeader
          icon={Newspaper}
          title="Notícias e Campanhas"
          action={
            <Link
              to="/noticias"
              className="flex items-center gap-1 text-xs text-[var(--primary)] font-medium hover:underline"
            >
              Ver todas <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          }
        />
        <div className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar gap-3 pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-3">
          {noticias.map((n) => (
            <Card
              key={n.id}
              className="min-w-[272px] sm:min-w-0 snap-start shrink-0 overflow-hidden shadow-sm border border-border/70 hover:shadow-md transition-all cursor-pointer group rounded-xl"
            >
              <div className="h-36 w-full overflow-hidden bg-muted">
                <img
                  src={n.imagem_url}
                  alt={n.titulo}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <CardContent className="p-4 space-y-1.5">
                <p className="font-semibold text-sm text-foreground leading-snug group-hover:text-[var(--primary)] transition-colors">
                  {n.titulo}
                </p>
                <p className="text-xs text-muted-foreground line-clamp-2">{n.resumo}</p>
                <div className="flex items-center gap-3 pt-1 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{n.data}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{n.tempo_leitura}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

    </div>
  )
}
