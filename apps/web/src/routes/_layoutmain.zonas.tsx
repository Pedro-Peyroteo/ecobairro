import { createFileRoute } from '@tanstack/react-router'
import { requireRole } from '@/lib/auth'
import { MapContainer, TileLayer, Polygon, Popup } from 'react-leaflet'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Map as MapIcon, PlusCircle, Users, Recycle, FileText, Pencil, Trash2, X, Save } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import 'leaflet/dist/leaflet.css'

export const Route = createFileRoute('/_layoutmain/zonas')({
  beforeLoad: requireRole(['tecnico_autarquia', 'tecnico_ccdr', 'admin']),
  component: ZonasPage,
})

interface Zona {
  id: number
  nome: string
  descricao: string
  cor: string
  ecopontos: number
  utilizadores: number
  reportes: number
  polygon: [number, number][]
}

const mockZonas: Zona[] = [
  {
    id: 1, nome: 'Centro', descricao: 'Zona histórica e comercial de Aveiro',
    cor: '#60a5fa', ecopontos: 51, utilizadores: 4200, reportes: 38,
    polygon: [[40.6420, -8.6580], [40.6420, -8.6480], [40.6360, -8.6480], [40.6360, -8.6580]],
  },
  {
    id: 2, nome: 'Norte', descricao: 'Zona residencial norte — Campus e arredores',
    cor: '#22c55e', ecopontos: 42, utilizadores: 3100, reportes: 27,
    polygon: [[40.6480, -8.6580], [40.6480, -8.6440], [40.6420, -8.6440], [40.6420, -8.6580]],
  },
  {
    id: 3, nome: 'Sul', descricao: 'Zona sul — Aradas e Esgueira',
    cor: '#fb923c', ecopontos: 38, utilizadores: 2800, reportes: 22,
    polygon: [[40.6360, -8.6580], [40.6360, -8.6480], [40.6300, -8.6480], [40.6300, -8.6580]],
  },
  {
    id: 4, nome: 'Oeste', descricao: 'Zona beira-mar e zonas costeiras',
    cor: '#a78bfa', ecopontos: 35, utilizadores: 1900, reportes: 10,
    polygon: [[40.6450, -8.6700], [40.6450, -8.6580], [40.6350, -8.6580], [40.6350, -8.6700]],
  },
  {
    id: 5, nome: 'Este', descricao: 'Zona industrial e periférica este',
    cor: '#f472b6', ecopontos: 29, utilizadores: 1400, reportes: 6,
    polygon: [[40.6460, -8.6480], [40.6460, -8.6380], [40.6370, -8.6380], [40.6370, -8.6480]],
  },
]

const zonaSchema = z.object({
  nome: z.string().min(1, 'Nome obrigatório'),
  descricao: z.string().optional(),
})

type ZonaForm = z.infer<typeof zonaSchema>

function ZonasPage() {
  const [zonas, setZonas] = useState<Zona[]>(mockZonas)
  const [selecionada, setSelecionada] = useState<Zona | null>(null)
  const [modal, setModal] = useState(false)
  const [editando, setEditando] = useState<Zona | null>(null)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ZonaForm>({
    resolver: zodResolver(zonaSchema),
  })

  function abrirEditar(z: Zona) {
    setEditando(z)
    reset({ nome: z.nome, descricao: z.descricao })
    setModal(true)
  }

  function onSubmit(data: ZonaForm) {
    if (editando) {
      setZonas(prev => prev.map(z => z.id === editando.id ? { ...z, ...data } : z))
    }
    setModal(false)
  }

  function eliminar(id: number) {
    setZonas(prev => prev.filter(z => z.id !== id))
    if (selecionada?.id === id) setSelecionada(null)
  }

  return (
    <div className="flex flex-col gap-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">Gestão de Zonas</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{zonas.length} zonas geográficas definidas</p>
        </div>
        <Button size="sm" className="gap-2 bg-[var(--primary)] hover:opacity-90 transition-opacity self-start sm:self-auto" onClick={() => {}}>
          <PlusCircle className="w-4 h-4" />
          Nova Zona
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Ecopontos',    value: zonas.reduce((s, z) => s + z.ecopontos, 0),    color: '#60a5fa' },
          { label: 'Utilizadores', value: `${(zonas.reduce((s, z) => s + z.utilizadores, 0) / 1000).toFixed(1)}k`, color: 'oklch(0.55 0.18 150)' },
          { label: 'Reportes',     value: zonas.reduce((s, z) => s + z.reportes, 0),     color: '#fb923c' },
        ].map(s => (
          <Card key={s.label} className="border border-border/70 shadow-sm rounded-xl p-4">
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{s.label}</p>
            <p className="text-2xl font-bold mt-1" style={{ color: s.color }}>{s.value}</p>
          </Card>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        {/* Lista */}
        <div className="flex flex-col gap-2 w-full lg:w-64 shrink-0">
          {zonas.map(z => (
            <Card
              key={z.id}
              onClick={() => setSelecionada(z)}
              className={`border shadow-sm rounded-xl cursor-pointer transition-all hover:shadow-md ${selecionada?.id === z.id ? 'border-[var(--primary)]/50 ring-1 ring-[var(--primary)]/30' : 'border-border/70'}`}
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
                    <button onClick={e => { e.stopPropagation(); eliminar(z.id) }} className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground line-clamp-1">{z.descricao}</p>
                <div className="flex items-center gap-2 mt-1.5 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-0.5"><Recycle className="w-3 h-3" />{z.ecopontos}</span>
                  <span className="flex items-center gap-0.5"><Users className="w-3 h-3" />{z.utilizadores.toLocaleString()}</span>
                  <span className="flex items-center gap-0.5"><FileText className="w-3 h-3" />{z.reportes}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Mapa */}
        <div className="flex-1 min-h-[420px] rounded-xl overflow-hidden border border-border shadow-sm">
          <MapContainer center={[40.639, -8.654]} zoom={13} style={{ height: '100%', minHeight: 420 }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" />
            {zonas.map(z => (
              <Polygon
                key={z.id}
                positions={z.polygon}
                pathOptions={{
                  color: z.cor,
                  fillColor: z.cor,
                  fillOpacity: selecionada?.id === z.id ? 0.35 : 0.15,
                  weight: selecionada?.id === z.id ? 3 : 1.5,
                }}
                eventHandlers={{ click: () => setSelecionada(z) }}
              >
                <Popup>
                  <div className="text-xs">
                    <p className="font-semibold">{z.nome}</p>
                    <p className="text-muted-foreground">{z.ecopontos} ecopontos · {z.utilizadores.toLocaleString()} utilizadores</p>
                  </div>
                </Popup>
              </Polygon>
            ))}
          </MapContainer>
        </div>
      </div>

      {/* Detalhe zona selecionada */}
      {selecionada && (
        <Card className="border border-border/70 shadow-sm rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: selecionada.cor }} />
              <h3 className="text-sm font-bold text-foreground">Zona {selecionada.nome}</h3>
              <p className="text-xs text-muted-foreground">— {selecionada.descricao}</p>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Ecopontos',    value: selecionada.ecopontos,                        icon: Recycle,   color: '#60a5fa' },
                { label: 'Utilizadores', value: selecionada.utilizadores.toLocaleString(),     icon: Users,     color: 'oklch(0.55 0.18 150)' },
                { label: 'Reportes',     value: selecionada.reportes,                         icon: FileText,  color: '#fb923c' },
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
          <div className="relative z-10 w-full max-w-sm bg-card rounded-2xl shadow-2xl border border-border p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <MapIcon className="w-4 h-4 text-[var(--primary)]" />
                Editar Zona
              </h2>
              <button onClick={() => setModal(false)} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
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
