import { createFileRoute } from '@tanstack/react-router'
import { requireRole } from '@/lib/auth'
import { MapContainer, TileLayer, Polygon, Popup } from 'react-leaflet'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Map as MapIcon, PlusCircle, Users, Recycle, FileText, Pencil, X, Save, Loader } from 'lucide-react'
import { useState, useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { fetchJson } from '@/lib/http/fetch-json'
import { getApiErrorMessage } from '@/lib/http/api-error'
import { clientEnv } from '@/lib/env'
import type { ListEcopontosResponse } from '@ecobairro/contracts'
import 'leaflet/dist/leaflet.css'

export const Route = createFileRoute('/_layoutmain/zonas')({
  beforeLoad: requireRole(['tecnico_autarquia', 'tecnico_ccdr', 'admin']),
  component: ZonasPage,
})

/* ─── Config geográfica das zonas (polígonos + cor) — dados estáticos de GIS ─── */
const ZONA_CONFIG: Record<string, { cor: string; descricao: string; polygon: [number, number][] }> = {
  Centro: {
    cor: '#60a5fa',
    descricao: 'Zona histórica e comercial de Aveiro',
    polygon: [[40.6420, -8.6580], [40.6420, -8.6480], [40.6360, -8.6480], [40.6360, -8.6580]],
  },
  Norte: {
    cor: '#22c55e',
    descricao: 'Zona residencial norte — Campus e arredores',
    polygon: [[40.6480, -8.6580], [40.6480, -8.6440], [40.6420, -8.6440], [40.6420, -8.6580]],
  },
  Sul: {
    cor: '#fb923c',
    descricao: 'Zona sul — Aradas e Esgueira',
    polygon: [[40.6360, -8.6580], [40.6360, -8.6480], [40.6300, -8.6480], [40.6300, -8.6580]],
  },
  Oeste: {
    cor: '#a78bfa',
    descricao: 'Zona beira-mar e zonas costeiras',
    polygon: [[40.6450, -8.6700], [40.6450, -8.6580], [40.6350, -8.6580], [40.6350, -8.6700]],
  },
  Este: {
    cor: '#f472b6',
    descricao: 'Zona industrial e periférica este',
    polygon: [[40.6460, -8.6480], [40.6460, -8.6380], [40.6370, -8.6380], [40.6370, -8.6480]],
  },
}

const DEFAULT_CONFIG = { cor: '#94a3b8', descricao: '', polygon: [] as [number, number][] }

interface ZonaView {
  nome: string
  descricao: string
  cor: string
  ecopontos: number
  polygon: [number, number][]
}

const zonaSchema = z.object({
  nome:     z.string().min(1, 'Nome obrigatório'),
  descricao: z.string().optional(),
})
type ZonaForm = z.infer<typeof zonaSchema>

function ZonasPage() {
  const [zonas, setZonas]         = useState<ZonaView[]>([])
  const [loading, setLoading]     = useState(true)
  const [listError, setListError] = useState<string | null>(null)
  const [selecionada, setSelecionada] = useState<ZonaView | null>(null)
  const [modal, setModal]         = useState(false)
  const [editando, setEditando]   = useState<ZonaView | null>(null)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ZonaForm>({
    resolver: zodResolver(zonaSchema),
  })

  useEffect(() => {
    fetchJson<ListEcopontosResponse>('/v1/ecopontos', { baseUrl: clientEnv.apiBaseUrl })
      .then(resp => {
        /* Group ecopontos by zone */
        const map: Record<string, number> = {}
        for (const ep of resp.ecopontos) {
          const z = ep.zona ?? 'Sem zona'
          map[z] = (map[z] ?? 0) + 1
        }
        const views: ZonaView[] = Object.entries(map).map(([nome, count]) => ({
          nome,
          ecopontos: count,
          ...(ZONA_CONFIG[nome] ?? DEFAULT_CONFIG),
        }))
        setZonas(views)
      })
      .catch((err) => {
        setZonas([])
        setListError(getApiErrorMessage(err, 'Não foi possível carregar as zonas.'))
      })
      .finally(() => setLoading(false))
  }, [])

  const totalEcopontos = useMemo(() => zonas.reduce((s, z) => s + z.ecopontos, 0), [zonas])

  function abrirEditar(z: ZonaView) {
    setEditando(z)
    reset({ nome: z.nome, descricao: z.descricao })
    setModal(true)
  }

  function abrirCriar() {
    setEditando(null)
    reset({ nome: '', descricao: '' })
    setModal(true)
  }

  function onSubmit(data: ZonaForm) {
    if (editando) {
      setZonas(prev => prev.map(z => z.nome === editando.nome ? { ...z, ...data } : z))
    } else {
      if (zonas.some(z => z.nome.toLowerCase() === data.nome.toLowerCase())) {
        return
      }
      setZonas(prev => [
        ...prev,
        {
          nome: data.nome,
          descricao: data.descricao ?? '',
          cor: DEFAULT_CONFIG.cor,
          ecopontos: 0,
          polygon: [],
        },
      ])
    }
    setModal(false)
  }

  return (
    <div className="flex flex-col gap-6 pb-12">
      {listError && (
        <div role="alert" aria-live="polite" className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {listError}
        </div>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">Gestão de Zonas</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {loading ? '…' : `${zonas.length} zonas geográficas com ecopontos`}
          </p>
        </div>
        <Button size="sm" className="gap-2 bg-[var(--primary)] hover:opacity-90 transition-opacity self-start sm:self-auto" onClick={abrirCriar}>
          <PlusCircle className="w-4 h-4" />
          Nova Zona
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Ecopontos',  value: totalEcopontos,   color: '#60a5fa' },
          { label: 'Zonas',      value: zonas.length,     color: 'oklch(0.55 0.18 150)' },
          { label: 'Zona Maior', value: zonas.length > 0 ? Math.max(...zonas.map(z => z.ecopontos)) : 0, color: '#fb923c' },
        ].map(s => (
          <Card key={s.label} className="border border-border/70 shadow-sm rounded-xl p-4">
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{s.label}</p>
            <p className="text-2xl font-bold mt-1" style={{ color: s.color }}>{s.value}</p>
          </Card>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Lista */}
          <div className="flex flex-col gap-2 w-full lg:w-64 shrink-0">
            {zonas.map(z => (
              <Card
                key={z.nome}
                onClick={() => setSelecionada(z)}
                className={`border shadow-sm rounded-xl cursor-pointer transition-all hover:shadow-md ${selecionada?.nome === z.nome ? 'border-[var(--primary)]/50 ring-1 ring-[var(--primary)]/30' : 'border-border/70'}`}
              >
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: z.cor }} />
                      <p className="text-xs font-semibold text-foreground">{z.nome}</p>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={e => { e.stopPropagation(); abrirEditar(z) }} className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground">
                        <Pencil className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  {z.descricao && <p className="text-[10px] text-muted-foreground line-clamp-1">{z.descricao}</p>}
                  <div className="flex items-center gap-2 mt-1.5 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-0.5"><Recycle className="w-3 h-3" />{z.ecopontos}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Mapa */}
          <div className="flex-1 min-h-[420px] rounded-xl overflow-hidden border border-border shadow-sm">
            <MapContainer center={[40.639, -8.654]} zoom={13} style={{ height: '100%', minHeight: 420 }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" />
              {zonas.filter(z => z.polygon.length > 0).map(z => (
                <Polygon
                  key={z.nome}
                  positions={z.polygon}
                  pathOptions={{
                    color:       z.cor,
                    fillColor:   z.cor,
                    fillOpacity: selecionada?.nome === z.nome ? 0.35 : 0.15,
                    weight:      selecionada?.nome === z.nome ? 3 : 1.5,
                  }}
                  eventHandlers={{ click: () => setSelecionada(z) }}
                >
                  <Popup>
                    <div className="text-xs">
                      <p className="font-semibold">{z.nome}</p>
                      <p className="text-muted-foreground">{z.ecopontos} ecopontos</p>
                    </div>
                  </Popup>
                </Polygon>
              ))}
            </MapContainer>
          </div>
        </div>
      )}

      {/* Detalhe zona selecionada */}
      {selecionada && (
        <Card className="border border-border/70 shadow-sm rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: selecionada.cor }} />
              <h3 className="text-sm font-bold text-foreground">Zona {selecionada.nome}</h3>
              {selecionada.descricao && <p className="text-xs text-muted-foreground">— {selecionada.descricao}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Ecopontos', value: selecionada.ecopontos, icon: Recycle, color: '#60a5fa'               },
                { label: 'Zona',      value: selecionada.nome,      icon: MapIcon, color: 'oklch(0.55 0.18 150)' },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="flex flex-col items-center p-3 rounded-xl bg-muted/30 gap-1">
                  <Icon className="w-4 h-4" style={{ color }} />
                  <p className="text-base font-bold text-foreground">{value}</p>
                  <p className="text-[10px] text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal editar */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setModal(false)} />
          <div role="dialog" aria-modal="true" aria-labelledby="zonas-modal-title" className="relative z-10 w-full max-w-sm bg-card rounded-2xl shadow-2xl border border-border p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 id="zonas-modal-title" className="text-base font-bold text-foreground flex items-center gap-2">
                <MapIcon className="w-4 h-4 text-[var(--primary)]" />
                {editando ? 'Editar Zona' : 'Nova Zona'}
              </h2>
              <button type="button" aria-label="Fechar modal" onClick={() => setModal(false)} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Nome</label>
                <input
                  {...register('nome')}
                  placeholder="Nome da zona"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30"
                />
                {errors.nome && <p className="text-xs text-destructive mt-1">{errors.nome.message}</p>}
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Descrição</label>
                <input
                  {...register('descricao')}
                  placeholder="Breve descrição da zona"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" size="sm" onClick={() => setModal(false)}>Cancelar</Button>
                <Button type="submit" size="sm" className="gap-1.5 bg-[var(--primary)] hover:opacity-90 transition-opacity">
                  <Save className="w-3.5 h-3.5" /> Guardar
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
