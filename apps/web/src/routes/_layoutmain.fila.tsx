import { createFileRoute } from '@tanstack/react-router'
import { requireRole } from '@/lib/auth'
import { Card, CardContent } from '@/components/ui/card'
import { MapPin, Calendar, ChevronUp, ChevronDown, User, CheckCircle, Clock, AlertTriangle } from 'lucide-react'
import { useState } from 'react'

export const Route = createFileRoute('/_layoutmain/fila')({
  beforeLoad: requireRole(['operador', 'admin']),
  component: FilaPage,
})

type Prioridade = 'critica' | 'alta' | 'normal' | 'baixa'
type EstadoTarefa = 'pendente' | 'em_curso' | 'resolvido'

interface Tarefa {
  id: number
  titulo: string
  local: string
  tipo: string
  prioridade: Prioridade
  estado: EstadoTarefa
  data: string
  atribuido: string | null
}

const prioridadeConfig: Record<Prioridade, { label: string; color: string; order: number }> = {
  critica: { label: 'Crítica', color: '#f87171', order: 0 },
  alta:    { label: 'Alta',    color: '#fb923c', order: 1 },
  normal:  { label: 'Normal',  color: '#60a5fa', order: 2 },
  baixa:   { label: 'Baixa',   color: '#94a3b8', order: 3 },
}

const estadoConfig: Record<EstadoTarefa, { label: string; color: string; icon: React.ElementType }> = {
  pendente:  { label: 'Pendente',   color: '#fb923c',               icon: Clock         },
  em_curso:  { label: 'Em curso',   color: '#60a5fa',               icon: AlertTriangle },
  resolvido: { label: 'Resolvido',  color: 'oklch(0.55 0.18 150)', icon: CheckCircle   },
}

const mockTarefas: Tarefa[] = [
  { id: 1, titulo: 'Recolha urgente EP-001 — Rossio',        local: 'Praça do Rossio',        tipo: 'Recolha',    prioridade: 'critica', estado: 'pendente',  data: '22 Jan 2026', atribuido: null              },
  { id: 2, titulo: 'Reparação porta EP-008 — Peixinho',      local: 'Av. L. Peixinho, 90',    tipo: 'Manutenção', prioridade: 'alta',    estado: 'em_curso',  data: '21 Jan 2026', atribuido: 'Pedro Mendes'    },
  { id: 3, titulo: 'Recolha EP-005 — Beira-Mar',             local: 'Av. Beira-Mar',          tipo: 'Recolha',    prioridade: 'alta',    estado: 'pendente',  data: '22 Jan 2026', atribuido: null              },
  { id: 4, titulo: 'Limpeza depósito ilegal — R. das Flores',local: 'R. das Flores, 7',       tipo: 'Limpeza',    prioridade: 'normal',  estado: 'pendente',  data: '20 Jan 2026', atribuido: null              },
  { id: 5, titulo: 'Manutenção sensor EP-004 — Glória',      local: 'R. da Glória, 45',       tipo: 'Manutenção', prioridade: 'normal',  estado: 'em_curso',  data: '19 Jan 2026', atribuido: 'Sofia Lopes'     },
  { id: 6, titulo: 'Recolha EP-006 — Vera Cruz',             local: 'R. Vera Cruz, 33',       tipo: 'Recolha',    prioridade: 'alta',    estado: 'pendente',  data: '22 Jan 2026', atribuido: null              },
  { id: 7, titulo: 'Pintura ecoponto vandalizado — Beira-Mar',local: 'Av. Beira-Mar',         tipo: 'Manutenção', prioridade: 'baixa',   estado: 'pendente',  data: '18 Jan 2026', atribuido: null              },
  { id: 8, titulo: 'Recolha EP-002 — Mercado',               local: 'R. do Mercado, 12',      tipo: 'Recolha',    prioridade: 'alta',    estado: 'resolvido', data: '20 Jan 2026', atribuido: 'Pedro Mendes'    },
]

const operadores = ['Pedro Mendes', 'Sofia Lopes', 'Carlos Lima']

function FilaPage() {
  const [tarefas, setTarefas] = useState<Tarefa[]>(mockTarefas)
  const [filtroEstado, setFiltroEstado] = useState<EstadoTarefa | 'todos'>('todos')

  const lista = tarefas
    .filter(t => filtroEstado === 'todos' || t.estado === filtroEstado)
    .sort((a, b) => prioridadeConfig[a.prioridade].order - prioridadeConfig[b.prioridade].order)

  function moverPrioridade(id: number, dir: 'up' | 'down') {
    const ordens: Prioridade[] = ['critica', 'alta', 'normal', 'baixa']
    setTarefas(prev => prev.map(t => {
      if (t.id !== id) return t
      const idx = ordens.indexOf(t.prioridade)
      const novoIdx = dir === 'up' ? Math.max(0, idx - 1) : Math.min(ordens.length - 1, idx + 1)
      return { ...t, prioridade: ordens[novoIdx] }
    }))
  }

  function atribuir(id: number, op: string) {
    setTarefas(prev => prev.map(t => t.id === id ? { ...t, atribuido: op, estado: 'em_curso' } : t))
  }

  function resolver(id: number) {
    setTarefas(prev => prev.map(t => t.id === id ? { ...t, estado: 'resolvido' } : t))
  }

  const counts = {
    pendente:  tarefas.filter(t => t.estado === 'pendente').length,
    em_curso:  tarefas.filter(t => t.estado === 'em_curso').length,
    resolvido: tarefas.filter(t => t.estado === 'resolvido').length,
  }

  return (
    <div className="flex flex-col gap-8 pb-12">

      {/* Cabeçalho */}
      <div>
        <h1 className="text-xl font-bold text-foreground">Fila de Prioridades</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{tarefas.filter(t => t.estado !== 'resolvido').length} tarefas em aberto</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Pendentes', value: counts.pendente,  color: '#fb923c' },
          { label: 'Em curso',  value: counts.em_curso,  color: '#60a5fa' },
          { label: 'Resolvidas',value: counts.resolvido, color: 'oklch(0.55 0.18 150)' },
        ].map(s => (
          <Card key={s.label} className="border border-border/70 shadow-sm rounded-xl p-4">
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{s.label}</p>
            <p className="text-2xl font-bold mt-1" style={{ color: s.color }}>{s.value}</p>
          </Card>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        {([
          { label: 'Todas',    value: 'todos'     },
          { label: 'Pendente', value: 'pendente'  },
          { label: 'Em curso', value: 'em_curso'  },
          { label: 'Resolvida',value: 'resolvido' },
        ] as const).map(f => (
          <button key={f.value} onClick={() => setFiltroEstado(f.value)}
            className={`px-4 py-1.5 text-xs font-medium rounded-full transition-all ${filtroEstado === f.value ? 'bg-[var(--primary)] text-white shadow-sm' : 'bg-card border border-border text-muted-foreground hover:border-[var(--primary)]/40'}`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Lista */}
      <div className="flex flex-col gap-2">
        {lista.map((t) => {
          const prioCfg = prioridadeConfig[t.prioridade]
          const estCfg = estadoConfig[t.estado]
          const EstIcon = estCfg.icon
          return (
            <Card key={t.id} className="border border-border/70 shadow-sm rounded-xl hover:shadow-md transition-all">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {/* Botões de prioridade */}
                  <div className="flex flex-col items-center gap-0.5 shrink-0 mt-0.5">
                    <button onClick={() => moverPrioridade(t.id, 'up')} className="p-0.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: prioCfg.color }} />
                    <button onClick={() => moverPrioridade(t.id, 'down')} className="p-0.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Conteúdo */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-foreground leading-snug">{t.titulo}</p>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium" style={{ color: prioCfg.color, backgroundColor: `color-mix(in srgb, ${prioCfg.color} 12%, transparent)` }}>
                          {prioCfg.label}
                        </span>
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium" style={{ color: estCfg.color, backgroundColor: `color-mix(in srgb, ${estCfg.color} 12%, transparent)` }}>
                          <EstIcon className="w-3 h-3" />
                          {estCfg.label}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{t.local}</span>
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{t.data}</span>
                      <span className="bg-muted px-1.5 py-0.5 rounded text-[10px]">{t.tipo}</span>
                    </div>
                    {/* Ações */}
                    {t.estado !== 'resolvido' && (
                      <div className="flex items-center gap-3 mt-2.5">
                        {t.atribuido ? (
                          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                            <User className="w-3 h-3" /> {t.atribuido}
                          </span>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <User className="w-3 h-3 text-muted-foreground" />
                            <select
                              onChange={(e) => e.target.value && atribuir(t.id, e.target.value)}
                              defaultValue=""
                              className="text-xs border border-border rounded-lg px-2 py-0.5 bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-[var(--primary)]/50"
                            >
                              <option value="">Atribuir a...</option>
                              {operadores.map(op => <option key={op} value={op}>{op}</option>)}
                            </select>
                          </div>
                        )}
                        {t.estado === 'em_curso' && (
                          <button onClick={() => resolver(t.id)} className="flex items-center gap-1 text-xs font-medium text-emerald-600 hover:underline">
                            <CheckCircle className="w-3 h-3" /> Marcar resolvida
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
