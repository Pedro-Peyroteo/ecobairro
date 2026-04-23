import { createFileRoute } from '@tanstack/react-router'
import { requireRole } from '@/lib/auth'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import { divIcon } from 'leaflet'
import { renderToStaticMarkup } from 'react-dom/server'
import { Card, CardContent } from '@/components/ui/card'
import { Wifi, WifiOff, Radio, Battery, Thermometer, AlertTriangle } from 'lucide-react'
import { useState } from 'react'
import 'leaflet/dist/leaflet.css'

export const Route = createFileRoute('/_layoutmain/mapa-sensores')({
  beforeLoad: requireRole(['operador', 'admin']),
  component: MapaSensoresPage,
})

type SensorEstado = 'online' | 'offline' | 'alerta'

interface Sensor {
  id: number
  codigo: string
  morada: string
  lat: number
  lng: number
  estado: SensorEstado
  bateria: number
  temperatura: number
  nivel: number
  ultimaLeitura: string
}

const estadoConfig: Record<SensorEstado, { color: string; label: string }> = {
  online:  { color: '#22c55e', label: 'Online'  },
  offline: { color: '#94a3b8', label: 'Offline' },
  alerta:  { color: '#f87171', label: 'Alerta'  },
}

const sensors: Sensor[] = [
  { id: 1, codigo: 'SN-001', morada: 'Praça do Rossio',       lat: 40.6409, lng: -8.6537, estado: 'online',  bateria: 87, temperatura: 14, nivel: 25, ultimaLeitura: 'há 2 min'  },
  { id: 2, codigo: 'SN-002', morada: 'R. do Mercado, 12',     lat: 40.6390, lng: -8.6510, estado: 'alerta',  bateria: 12, temperatura: 16, nivel: 95, ultimaLeitura: 'há 5 min'  },
  { id: 3, codigo: 'SN-003', morada: 'Campus Universitário',  lat: 40.6315, lng: -8.6574, estado: 'online',  bateria: 65, temperatura: 13, nivel: 60, ultimaLeitura: 'há 8 min'  },
  { id: 4, codigo: 'SN-004', morada: 'R. da Glória, 45',      lat: 40.6445, lng: -8.6480, estado: 'offline', bateria: 0,  temperatura: 0,  nivel: 0,  ultimaLeitura: 'há 3 dias' },
  { id: 5, codigo: 'SN-005', morada: 'Av. Beira-Mar',         lat: 40.6420, lng: -8.6610, estado: 'alerta',  bateria: 8,  temperatura: 15, nivel: 88, ultimaLeitura: 'há 12 min' },
  { id: 6, codigo: 'SN-006', morada: 'R. Vera Cruz, 33',      lat: 40.6370, lng: -8.6555, estado: 'online',  bateria: 72, temperatura: 14, nivel: 72, ultimaLeitura: 'há 1 min'  },
  { id: 7, codigo: 'SN-007', morada: 'R. das Flores',         lat: 40.6433, lng: -8.6480, estado: 'offline', bateria: 0,  temperatura: 0,  nivel: 0,  ultimaLeitura: 'há 2 dias' },
  { id: 8, codigo: 'SN-008', morada: 'Av. L. Peixinho, 90',   lat: 40.6430, lng: -8.6490, estado: 'online',  bateria: 91, temperatura: 13, nivel: 42, ultimaLeitura: 'há 4 min'  },
]

function sensorIcon(estado: SensorEstado) {
  const color = estadoConfig[estado].color
  const svg = renderToStaticMarkup(
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28">
      <circle cx="14" cy="14" r="12" fill={color} fillOpacity="0.2" stroke={color} strokeWidth="2" />
      <circle cx="14" cy="14" r="5" fill={color} />
    </svg>
  )
  return divIcon({ html: svg, className: '', iconSize: [28, 28], iconAnchor: [14, 14] })
}

function MapaSensoresPage() {
  const [selecionado, setSelecionado] = useState<Sensor | null>(null)
  const [filtroEstado, setFiltroEstado] = useState<SensorEstado | 'todos'>('todos')

  const lista = sensors.filter(s => filtroEstado === 'todos' || s.estado === filtroEstado)

  return (
    <div className="flex flex-col gap-6 pb-12">
      <div>
        <h1 className="text-xl font-bold text-foreground">Mapa de Sensores IoT</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{sensors.length} sensores instalados</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Online',  value: sensors.filter(s => s.estado === 'online').length,  color: '#22c55e' },
          { label: 'Alerta',  value: sensors.filter(s => s.estado === 'alerta').length,  color: '#f87171' },
          { label: 'Offline', value: sensors.filter(s => s.estado === 'offline').length, color: '#94a3b8' },
        ].map(s => (
          <Card key={s.label} className="border border-border/70 shadow-sm rounded-xl p-4">
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{s.label}</p>
            <p className="text-2xl font-bold mt-1" style={{ color: s.color }}>{s.value}</p>
          </Card>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex gap-2">
        {([
          { label: 'Todos',   value: 'todos'   },
          { label: 'Online',  value: 'online'  },
          { label: 'Alerta',  value: 'alerta'  },
          { label: 'Offline', value: 'offline' },
        ] as const).map(f => (
          <button key={f.value} onClick={() => setFiltroEstado(f.value)}
            className={`px-4 py-1.5 text-xs font-medium rounded-full transition-all ${filtroEstado === f.value ? 'bg-[var(--primary)] text-white shadow-sm' : 'bg-card border border-border text-muted-foreground hover:border-[var(--primary)]/40'}`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Mapa + painel lateral */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 min-h-[400px] rounded-xl overflow-hidden border border-border shadow-sm">
          <MapContainer center={[40.6390, -8.6537]} zoom={14} style={{ height: '100%', minHeight: 400 }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" />
            {sensors.map(s => (
              <Marker key={s.id} position={[s.lat, s.lng]} icon={sensorIcon(s.estado)} eventHandlers={{ click: () => setSelecionado(s) }}>
                <Popup>
                  <div className="text-xs">
                    <p className="font-semibold">{s.codigo}</p>
                    <p className="text-muted-foreground">{s.morada}</p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        {/* Painel de detalhes / lista */}
        <div className="w-full lg:w-72 flex flex-col gap-2 max-h-[480px] overflow-y-auto pr-1">
          {lista.map(s => {
            const cfg = estadoConfig[s.estado]
            return (
              <Card
                key={s.id}
                onClick={() => setSelecionado(s)}
                className={`border shadow-sm rounded-xl cursor-pointer transition-all hover:shadow-md ${selecionado?.id === s.id ? 'border-[var(--primary)]/50 ring-1 ring-[var(--primary)]/30' : 'border-border/70'}`}
              >
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <Radio className="w-3.5 h-3.5" style={{ color: cfg.color }} />
                      <code className="text-xs font-semibold text-foreground">{s.codigo}</code>
                    </div>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ color: cfg.color, backgroundColor: `color-mix(in srgb, ${cfg.color} 12%, transparent)` }}>
                      {cfg.label}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate">{s.morada}</p>
                  {s.estado !== 'offline' && (
                    <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1"><Battery className="w-3 h-3" />{s.bateria}%</span>
                      <span className="flex items-center gap-1"><Thermometer className="w-3 h-3" />{s.temperatura}°C</span>
                      <span className="flex items-center gap-1">
                        {s.nivel >= 80 ? <AlertTriangle className="w-3 h-3 text-amber-500" /> : <Wifi className="w-3 h-3" />}
                        {s.nivel}%
                      </span>
                    </div>
                  )}
                  <p className="text-[10px] text-muted-foreground/60 mt-1">{s.ultimaLeitura}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Detalhe selecionado */}
      {selecionado && selecionado.estado !== 'offline' && (
        <Card className="border border-[var(--primary)]/30 shadow-sm rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-foreground">{selecionado.codigo} — {selecionado.morada}</h3>
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ color: estadoConfig[selecionado.estado].color, backgroundColor: `color-mix(in srgb, ${estadoConfig[selecionado.estado].color} 12%, transparent)` }}>
                {estadoConfig[selecionado.estado].label}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Bateria',     value: `${selecionado.bateria}%`,     icon: Battery     },
                { label: 'Temperatura', value: `${selecionado.temperatura}°C`, icon: Thermometer },
                { label: 'Enchimento',  value: `${selecionado.nivel}%`,       icon: Radio       },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="flex flex-col items-center gap-1 p-3 rounded-xl bg-muted/30">
                  <Icon className="w-4 h-4 text-muted-foreground" />
                  <p className="text-base font-bold text-foreground">{value}</p>
                  <p className="text-[10px] text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3">Última leitura: {selecionado.ultimaLeitura}</p>
          </CardContent>
        </Card>
      )}
      {selecionado && selecionado.estado === 'offline' && (
        <Card className="border border-destructive/30 bg-destructive/5 rounded-xl">
          <CardContent className="p-4 flex items-center gap-3">
            <WifiOff className="w-5 h-5 text-destructive shrink-0" />
            <div>
              <p className="text-sm font-semibold text-foreground">{selecionado.codigo} está offline</p>
              <p className="text-xs text-muted-foreground">Sem comunicação desde {selecionado.ultimaLeitura}. Verificar ligação no local.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
