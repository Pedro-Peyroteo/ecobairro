import { createFileRoute } from '@tanstack/react-router'
import { requireRole } from '@/lib/auth'
import { MapContainer, TileLayer, Polyline, Marker, Popup } from 'react-leaflet'
import { divIcon } from 'leaflet'
import { renderToStaticMarkup } from 'react-dom/server'
import { Card, CardContent } from '@/components/ui/card'
import { Route as RouteIcon, Clock, MapPin, Truck, CheckCircle, Play, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import 'leaflet/dist/leaflet.css'
import { fetchJson } from '@/lib/http/fetch-json'
import { getApiErrorMessage } from '@/lib/http/api-error'
import { clientEnv } from '@/lib/env'
import { getAccessToken } from '@/lib/auth'
import type { RotaRecord, ListRotasResponse } from '@ecobairro/contracts'

export const Route = createFileRoute('/_layoutmain/rotas')({
  beforeLoad: requireRole(['operador', 'admin']),
  component: RotasPage,
})

type EstadoRota = RotaRecord['estado']

const estadoConfig: Record<EstadoRota, { label: string; color: string }> = {
  ativa:     { label: 'Ativa',     color: '#22c55e' },
  concluida: { label: 'Concluída', color: '#60a5fa' },
  pendente:  { label: 'Pendente',  color: '#fb923c' },
}

function waypointIcon(color: string, n: number) {
  const svg = renderToStaticMarkup(
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20">
      <circle cx="10" cy="10" r="8" fill={color} fillOpacity="0.9" />
      <text x="10" y="14" textAnchor="middle" fontSize="9" fill="white" fontWeight="bold">{n}</text>
    </svg>
  )
  return divIcon({ html: svg, className: '', iconSize: [20, 20], iconAnchor: [10, 10] })
}

function RotasPage() {
  const [rotas, setRotas] = useState<RotaRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [listError, setListError] = useState<string | null>(null)
  const [rotaSelecionada, setRotaSelecionada] = useState<RotaRecord | null>(null)

  const headers = { Authorization: `Bearer ${getAccessToken() ?? ''}` }

  async function load() {
    setLoading(true)
    setListError(null)
    try {
      const res = await fetchJson<ListRotasResponse>('/v1/rotas', {
        baseUrl: clientEnv.apiBaseUrl,
        headers,
      })
      setRotas(res.rotas)
      if (res.rotas.length > 0) setRotaSelecionada(res.rotas[0]!)
    } catch (err) {
      setRotas([])
      setListError(getApiErrorMessage(err, 'Não foi possível carregar as rotas.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])

  async function updateEstado(id: string, estado: EstadoRota) {
    const updated = await fetchJson<RotaRecord>(`/v1/rotas/${id}`, {
      baseUrl: clientEnv.apiBaseUrl,
      headers,
      method: 'PATCH',
      body: JSON.stringify({ estado }),
    })
    setRotas(prev => prev.map(r => r.id === id ? updated : r))
    if (rotaSelecionada?.id === id) setRotaSelecionada(updated)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-[var(--primary)]" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 pb-12">
      {listError && (
        <div role="alert" aria-live="polite" className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive flex items-center justify-between gap-3">
          <span>{listError}</span>
          <button onClick={() => void load()} className="text-xs font-medium underline-offset-2 hover:underline">Tentar novamente</button>
        </div>
      )}
      <div>
        <h1 className="text-xl font-bold text-foreground">Gestão de Rotas</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{rotas.length} rotas configuradas</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Ativas',     value: rotas.filter(r => r.estado === 'ativa').length,     color: '#22c55e' },
          { label: 'Pendentes',  value: rotas.filter(r => r.estado === 'pendente').length,  color: '#fb923c' },
          { label: 'Concluídas', value: rotas.filter(r => r.estado === 'concluida').length, color: '#60a5fa' },
        ].map(s => (
          <Card key={s.label} className="border border-border/70 shadow-sm rounded-xl p-4">
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{s.label}</p>
            <p className="text-2xl font-bold mt-1" style={{ color: s.color }}>{s.value}</p>
          </Card>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex flex-col gap-2 w-full lg:w-72 shrink-0">
          {rotas.map(r => {
            const cfg = estadoConfig[r.estado]
            const isSelected = rotaSelecionada?.id === r.id
            return (
              <Card
                key={r.id}
                onClick={() => setRotaSelecionada(r)}
                className={`border shadow-sm rounded-xl cursor-pointer transition-all hover:shadow-md ${isSelected ? 'border-[var(--primary)]/50 ring-1 ring-[var(--primary)]/30' : 'border-border/70'}`}
              >
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: r.cor }} />
                      <p className="text-xs font-semibold text-foreground">{r.nome}</p>
                    </div>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ color: cfg.color, backgroundColor: `color-mix(in srgb, ${cfg.color} 12%, transparent)` }}>
                      {cfg.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-muted-foreground mb-1">
                    <Truck className="w-3 h-3" /> {r.operador}
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{r.ecopontos} ecopontos</span>
                    <span className="flex items-center gap-1"><RouteIcon className="w-3 h-3" />{r.distancia}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{r.duracao}</span>
                  </div>
                  {r.estado === 'pendente' && (
                    <button
                      onClick={(e) => { e.stopPropagation(); void updateEstado(r.id, 'ativa') }}
                      className="mt-2 flex items-center gap-1 text-[11px] font-medium text-[var(--primary)] hover:underline"
                    >
                      <Play className="w-3 h-3" /> Iniciar rota
                    </button>
                  )}
                  {r.estado === 'ativa' && (
                    <button
                      onClick={(e) => { e.stopPropagation(); void updateEstado(r.id, 'concluida') }}
                      className="mt-2 flex items-center gap-1 text-[11px] font-medium text-emerald-600 hover:underline"
                    >
                      <CheckCircle className="w-3 h-3" /> Concluir rota
                    </button>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="flex-1 min-h-[420px] rounded-xl overflow-hidden border border-border shadow-sm">
          <MapContainer center={[40.638, -8.654]} zoom={14} style={{ height: '100%', minHeight: 420 }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" />
            {rotas.map(r => (
              <Polyline key={r.id} positions={r.waypoints} color={r.cor} weight={r.id === rotaSelecionada?.id ? 4 : 2} opacity={r.id === rotaSelecionada?.id ? 0.9 : 0.35} />
            ))}
            {rotaSelecionada?.waypoints.map(([lat, lng], i) => (
              <Marker key={i} position={[lat, lng]} icon={waypointIcon(rotaSelecionada.cor, i + 1)}>
                <Popup><p className="text-xs font-medium">Paragem {i + 1}</p></Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>
    </div>
  )
}
