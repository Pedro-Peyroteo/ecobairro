import { createFileRoute } from '@tanstack/react-router'
import { requireRole } from '@/lib/auth'
import { MapContainer, TileLayer, Polyline, Marker, Popup } from 'react-leaflet'
import { divIcon } from 'leaflet'
import { renderToStaticMarkup } from 'react-dom/server'
import { Card, CardContent } from '@/components/ui/card'
import { Route as RouteIcon, Clock, MapPin, Truck, CheckCircle, Play } from 'lucide-react'
import { useState } from 'react'
import 'leaflet/dist/leaflet.css'

export const Route = createFileRoute('/_layoutmain/rotas')({
  beforeLoad: requireRole(['operador', 'admin']),
  component: RotasPage,
})

type EstadoRota = 'ativa' | 'concluida' | 'pendente'

interface Rota {
  id: number
  nome: string
  operador: string
  estado: EstadoRota
  ecopontos: number
  distancia: string
  duracao: string
  waypoints: [number, number][]
  cor: string
}

const estadoConfig: Record<EstadoRota, { label: string; color: string }> = {
  ativa:     { label: 'Ativa',     color: '#22c55e' },
  concluida: { label: 'Concluída', color: '#60a5fa' },
  pendente:  { label: 'Pendente',  color: '#fb923c' },
}

const rotas: Rota[] = [
  {
    id: 1, nome: 'Rota Norte — Manhã', operador: 'Pedro Mendes', estado: 'ativa',
    ecopontos: 6, distancia: '8.2 km', duracao: '1h 45min',
    waypoints: [[40.6460, -8.6440], [40.6445, -8.6480], [40.6433, -8.6480], [40.6420, -8.6490], [40.6409, -8.6537], [40.6390, -8.6510]],
    cor: '#22c55e',
  },
  {
    id: 2, nome: 'Rota Sul — Tarde', operador: 'Sofia Lopes', estado: 'pendente',
    ecopontos: 5, distancia: '6.5 km', duracao: '1h 20min',
    waypoints: [[40.6390, -8.6510], [40.6370, -8.6555], [40.6350, -8.6600], [40.6315, -8.6574], [40.6370, -8.6600]],
    cor: '#fb923c',
  },
  {
    id: 3, nome: 'Rota Beira-Mar', operador: 'Carlos Lima', estado: 'concluida',
    ecopontos: 4, distancia: '5.1 km', duracao: '1h 05min',
    waypoints: [[40.6420, -8.6610], [40.6430, -8.6580], [40.6440, -8.6550], [40.6430, -8.6490]],
    cor: '#60a5fa',
  },
]

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
  const [rotaSelecionada, setRotaSelecionada] = useState<Rota>(rotas[0])

  return (
    <div className="flex flex-col gap-6 pb-12">
      <div>
        <h1 className="text-xl font-bold text-foreground">Gestão de Rotas</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{rotas.length} rotas configuradas</p>
      </div>

      {/* KPIs */}
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
        {/* Lista de rotas */}
        <div className="flex flex-col gap-2 w-full lg:w-72 shrink-0">
          {rotas.map(r => {
            const cfg = estadoConfig[r.estado]
            const isSelected = rotaSelecionada.id === r.id
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
                    <button className="mt-2 flex items-center gap-1 text-[11px] font-medium text-[var(--primary)] hover:underline">
                      <Play className="w-3 h-3" /> Iniciar rota
                    </button>
                  )}
                  {r.estado === 'ativa' && (
                    <button className="mt-2 flex items-center gap-1 text-[11px] font-medium text-emerald-600 hover:underline">
                      <CheckCircle className="w-3 h-3" /> Concluir rota
                    </button>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Mapa */}
        <div className="flex-1 min-h-[420px] rounded-xl overflow-hidden border border-border shadow-sm">
          <MapContainer center={[40.638, -8.654]} zoom={14} style={{ height: '100%', minHeight: 420 }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" />
            {rotas.map(r => (
              <Polyline key={r.id} positions={r.waypoints} color={r.cor} weight={r.id === rotaSelecionada.id ? 4 : 2} opacity={r.id === rotaSelecionada.id ? 0.9 : 0.35} />
            ))}
            {rotaSelecionada.waypoints.map(([lat, lng], i) => (
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
