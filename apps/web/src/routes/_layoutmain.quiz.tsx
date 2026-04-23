import { createFileRoute } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { 
  Trophy, Flame, Target, Medal, 
  Zap, Sparkles, 
  Timer, Users
} from 'lucide-react'
import { useState } from 'react'

export const Route = createFileRoute('/_layoutmain/quiz')({
  component: QuizPage,
})

import { userStats, ranking, conquistas } from '@/mocks/quizMocks'

function QuizPage() {
  const [, setIsQuizStarting] = useState(false)

  return (
    <div className="flex flex-col gap-10 pb-12">
      
      {/* ── 1. Hero: Desafio Semanal ── */}
      <Card className="relative overflow-hidden border border-border/70 shadow-sm bg-card rounded-xl">
        {/* Subtil acento de cor à esquerda */}
        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[var(--primary)]" />
        
        <CardContent className="p-6 sm:p-8 relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-4 max-w-lg text-center md:text-left">
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--primary)]/10 w-fit mx-auto md:mx-0">
                <Sparkles className="w-3.5 h-3.5 text-[var(--primary)]" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--primary)]">Desafio da Semana</span>
              </div>
              <div className="space-y-1">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                  Herói da Reciclagem 2026
                </h1>
                <p className="text-muted-foreground text-sm leading-relaxed max-w-sm">
                  Teste o seu conhecimento ambiental e ganhe pontos extra para o seu nível.
                </p>
              </div>
              <div className="flex items-center justify-center md:justify-start gap-8 pt-1">
                <div className="flex flex-col">
                  <span className="text-xl font-bold text-foreground">+50</span>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">Pontos XP</span>
                </div>
                <div className="h-8 w-px bg-border" />
                <div className="flex flex-col">
                  <span className="text-xl font-bold text-foreground flex items-center gap-2">
                     <Timer className="w-4 h-4 text-[var(--primary)]" /> 2:00
                  </span>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">Tempo Limite</span>
                </div>
              </div>
              <Button 
                onClick={() => setIsQuizStarting(true)}
                className="gap-2 bg-[var(--primary)] hover:opacity-90 transition-opacity rounded-xl hover:scale-[1.02] active:scale-[0.98] mt-2 w-full sm:w-auto"
              >
                Começar Agora
              </Button>
            </div>

            <div className="relative shrink-0 flex items-center justify-center p-4">
               <div className="relative z-10 animate-in zoom-in duration-700">
                  <div className="p-6 rounded-2xl bg-muted/30 border border-border/50 shadow-inner">
                    <Trophy className="w-16 h-16 text-amber-500/80" />
                  </div>
               </div>
               {/* Decorative background circle */}
               <div className="absolute inset-0 bg-[var(--primary)]/5 rounded-full blur-3xl" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── 2. Cards de Estatísticas Profissionais ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: 'Os Meus Pontos', value: userStats.pontos, icon: Zap, color: '#fb923c', desc: 'Saldo total acumulado' },
          { label: 'Dias Seguidos', value: userStats.streak, icon: Flame, color: '#f87171', desc: 'Atividade consecutiva' },
          { label: 'Ranking Bairro', value: `#${userStats.posicao}`, icon: Users, color: '#60a5fa', desc: 'Lugar na sua zona' },
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
                <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{stat.desc}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* ── 3. Ranking de Vizinhos ── */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-[var(--primary)]" />
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Top Vizinhos</h2>
          </div>
          <Card className="border border-border/70 shadow-sm rounded-xl overflow-hidden bg-card">
            <div className="flex flex-col divide-y divide-border">
              {ranking.map((r, i) => (
                <div key={r.id} className={`flex items-center gap-4 p-4 transition-colors ${r.isMe ? 'bg-[var(--primary)]/5' : 'hover:bg-muted/30'}`}>
                  <div className="flex items-center justify-center w-6 text-xs font-bold text-muted-foreground">
                    {i === 0 && <Medal className="w-5 h-5 text-amber-500" />}
                    {i === 1 && <Medal className="w-5 h-5 text-slate-400" />}
                    {i === 2 && <Medal className="w-5 h-5 text-amber-700" />}
                    {i > 2 && `${i + 1}º`}
                  </div>
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center font-bold text-xs ring-2 ring-background shrink-0">
                    {r.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold truncate ${r.isMe ? 'text-[var(--primary)]' : 'text-foreground'}`}>
                      {r.nome} {r.isMe && '(Você)'}
                    </p>
                    <p className="text-xs text-muted-foreground">{r.pontos.toLocaleString()} pts</p>
                  </div>
                  {i === 0 && <Badge className="bg-amber-100 text-amber-700 border-none text-[9px] font-black uppercase">Elite</Badge>}
                </div>
              ))}
            </div>
            <button className="w-full py-3 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors border-t border-border bg-muted/20">
              Ver Ranking Completo
            </button>
          </Card>
        </div>

        {/* ── 4. Conquistas e Progresso de Nível ── */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Nível Atual */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-[var(--primary)]" />
                <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">O Seu Progresso</h2>
              </div>
              <span className="text-xs font-bold text-[var(--primary)] uppercase tracking-wider">{userStats.nivel}</span>
            </div>
            <Card className="border border-border/70 shadow-sm rounded-xl p-5 bg-card">
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground pr-4">Faltam <span className="text-foreground font-bold">450 pts</span> para tornar-se <span className="text-[var(--primary)] font-bold">{userStats.proximoNivel}</span></p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-foreground">{userStats.xp}%</p>
                  </div>
                </div>
                <Progress value={userStats.xp} className="h-3 [&>div]:bg-gradient-to-r [&>div]:from-[var(--primary)] [&>div]:to-emerald-400" />
                <div className="flex justify-between text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                  <span>Iniciante</span>
                  <span>Eco-Guerreiro</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Medals Grid */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Medal className="w-4 h-4 text-[var(--primary)]" />
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Conquistas Desbloqueadas</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {conquistas.map((c) => {
                const Icon = c.icon
                return (
                  <Card 
                    key={c.id} 
                    className={`group transition-all duration-300 border border-border/70 shadow-sm rounded-xl ${
                      c.unlocked 
                        ? 'bg-card hover:shadow-md cursor-pointer hover:border-[var(--primary)]/30' 
                        : 'bg-muted/30 opacity-60'
                    }`}
                  >
                    <CardContent className="p-4 flex flex-col items-center text-center gap-3">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${c.unlocked ? c.bg : 'bg-muted'}`}>
                        <Icon className={`w-6 h-6 ${c.unlocked ? c.color : 'text-muted-foreground'}`} />
                      </div>
                      <div className="space-y-1">
                        <p className={`text-xs font-bold ${c.unlocked ? 'text-foreground' : 'text-muted-foreground'}`}>{c.nome}</p>
                        <p className="text-[9px] leading-tight text-muted-foreground">{c.desc}</p>
                      </div>
                      {!c.unlocked && <Badge variant="secondary" className="text-[8px] h-4">Bloqueado</Badge>}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>

        </div>
      </div>

    </div>
  )
}
