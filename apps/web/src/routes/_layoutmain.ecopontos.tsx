import { createFileRoute } from '@tanstack/react-router'
import { requireRole } from '@/lib/auth'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Search, PlusCircle, MapPin, X, Save, Pencil, Trash2, Wifi, WifiOff } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { useModalA11y } from '@/lib/use-modal-a11y'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { fetchJson } from '@/lib/http/fetch-json'
import { getApiErrorMessage } from '@/lib/http/api-error'
import { clientEnv } from '@/lib/env'
import type {
  EcopontoRecord,
  ListEcopontosResponse,
  CreateEcopontoRequest,
  UpdateEcopontoRequest,
} from '@ecobairro/contracts'

export const Route = createFileRoute('/_layoutmain/ecopontos')({
  beforeLoad: requireRole(['operador', 'admin']),
  component: EcopontosPage,
})

type NivelEnchimento = EcopontoRecord['nivel']

const nivelConfig: Record<NivelEnchimento, { label: string; color: string; pct: number }> = {
  baixo: { label: 'Baixo',  color: 'oklch(0.55 0.18 150)', pct: 20 },
  medio: { label: 'Médio',  color: '#60a5fa',               pct: 55 },
  alto:  { label: 'Alto',   color: '#fb923c',               pct: 80 },
  cheio: { label: 'Cheio',  color: '#f87171',               pct: 100 },
}

const zonas = ['Centro', 'Norte', 'Sul', 'Este', 'Oeste'] as const

const ecopontoSchema = z.object({
  nome: z.string().min(2, 'Nome obrigatório'),
  codigo: z.string().optional(),
  morada: z.string().min(3, 'Morada obrigatória'),
  zona: z.enum(zonas).optional(),
  ocupacao: z.coerce.number().min(0).max(100),
  lat: z.coerce.number(),
  lng: z.coerce.number(),
})

type EcopontoForm = z.infer<typeof ecopontoSchema>
}

function EcopontosPage() {
  const [ecopontos, setEcopontos] = useState<EcopontoRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [listError, setListError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [pesquisa, setPesquisa] = useState('')
  const [filtroCodigoPostal, setFiltroCodigoPostal] = useState('')
  const [filtroZona, setFiltroZona] = useState('')
  const [filtroNivel, setFiltroNivel] = useState<NivelEnchimento | 'todos'>('todos')
  const [modal, setModal] = useState<'novo' | 'editar' | null>(null)
  const [editando, setEditando] = useState<EcopontoRecord | null>(null)
  const [saving, setSaving] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)
  useModalA11y(modal !== null, modalRef, () => setModal(null))

  const { register, handleSubmit, reset, formState: { errors } } = useForm<EcopontoForm>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(ecopontoSchema) as any,
  })

  async function reload(params?: {
    q?: string; codigoPostal?: string; zona?: string; nivel?: NivelEnchimento | 'todos'
  }) {
    setLoading(true)
    setListError(null)
    try {
      const q = params?.q ?? pesquisa
      const cp = params?.codigoPostal ?? filtroCodigoPostal
      const z = params?.zona ?? filtroZona
      const n = params?.nivel ?? filtroNivel

      const qs = new URLSearchParams({ todos: 'true' })
      if (q.trim()) qs.set('q', q.trim())
      if (cp.trim()) qs.set('codigo_postal', cp.trim())
      if (z) qs.set('zona', z)
      if (n !== 'todos') qs.set('nivel', n)

      const res = await fetchJson<ListEcopontosResponse>(`/v1/ecopontos?${qs.toString()}`, {
        baseUrl: clientEnv.apiBaseUrl,
      })
      setEcopontos(res.ecopontos)
    } catch (err) {
      setListError(getApiErrorMessage(err, 'Não foi possível carregar os ecopontos.'))
    }
    finally { setLoading(false) }
  }

  useEffect(() => { void reload() }, [])

  // Pesquisa com debounce — re-carrega ao alterar texto
  useEffect(() => {
    const t = setTimeout(() => { void reload() }, 400)
    return () => clearTimeout(t)
  }, [pesquisa, filtroCodigoPostal, filtroZona, filtroNivel])

  const lista = ecopontos

  function abrirNovo() {
    setEditando(null)
    reset({ nome: '', codigo: '', morada: '', zona: 'Centro', ocupacao: 0, lat: 40.638, lng: -8.654 })
    setModal('novo')
  }

  function abrirEditar(ep: EcopontoRecord) {
    setEditando(ep)
    reset({
      nome: ep.nome,
      codigo: ep.codigo ?? '',
      morada: ep.morada,
      zona: (ep.zona as typeof zonas[number]) ?? 'Centro',
      ocupacao: ep.ocupacao,
      lat: ep.lat,
      lng: ep.lng,
    })
    setModal('editar')
  }

  async function onSubmit(data: EcopontoForm) {
    setSaving(true)
    try {
      if (editando) {
        const body: UpdateEcopontoRequest = {
          nome: data.nome,
          codigo: data.codigo ?? undefined,
          morada: data.morada,
          zona: data.zona,
          ocupacao: data.ocupacao,
          lat: data.lat,
          lng: data.lng,
        }
        await fetchJson(`/v1/ecopontos/${editando.id}`, {
          baseUrl: clientEnv.apiBaseUrl,
          method: 'PATCH',
          body: JSON.stringify(body),
        })
      } else {
        const body: CreateEcopontoRequest = {
          nome: data.nome,
          codigo: data.codigo ?? undefined,
          morada: data.morada,
          zona: data.zona,
          ocupacao: data.ocupacao,
          lat: data.lat,
          lng: data.lng,
        }
        await fetchJson('/v1/ecopontos', {
          baseUrl: clientEnv.apiBaseUrl,
          method: 'POST',
          body: JSON.stringify(body),
        })
      }
      setModal(null)
      setSubmitError(null)
      await reload()
    } catch (err) {
      setSubmitError(getApiErrorMessage(err, 'Não foi possível guardar o ecoponto.'))
    }
    finally { setSaving(false) }
  }

  async function eliminar(id: string) {
    if (!confirm('Desativar este ecoponto?')) return
    try {
      await fetchJson(`/v1/ecopontos/${id}`, {
        baseUrl: clientEnv.apiBaseUrl,
        method: 'DELETE',
      })
      await reload()
    } catch (err) {
      setListError(getApiErrorMessage(err, 'Não foi possível desativar o ecoponto.'))
    }
  }

  return (
    <div className="flex flex-col gap-8 pb-12">

      {listError && (
        <div role="alert" aria-live="polite" className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive flex items-center justify-between gap-3">
          <span>{listError}</span>
          <button onClick={() => void reload()} className="text-xs font-medium underline-offset-2 hover:underline">Tentar novamente</button>
        </div>
      )}

      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">Parque de Equipamentos</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {loading ? '…' : `${ecopontos.length} ecopontos registados`}
          </p>
        </div>
        <Button size="sm" className="gap-2 bg-[var(--primary)] hover:opacity-90 transition-opacity self-start sm:self-auto" onClick={abrirNovo}>
          <PlusCircle className="w-4 h-4" />
          Novo Ecoponto
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Online',     value: ecopontos.filter(e => e.sensor_estado === 'online').length,  color: 'oklch(0.55 0.18 150)' },
          { label: 'Offline',    value: ecopontos.filter(e => e.sensor_estado === 'offline').length, color: '#94a3b8'               },
          { label: 'Cheios',     value: ecopontos.filter(e => e.nivel === 'cheio').length,           color: '#f87171'               },
          { label: 'Nível Alto', value: ecopontos.filter(e => e.nivel === 'alto').length,            color: '#fb923c'               },
        ].map((s) => (
          <Card key={s.label} className="border border-border/70 shadow-sm rounded-xl p-4">
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{s.label}</p>
            <p className="text-2xl font-bold mt-1" style={{ color: s.color }}>{s.value}</p>
          </Card>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex flex-col gap-3">
        {/* Nível */}
        <div className="flex gap-2 flex-wrap">
          {(['todos', 'cheio', 'alto', 'medio', 'baixo'] as const).map((n) => (
            <button
              key={n}
              onClick={() => setFiltroNivel(n)}
              className={`px-4 py-1.5 text-xs font-medium rounded-full transition-all capitalize ${
                filtroNivel === n
                  ? 'bg-[var(--primary)] text-white shadow-sm'
                  : 'bg-card border border-border text-muted-foreground hover:border-[var(--primary)]/40'
              }`}
            >
              {n === 'todos' ? 'Todos' : nivelConfig[n].label}
            </button>
          ))}
        </div>

        {/* Pesquisa textual + código postal + zona */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Pesquisar por nome ou rua…"
              value={pesquisa}
              onChange={(e) => setPesquisa(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-sm rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)]/50 transition-all"
            />
          </div>
          <input
            type="text"
            placeholder="Código postal (ex: 3810)"
            value={filtroCodigoPostal}
            onChange={(e) => setFiltroCodigoPostal(e.target.value)}
            className="sm:w-44 px-3 py-2 text-sm rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)]/50 transition-all"
          />
          <select
            value={filtroZona}
            onChange={(e) => setFiltroZona(e.target.value)}
            className="sm:w-36 px-3 py-2 text-sm rounded-xl border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 transition-all"
          >
            <option value="">Todas as zonas</option>
            {zonas.map(z => <option key={z} value={z}>{z}</option>)}
          </select>
        </div>
      </div>

      {/* Tabela */}
      <Card className="border border-border/70 shadow-sm rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {['Código', 'Morada', 'Zona', 'Enchimento', 'Sensor', 'Última Recolha', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-muted-foreground">A carregar…</td>
                </tr>
              )}
              {!loading && lista.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-muted-foreground">Sem resultados</td>
                </tr>
              )}
              {lista.map((ep, i) => {
                const cfg = nivelConfig[ep.nivel]
                return (
                  <tr key={ep.id} className={`border-b border-border/50 hover:bg-muted/20 transition-colors ${!ep.ativo ? 'opacity-50' : ''} ${i % 2 === 0 ? '' : 'bg-muted/10'}`}>
                    <td className="px-4 py-3">
                      <code className="text-xs font-semibold text-foreground bg-muted px-1.5 py-0.5 rounded">{ep.codigo ?? '—'}</code>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-xs text-foreground">
                        <MapPin className="w-3 h-3 text-muted-foreground shrink-0" />
                        <div className="truncate max-w-[160px]">
                          <span>{ep.morada}</span>
                          {ep.codigo_postal && (
                            <span className="ml-1 text-[10px] text-muted-foreground">{ep.codigo_postal}</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-foreground">{ep.zona ?? '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 min-w-[100px]">
                        <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${ep.ocupacao}%`, backgroundColor: cfg.color }} />
                        </div>
                        <span className="text-[10px] font-medium" style={{ color: cfg.color }}>{ep.ocupacao}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className={`flex items-center gap-1 text-[10px] font-medium w-fit px-2 py-0.5 rounded-full ${ep.sensor_estado === 'online' ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30' : 'text-muted-foreground bg-muted'}`}>
                        {ep.sensor_estado === 'online' ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                        {ep.sensor_estado === 'online' ? 'Online' : 'Offline'}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{ep.ultima_recolha ?? '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => abrirEditar(ep)} className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => void eliminar(ep.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setModal(null)} />
          <div ref={modalRef} role="dialog" aria-modal="true" aria-labelledby="ecopontos-modal-title" tabIndex={-1} className="relative z-10 w-full max-w-md bg-card rounded-2xl shadow-2xl border border-border p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 id="ecopontos-modal-title" className="text-base font-bold text-foreground">{modal === 'novo' ? 'Novo Ecoponto' : 'Editar Ecoponto'}</h2>
              <button type="button" aria-label="Fechar modal" onClick={() => setModal(null)} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
            </div>
            {submitError && (
              <div role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {submitError}
              </div>
            )}
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 sm:col-span-1">
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Nome</label>
                  <input type="text" {...register('nome')} placeholder="Ecoponto Rossio"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30" />
                  {errors.nome && <p className="text-xs text-destructive mt-1">{errors.nome.message}</p>}
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Código</label>
                  <input type="text" {...register('codigo')} placeholder="EP-XXX"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Morada</label>
                  <input type="text" {...register('morada')} placeholder="R. do Rossio, Aveiro"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30" />
                  {errors.morada && <p className="text-xs text-destructive mt-1">{errors.morada.message}</p>}
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Zona</label>
                  <select {...register('zona')}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30">
                    {zonas.map(z => <option key={z}>{z}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Ocupação (%)</label>
                  <input type="number" min={0} max={100} {...register('ocupacao')}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Latitude</label>
                  <input type="number" step="any" {...register('lat')}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Longitude</label>
                  <input type="number" step="any" {...register('lng')}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30" />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" size="sm" onClick={() => setModal(null)}>Cancelar</Button>
                <Button type="submit" size="sm" disabled={saving} className="gap-1.5 bg-[var(--primary)] hover:opacity-90 transition-opacity">
                  <Save className="w-3.5 h-3.5" />
                  {saving ? 'A guardar…' : modal === 'novo' ? 'Criar' : 'Guardar'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
