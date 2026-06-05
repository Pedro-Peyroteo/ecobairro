import { createFileRoute, useSearch } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Truck, PlusCircle, Clock, Calendar, CheckCircle,
  ChevronRight, Info, MapPin, Package, AlertTriangle,
  Loader2, X, Camera, ImageIcon, ArrowLeft, Send
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { PaginationBar } from '@/components/ui/pagination-bar'
import { fetchJson } from '@/lib/http/fetch-json'
import { clientEnv } from '@/lib/env'
import { getAccessToken } from '@/lib/auth'
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

const tiposRecolha = ['Monos Volumosos', 'Entulho'] as const
const POR_PAGINA = 5

function formatarData(date: string) {
  if (!date) return 'A definir'
  return new Date(`${date}T00:00:00`).toLocaleDateString('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function RecolhasPage() {
  const search = useSearch({ from: '/_layoutmain/recolhas' })
  const [expandido, setExpandido] = useState<string | null>(null)
  const [pagina, setPagina] = useState(1)
  const [recolhas, setRecolhas] = useState<RecolhaRecord[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [modalAberto, setModalAberto] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [passoAgendamento, setPassoAgendamento] = useState(1)
  const [enviado, setEnviado] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [imagemFile, setImagemFile] = useState<File | null>(null)
  const [form, setForm] = useState({
    tipo: 'Monos Volumosos',
    subtipo: '',
    morada: '',
    data: '',
    obs: '',
  })

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

  useEffect(() => {
    if (!imagemFile) { setPreviewUrl(null); return }
    const url = URL.createObjectURL(imagemFile)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [imagemFile])

  function resetAgendamento() {
    setForm({ tipo: 'Monos Volumosos', subtipo: '', morada: '', data: '', obs: '' })
    setPassoAgendamento(1)
    setEnviado(false)
    setImagemFile(null)
    setPreviewUrl(null)
    setSubmitting(false)
  }

  function abrirModal() {
    resetAgendamento()
    setModalAberto(true)
  }

  function fecharModal() {
    setModalAberto(false)
    resetAgendamento()
  }

  const autoOpenedRef = useRef(false)
  useEffect(() => {
    if (autoOpenedRef.current) return
    if (search.novo !== '1') return
    autoOpenedRef.current = true
    abrirModal()
  }, [search.novo])

  function avancarPasso() {
    if (passoAgendamento === 1 && (!form.subtipo.trim() || !form.morada.trim() || !form.data)) return
    setPassoAgendamento((passo) => Math.min(passo + 1, 3))
  }

  async function onAgendar(e: React.FormEvent) {
    e.preventDefault()
    if (!form.subtipo.trim() || !form.morada.trim()) return
    setSubmitting(true)
    try {
      const body: CreateRecolhaRequest = {
        tipo: form.tipo,
        subtipo: form.subtipo,
        morada: form.morada,
        obs: form.obs || undefined,
      }
      await fetchJson<CreateRecolhaResponse>('/v1/recolhas', {
        baseUrl: clientEnv.apiBaseUrl,
        headers,
        method: 'POST',
        body: JSON.stringify(body),
      })
      await load(1)
      setPagina(1)
      setEnviado(true)
    } finally {
      setSubmitting(false)
    }
  }

  const pageCount = Math.ceil(total / POR_PAGINA)
  const progressoAgendamento = enviado ? 100 : (passoAgendamento / 3) * 100

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
          onClick={abrirModal}
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

      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={fecharModal} />
          <div className="relative z-10 w-full max-w-md bg-card rounded-2xl shadow-2xl border border-border overflow-hidden max-h-[92vh] flex flex-col">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <button onClick={fecharModal} className="w-8 h-8 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors">
                <X className="w-5 h-5" />
              </button>
              <h2 className="text-base font-bold text-foreground">{enviado ? 'Enviado' : 'Agendamento'}</h2>
              <div className="w-8" />
            </div>

            {!enviado && (
              <div className="px-5 pt-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-foreground">Passo {passoAgendamento} de 3</span>
                  <span className="text-muted-foreground">
                    {passoAgendamento === 1 ? 'Detalhes da recolha' : passoAgendamento === 2 ? 'Fotografia' : 'Resumo do agendamento'}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden mt-2">
                  <div className="h-full bg-[var(--primary)] rounded-full transition-all" style={{ width: `${progressoAgendamento}%` }} />
                </div>
              </div>
            )}

            <form onSubmit={onAgendar} className="flex-1 overflow-y-auto px-5 py-4">
              {enviado ? (
                <div className="min-h-[460px] flex flex-col items-center justify-center text-center gap-5">
                  <div>
                    <h3 className="text-xl font-bold text-foreground leading-tight">Agendamento confirmado com sucesso!</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed mt-3 max-w-xs">
                      Em breve entraremos em contacto com mais detalhes. Por favor, fique atento às notificações.
                    </p>
                  </div>
                  <div className="w-36 h-36 rounded-full border-[10px] border-[var(--primary)]/85 flex items-center justify-center text-[var(--primary)]">
                    <CheckCircle className="w-24 h-24" strokeWidth={1.8} />
                  </div>
                </div>
              ) : (
                <div className="min-h-[460px]">
                  {passoAgendamento === 1 && (
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-semibold text-foreground mb-1.5 block">Tipo de recolha</label>
                        <div className="grid grid-cols-2 gap-2">
                          {tiposRecolha.map((tipo) => (
                            <label key={tipo} className="cursor-pointer">
                              <input
                                type="radio"
                                value={tipo}
                                checked={form.tipo === tipo}
                                onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}
                                className="peer sr-only"
                              />
                              <span className="flex h-10 items-center justify-center rounded-xl border border-border bg-background px-3 text-xs font-semibold text-muted-foreground transition-all peer-checked:border-[var(--primary)] peer-checked:bg-[var(--primary)]/10 peer-checked:text-[var(--primary)]">
                                {tipo === 'Monos Volumosos' ? 'Monos' : 'Entulhos'}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-semibold text-foreground mb-1.5 block">Localização</label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <input
                            type="text"
                            value={form.morada}
                            onChange={e => setForm(f => ({ ...f, morada: e.target.value }))}
                            placeholder="Pesquisar por rua ou código postal..."
                            className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-semibold text-foreground mb-1.5 block">Título</label>
                        <input
                          type="text"
                          value={form.subtipo}
                          onChange={e => setForm(f => ({ ...f, subtipo: e.target.value }))}
                          placeholder="Ex: Sofá de 3 lugares"
                          className="w-full px-3 py-2.5 text-sm rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30"
                        />
                      </div>

                      <div>
                        <label className="text-sm font-semibold text-foreground mb-1.5 block">Descrição <span className="text-muted-foreground font-normal">(Opcional)</span></label>
                        <textarea
                          value={form.obs}
                          onChange={e => setForm(f => ({ ...f, obs: e.target.value }))}
                          rows={4}
                          placeholder="Adicione mais detalhes sobre a recolha aqui..."
                          className="w-full px-3 py-2.5 text-sm rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 resize-none"
                        />
                      </div>

                      <div>
                        <label className="text-sm font-semibold text-foreground mb-1.5 block">Data</label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <input
                            type="date"
                            value={form.data}
                            onChange={e => setForm(f => ({ ...f, data: e.target.value }))}
                            className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {passoAgendamento === 2 && (
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-semibold text-foreground mb-1.5 block">Fotografia <span className="text-muted-foreground font-normal">(Opcional)</span></label>
                        <p className="text-xs text-muted-foreground leading-relaxed mb-3">Uma imagem vale mais que mil palavras. Ajude-nos a identificar melhor os objetos a recolher.</p>
                        {previewUrl ? (
                          <div className="relative rounded-xl overflow-hidden border border-border">
                            <img src={previewUrl} alt="Preview" className="w-full h-48 object-cover" />
                            <button
                              type="button"
                              onClick={() => { setImagemFile(null); setPreviewUrl(null) }}
                              className="absolute top-2 right-2 w-8 h-8 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                            <div className="absolute bottom-2 left-2 bg-black/50 text-white text-[10px] px-2 py-0.5 rounded-full font-medium">
                              {imagemFile?.name}
                            </div>
                          </div>
                        ) : (
                          <div className="grid gap-2">
                            <label className="h-11 rounded-full bg-muted hover:bg-muted/80 border border-border cursor-pointer flex items-center justify-center gap-2 text-sm font-medium text-foreground transition-colors">
                              <Camera className="w-4 h-4" />
                              Tirar uma foto
                              <input type="file" accept="image/jpeg,image/png,image/webp" capture="environment" className="hidden" onChange={e => setImagemFile(e.target.files?.[0] ?? null)} />
                            </label>
                            <label className="h-11 rounded-full bg-muted hover:bg-muted/80 border border-border cursor-pointer flex items-center justify-center gap-2 text-sm font-medium text-foreground transition-colors">
                              <ImageIcon className="w-4 h-4" />
                              Escolher da galeria
                              <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={e => setImagemFile(e.target.files?.[0] ?? null)} />
                            </label>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {passoAgendamento === 3 && (
                    <div className="space-y-5">
                      <div>
                        <h3 className="text-sm font-semibold text-foreground mb-2">Localização</h3>
                        <div className="rounded-xl border border-border bg-background min-h-32 p-3 flex items-end">
                          <p className="text-xs text-foreground">{form.morada}</p>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-sm font-semibold text-foreground mb-3">Resumo do agendamento</h3>
                        <div className="space-y-3 text-sm">
                          <div>
                            <p className="font-semibold text-foreground">Tipo</p>
                            <p className="text-muted-foreground mt-1">{form.tipo}</p>
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">Título</p>
                            <p className="text-muted-foreground mt-1">{form.subtipo}</p>
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">Data</p>
                            <p className="text-muted-foreground mt-1">{formatarData(form.data)}</p>
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">Descrição <span className="text-muted-foreground font-normal">(Opcional)</span></p>
                            <p className="text-muted-foreground mt-1 leading-relaxed">{form.obs || 'Sem observações adicionais.'}</p>
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">Fotografia <span className="text-muted-foreground font-normal">(Opcional)</span></p>
                            {previewUrl ? (
                              <img src={previewUrl} alt="" className="mt-2 w-full h-28 object-cover rounded-xl border border-border" />
                            ) : (
                              <p className="text-muted-foreground mt-1">Sem fotografia anexada.</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="sticky bottom-0 -mx-5 px-5 pt-4 pb-1 bg-card">
                {enviado ? (
                  <Button type="button" onClick={fecharModal} className="w-full rounded-full bg-[var(--primary)] hover:opacity-90 transition-opacity">
                    Concluir
                  </Button>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {passoAgendamento > 1 ? (
                      <Button type="button" variant="outline" onClick={() => setPassoAgendamento((passo) => Math.max(passo - 1, 1))} className="rounded-full">
                        <ArrowLeft className="w-4 h-4" />
                        Voltar
                      </Button>
                    ) : (
                      <div />
                    )}
                    {passoAgendamento < 3 ? (
                      <Button type="button" onClick={avancarPasso} className="rounded-full bg-[var(--primary)] hover:opacity-90 transition-opacity">
                        Continuar
                      </Button>
                    ) : (
                      <Button type="submit" className="rounded-full bg-[var(--primary)] hover:opacity-90 transition-opacity" disabled={submitting}>
                        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        Submeter
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
