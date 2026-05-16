import { createFileRoute, useSearch } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Truck, PlusCircle, Clock, Calendar, CheckCircle,
  ChevronRight, Info, MapPin, Package, AlertTriangle, Loader2, X
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { PaginationBar } from '@/components/ui/pagination-bar'
import { z } from 'zod'
import { fetchJson, HttpError } from '@/lib/http/fetch-json'
import { clientEnv } from '@/lib/env'
import { getAccessToken } from '@/lib/auth'
import { getApiErrorMessage } from '@/lib/http/api-error'
import type { ListRecolhasResponse, RecolhaRecord, CreateRecolhaRequest, CreateRecolhaResponse } from '@ecobairro/contracts'

interface RecolhasSearch {
  novo?: '1'
}

export const Route = createFileRoute('/_layoutmain/recolhas')({
  validateSearch: (raw: Record<string, unknown>): RecolhasSearch =>
    raw.novo === '1' ? { novo: '1' } : {},
  component: RecolhasPage,
})

const statusConfig: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  pendente:  { label: 'Pendente',  icon: Clock,        color: '#fb923c',              bg: 'bg-orange-500/10' },
  agendado:  { label: 'Agendado',  icon: Calendar,     color: '#60a5fa',              bg: 'bg-blue-500/10'   },
  concluido: { label: 'Concluído', icon: CheckCircle,  color: 'oklch(0.55 0.18 150)', bg: 'bg-green-500/10'  },
}

const POR_PAGINA = 5

const agendarSchema = z.object({
  tipo: z.string().min(2),
  subtipo: z.string().min(2, 'Descreva o que pretende recolher (mín. 2 caracteres)'),
  morada: z.string().min(5, 'Indique a morada completa (mín. 5 caracteres)'),
  obs: z.string().optional(),
})

function RecolhasPage() {
  const search = useSearch({ from: '/_layoutmain/recolhas' })
  const [expandido, setExpandido] = useState<string | null>(null)
  const [pagina, setPagina] = useState(1)
  const [recolhas, setRecolhas] = useState<RecolhaRecord[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [modalAberto, setModalAberto] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [form, setForm] = useState({ tipo: 'Monos Volumosos', subtipo: '', morada: '', obs: '' })

  const headers = { Authorization: `Bearer ${getAccessToken() ?? ''}` }

  async function load(pg = pagina) {
    setLoading(true)
    try {
      const res = await fetchJson<ListRecolhasResponse>(
        `/v1/recolhas?page=${pg}&pageSize=${POR_PAGINA}`,
        { baseUrl: clientEnv.apiBaseUrl, headers }
      )
      setRecolhas(res.recolhas)
      setTotal(res.total)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [pagina])

  const autoOpenedRef = useRef(false)
  useEffect(() => {
    if (autoOpenedRef.current) return
    if (search.novo !== '1') return
    autoOpenedRef.current = true
    setModalAberto(true)
  }, [search.novo])

  async function onAgendar(e: React.FormEvent) {
    e.preventDefault()
    setSubmitError(null)

    const parsed = agendarSchema.safeParse(form)
    if (!parsed.success) {
      setSubmitError(parsed.error.issues[0]?.message ?? 'Verifique os campos do formulário.')
      return
    }

    setSubmitting(true)
    try {
      const body: CreateRecolhaRequest = {
        tipo: parsed.data.tipo,
        subtipo: parsed.data.subtipo.trim(),
        morada: parsed.data.morada.trim(),
        obs: parsed.data.obs?.trim() || undefined,
      }
      await fetchJson<CreateRecolhaResponse>('/v1/recolhas', {
        baseUrl: clientEnv.apiBaseUrl,
        headers,
        method: 'POST',
        body: JSON.stringify(body),
      })
      setModalAberto(false)
      setForm({ tipo: 'Monos Volumosos', subtipo: '', morada: '', obs: '' })
      await load(1)
      setPagina(1)
    } catch (error) {
      if (error instanceof HttpError && error.status === 401) {
        setSubmitError('Sessão expirada. Faça login novamente.')
      } else {
        setSubmitError(
          getApiErrorMessage(error, 'Não foi possível agendar a recolha. Tente novamente.'),
        )
      }
    } finally {
      setSubmitting(false)
    }
  }

  const pageCount = Math.ceil(total / POR_PAGINA)

  const contagens = {
    pendente:  recolhas.filter(p => p.status === 'pendente').length,
    agendado:  recolhas.filter(p => p.status === 'agendado').length,
    concluido: recolhas.filter(p => p.status === 'concluido').length,
  }

  return (
    <div className="flex flex-col gap-10 pb-12">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Truck className="w-5 h-5 text-[var(--primary)]" />
            <h1 className="text-xl font-bold text-foreground">Monos e Entulhos</h1>
          </div>
          <p className="text-sm text-muted-foreground">Agende e acompanhe a recolha de objetos volumosos e entulho.</p>
        </div>
        <Button
          className="gap-2 bg-[var(--primary)] hover:opacity-90 transition-opacity self-start sm:self-auto rounded-xl"
          onClick={() => setModalAberto(true)}
        >
          <PlusCircle className="w-4 h-4" />
          Agendar Recolha
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: 'Pedidos Pendentes',  value: contagens.pendente,  icon: Clock,        color: '#fb923c',              desc: 'Aguardando agendamento' },
          { label: 'Recolhas Agendadas', value: contagens.agendado,  icon: Calendar,     color: '#60a5fa',              desc: 'Próximas intervenções'  },
          { label: 'Pedidos Concluídos', value: contagens.concluido, icon: CheckCircle,  color: 'oklch(0.55 0.18 150)', desc: 'Recolhas realizadas'     },
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
                <div className="text-2xl font-bold text-foreground">{loading ? '-' : stat.value}</div>
                <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{stat.desc}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-[var(--primary)]" />
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">O que recolhemos?</h2>
        </div>
        <Card className="border border-border/70 shadow-sm rounded-xl bg-card overflow-hidden">
          <CardContent className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
                  <Package className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Monos Volumosos</p>
                  <p className="text-xs text-muted-foreground">Eletrodomésticos, móveis (sofás, armários), colchões e equipamentos eletrónicos.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Entulho de Obras</p>
                  <p className="text-xs text-muted-foreground">Pequenos restos de obras domésticas (tijolos, cerâmicas). Limite de 1m³ por pedido.</p>
                </div>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10 flex gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-amber-900">Importante</p>
                <p className="text-[11px] text-amber-800 leading-relaxed mt-0.5">
                  Não coloque monos na rua sem agendamento prévio. A recolha é gratuita e ajuda a manter o bairro limpo.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-[var(--primary)]" />
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Os Meus Pedidos</h2>
          </div>
          <span className="text-xs text-muted-foreground">{total} pedido{total !== 1 ? 's' : ''}</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-5 h-5 animate-spin text-[var(--primary)]" />
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {recolhas.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2 text-center">
                <Truck className="w-8 h-8 text-muted-foreground/40" />
                <p className="text-sm font-medium text-muted-foreground">Sem pedidos de recolha</p>
                <p className="text-xs text-muted-foreground">Clique em "Agendar Recolha" para criar o primeiro pedido.</p>
              </div>
            ) : recolhas.map((p) => {
              const cfg = statusConfig[p.status] ?? statusConfig['pendente']!
              const SIcon = cfg.icon
              const isOpen = expandido === p.id

              return (
                <Card
                  key={p.id}
                  className="border border-border/70 shadow-sm rounded-xl hover:shadow-md transition-all cursor-pointer overflow-hidden"
                  onClick={() => setExpandido(isOpen ? null : p.id)}
                >
                  <CardContent className="p-0">
                    <div className="p-4 flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${cfg.bg}`}>
                        <SIcon className="w-6 h-6" style={{ color: cfg.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-bold text-foreground truncate">{p.tipo}</p>
                          <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-tight h-5 shrink-0" style={{ color: cfg.color, borderColor: `${cfg.color}40` }}>
                            {cfg.label}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{p.subtipo}</p>
                        <div className="flex items-center gap-4 mt-2 text-[10px] text-muted-foreground font-medium">
                          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {p.morada}</span>
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {p.data_pedido}</span>
                        </div>
                      </div>
                      <ChevronRight className={`w-5 h-5 text-muted-foreground/30 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                    </div>

                    {isOpen && (
                      <div className="px-4 pb-4 pt-2 border-t border-border/50 bg-muted/20">
                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div className="space-y-1">
                            <p className="text-muted-foreground font-medium">Data Prevista</p>
                            <p className="text-foreground font-semibold">{p.data_prevista ?? 'Pendente'}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-muted-foreground font-medium">Observações</p>
                            <p className="text-foreground italic">"{p.obs ?? 'Sem observações'}"</p>
                          </div>
                        </div>
                        {p.status === 'pendente' && (
                          <div className="mt-4">
                            <button className="text-[11px] font-bold text-destructive hover:underline uppercase tracking-wider">Cancelar</button>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
        <PaginationBar page={pagina} pageCount={pageCount} onPage={(p) => { setPagina(p); void load(p) }} />
      </section>

      {/* Modal agendar */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setModalAberto(false)} />
          <div className="relative z-10 w-full max-w-md bg-card rounded-2xl shadow-2xl border border-border p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-foreground">Nova Recolha</h2>
              <button onClick={() => setModalAberto(false)} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={onAgendar} className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Tipo</label>
                <select
                  value={form.tipo}
                  onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30"
                >
                  <option>Monos Volumosos</option>
                  <option>Entulho</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Descrição</label>
                <input
                  type="text"
                  placeholder="Ex: Sofá de 2 lugares, Frigorífico..."
                  value={form.subtipo}
                  onChange={e => setForm(f => ({ ...f, subtipo: e.target.value }))}
                  required
                  className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Morada de recolha</label>
                <input
                  type="text"
                  placeholder="Rua, número, andar..."
                  value={form.morada}
                  onChange={e => setForm(f => ({ ...f, morada: e.target.value }))}
                  required
                  className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Observações (opcional)</label>
                <textarea
                  placeholder="Informações adicionais..."
                  value={form.obs}
                  onChange={e => setForm(f => ({ ...f, obs: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 resize-none"
                />
              </div>
              {submitError && (
                <p className="text-xs text-destructive">{submitError}</p>
              )}
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" size="sm" onClick={() => setModalAberto(false)}>Cancelar</Button>
                <Button type="submit" size="sm" className="bg-[var(--primary)] hover:opacity-90" disabled={submitting}>
                  {submitting ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                  Agendar
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
