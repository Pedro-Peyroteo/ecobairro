import { createFileRoute } from '@tanstack/react-router'
import { requireRole } from '@/lib/auth'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Megaphone, PlusCircle, Search, Calendar, Eye, Archive, Pencil, X } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

export const Route = createFileRoute('/_layoutmain/campanhas')({
  beforeLoad: requireRole(['tecnico_autarquia']),
  component: CampanhasPage,
})

type Estado = 'rascunho' | 'publicada' | 'expirada'

interface Mensagem {
  id: number
  titulo: string
  corpo: string
  estado: Estado
  dataCriacao: string
  dataValidade: string
  autor: string
}

const estadoConfig: Record<Estado, { label: string; color: string; bg: string }> = {
  rascunho:  { label: 'Rascunho',  color: '#94a3b8', bg: 'bg-slate-100 dark:bg-slate-800'  },
  publicada: { label: 'Publicada', color: 'oklch(0.55 0.18 150)', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
  expirada:  { label: 'Expirada',  color: '#94a3b8', bg: 'bg-slate-50 dark:bg-slate-900'   },
}

const mockMensagens: Mensagem[] = [
  { id: 1, titulo: 'Recolha especial de REEE — Janeiro 2026', corpo: 'No dia 15 de Janeiro haverá uma recolha especial de resíduos elétricos e eletrónicos em todos os bairros do concelho. Deixe os seus equipamentos junto ao ecoponto habitual até às 9h.', estado: 'publicada', dataCriacao: '02 Jan 2026', dataValidade: '16 Jan 2026', autor: 'Câmara de Aveiro' },
  { id: 2, titulo: 'Campanha "Aveiro Recicla Mais" — Fevereiro', corpo: 'Junte-se à campanha de reciclagem do mês de Fevereiro. Cada tonelada de papel reciclado poupa 17 árvores! Participe e ganhe pontos ecoBairro.', estado: 'publicada', dataCriacao: '28 Jan 2026', dataValidade: '28 Fev 2026', autor: 'Câmara de Aveiro' },
  { id: 3, titulo: 'Manutenção ecopontos Zona Norte — Aviso', corpo: 'Informamos que os ecopontos da Zona Norte estarão temporariamente sem serviço nos dias 10 e 11 de Janeiro para manutenção programada.', estado: 'expirada', dataCriacao: '08 Jan 2026', dataValidade: '11 Jan 2026', autor: 'Câmara de Aveiro' },
  { id: 4, titulo: 'Novo horário de recolha — Bairro do Liceu', corpo: 'A partir de Fevereiro, a recolha de resíduos no Bairro do Liceu passa para as terças e sextas-feiras, entre as 22h e as 2h. Pedimos que coloque os contentores no passeio após as 21h.', estado: 'rascunho', dataCriacao: '25 Jan 2026', dataValidade: '28 Fev 2026', autor: 'Câmara de Aveiro' },
  { id: 5, titulo: 'Obras na Av. Central — Alteração de ecopontos', corpo: 'Devido às obras em curso na Av. Central, os ecopontos foram temporariamente relocalizados para a Rua de Viseu, em frente ao nº 45.', estado: 'publicada', dataCriacao: '20 Jan 2026', dataValidade: '20 Mar 2026', autor: 'Câmara de Aveiro' },
]

const filtros: { label: string; value: Estado | 'todas' }[] = [
  { label: 'Todas',     value: 'todas'     },
  { label: 'Publicada', value: 'publicada' },
  { label: 'Rascunho',  value: 'rascunho'  },
  { label: 'Expirada',  value: 'expirada'  },
]

const mensagemSchema = z.object({
  titulo: z.string().min(3, 'Título obrigatório (mín. 3 caracteres)'),
  corpo: z.string().min(10, 'Mensagem obrigatória (mín. 10 caracteres)'),
  dataValidade: z.string().min(1, 'Data de validade obrigatória'),
})

type MensagemForm = z.infer<typeof mensagemSchema>

function CampanhasPage() {
  const [filtro, setFiltro] = useState<Estado | 'todas'>('todas')
  const [pesquisa, setPesquisa] = useState('')
  const [mensagens, setMensagens] = useState<Mensagem[]>(mockMensagens)
  const [modalAberto, setModalAberto] = useState(false)
  const [editando, setEditando] = useState<Mensagem | null>(null)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<MensagemForm>({
    resolver: zodResolver(mensagemSchema),
  })

  const lista = mensagens.filter((m) => {
    const matchFiltro = filtro === 'todas' || m.estado === filtro
    const matchSearch = pesquisa === '' || m.titulo.toLowerCase().includes(pesquisa.toLowerCase())
    return matchFiltro && matchSearch
  })

  const contagens = {
    publicada: mensagens.filter(m => m.estado === 'publicada').length,
    rascunho:  mensagens.filter(m => m.estado === 'rascunho').length,
    expirada:  mensagens.filter(m => m.estado === 'expirada').length,
  }

  function abrirNova() {
    setEditando(null)
    reset({ titulo: '', corpo: '', dataValidade: '' })
    setModalAberto(true)
  }

  function abrirEditar(m: Mensagem) {
    setEditando(m)
    reset({ titulo: m.titulo, corpo: m.corpo, dataValidade: m.dataValidade })
    setModalAberto(true)
  }

  function onSubmit(data: MensagemForm) {
    if (editando) {
      setMensagens(prev => prev.map(m => m.id === editando.id ? { ...m, ...data } : m))
    } else {
      const nova: Mensagem = {
        id: Date.now(),
        titulo: data.titulo,
        corpo: data.corpo,
        estado: 'rascunho',
        dataCriacao: new Date().toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' }),
        dataValidade: data.dataValidade,
        autor: 'Câmara de Aveiro',
      }
      setMensagens(prev => [nova, ...prev])
    }
    setModalAberto(false)
  }

  function publicar(id: number) {
    setMensagens(prev => prev.map(m => m.id === id ? { ...m, estado: 'publicada' } : m))
  }

  function arquivar(id: number) {
    setMensagens(prev => prev.map(m => m.id === id ? { ...m, estado: 'expirada' } : m))
  }

  return (
    <div className="flex flex-col gap-8 pb-12">

      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">Mensagens Institucionais</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{mensagens.length} mensagens no total</p>
        </div>
        <Button size="sm" className="gap-2 bg-[var(--primary)] hover:opacity-90 transition-opacity self-start sm:self-auto" onClick={abrirNova}>
          <PlusCircle className="w-4 h-4" />
          Nova Mensagem
        </Button>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Publicadas', value: contagens.publicada, color: 'oklch(0.55 0.18 150)' },
          { label: 'Rascunhos',  value: contagens.rascunho,  color: '#60a5fa' },
          { label: 'Expiradas',  value: contagens.expirada,  color: '#94a3b8' },
        ].map((s) => (
          <Card key={s.label} className="border border-border/70 shadow-sm rounded-xl">
            <CardContent className="pt-4 pb-3">
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{s.label}</p>
              <p className="text-2xl font-bold mt-1" style={{ color: s.color }}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filtros + Pesquisa */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="flex gap-2 flex-wrap">
          {filtros.map((f) => (
            <button
              key={f.value}
              onClick={() => setFiltro(f.value)}
              className={`px-4 py-1.5 text-xs font-medium rounded-full transition-all ${
                filtro === f.value
                  ? 'bg-[var(--primary)] text-white shadow-sm'
                  : 'bg-card border border-border text-muted-foreground hover:border-[var(--primary)]/40 hover:text-foreground'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="relative sm:ml-auto w-full sm:w-56">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Pesquisar..."
            value={pesquisa}
            onChange={(e) => setPesquisa(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-sm rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)]/50 transition-all"
          />
        </div>
      </div>

      {/* Lista */}
      {lista.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
            <Megaphone className="w-5 h-5 text-muted-foreground" />
          </div>
          <p className="font-semibold text-foreground">Sem mensagens</p>
          <p className="text-sm text-muted-foreground">Crie uma nova mensagem institucional.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {lista.map((m) => {
            const cfg = estadoConfig[m.estado]
            return (
              <Card key={m.id} className="border border-border/70 shadow-sm rounded-xl hover:shadow-md transition-all">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg shrink-0 flex items-center justify-center ${cfg.bg}`}>
                      <Megaphone className="w-4 h-4" style={{ color: cfg.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-foreground leading-snug">{m.titulo}</p>
                        <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-medium" style={{ color: cfg.color, backgroundColor: `color-mix(in srgb, ${cfg.color} 12%, transparent)` }}>
                          {cfg.label}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{m.corpo}</p>
                      <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Criada {m.dataCriacao}</span>
                        <span className="flex items-center gap-1"><Eye className="w-3 h-3" />Válida até {m.dataValidade}</span>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <button onClick={() => abrirEditar(m)} className="flex items-center gap-1 text-xs font-medium text-[var(--primary)] hover:underline">
                          <Pencil className="w-3 h-3" /> Editar
                        </button>
                        {m.estado === 'rascunho' && (
                          <button onClick={() => publicar(m.id)} className="flex items-center gap-1 text-xs font-medium text-emerald-600 hover:underline">
                            <Eye className="w-3 h-3" /> Publicar
                          </button>
                        )}
                        {m.estado === 'publicada' && (
                          <button onClick={() => arquivar(m.id)} className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:underline">
                            <Archive className="w-3 h-3" /> Arquivar
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Modal criar/editar */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setModalAberto(false)} />
          <div className="relative z-10 w-full max-w-lg bg-card rounded-2xl shadow-2xl border border-border p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-foreground">{editando ? 'Editar Mensagem' : 'Nova Mensagem'}</h2>
              <button onClick={() => setModalAberto(false)} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Título</label>
                <input
                  type="text"
                  {...register('titulo')}
                  placeholder="Título da mensagem..."
                  className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)]/50"
                />
                {errors.titulo && <p className="text-xs text-destructive mt-1">{errors.titulo.message}</p>}
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Mensagem</label>
                <textarea
                  {...register('corpo')}
                  placeholder="Escreva a mensagem para os cidadãos..."
                  rows={4}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)]/50 resize-none"
                />
                {errors.corpo && <p className="text-xs text-destructive mt-1">{errors.corpo.message}</p>}
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Data de validade</label>
                <input
                  type="date"
                  {...register('dataValidade')}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)]/50"
                />
                {errors.dataValidade && <p className="text-xs text-destructive mt-1">{errors.dataValidade.message}</p>}
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" size="sm" onClick={() => setModalAberto(false)}>Cancelar</Button>
                <Button type="submit" size="sm" className="bg-[var(--primary)] hover:opacity-90 transition-opacity">
                  {editando ? 'Guardar' : 'Criar Rascunho'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
