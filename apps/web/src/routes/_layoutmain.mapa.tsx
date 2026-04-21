import { createFileRoute } from '@tanstack/react-router'
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet'
import { divIcon } from 'leaflet'
import { renderToStaticMarkup } from 'react-dom/server'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MapPin, Search, Navigation, X, AlertTriangle } from 'lucide-react'
import { useState, useEffect } from 'react'
import 'leaflet/dist/leaflet.css'

export const Route = createFileRoute('/_layoutmain/mapa')({
  component: MapaPage,
})

type FillLevel = 'baixo' | 'medio' | 'alto'

interface Ecoponto {
  id: number
  nome: string
  morada: string
  lat: number
  lng: number
  ocupacao: number
  nivel: FillLevel
  tipos: string[]
  ultimaAtualizacao: string
}

const ecopontos: Ecoponto[] = [
  { id: 1, nome: 'Ecoponto Rossio', morada: 'Praça do Rossio, Aveiro', lat: 40.6409, lng: -8.6537, ocupacao: 25, nivel: 'baixo', tipos: ['Papel', 'Vidro', 'Plástico'], ultimaAtualizacao: 'há 12 min' },
  { id: 2, nome: 'Ecoponto Mercado', morada: 'R. do Mercado, Aveiro', lat: 40.6390, lng: -8.6510, ocupacao: 95, nivel: 'alto', tipos: ['Papel', 'Vidro', 'Plástico', 'Metal'], ultimaAtualizacao: 'há 5 min' },
  { id: 3, nome: 'Ecoponto Universidade', morada: 'Campus Universitário, Aveiro', lat: 40.6315, lng: -8.6574, ocupacao: 60, nivel: 'medio', tipos: ['Papel', 'Plástico'], ultimaAtualizacao: 'há 28 min' },
  { id: 4, nome: 'Ecoponto Glória', morada: 'R. da Glória, Aveiro', lat: 40.6445, lng: -8.6480, ocupacao: 18, nivel: 'baixo', tipos: ['Vidro', 'Plástico', 'Metal'], ultimaAtualizacao: 'há 1h' },
  { id: 5, nome: 'Ecoponto Beira-Mar', morada: 'Av. Beira-Mar, Aveiro', lat: 40.6420, lng: -8.6610, ocupacao: 72, nivel: 'medio', tipos: ['Papel', 'Vidro'], ultimaAtualizacao: 'há 45 min' },
  { id: 6, nome: 'Ecoponto Vera Cruz', morada: 'R. Vera Cruz, Aveiro', lat: 40.6370, lng: -8.6555, ocupacao: 88, nivel: 'alto', tipos: ['Papel', 'Vidro', 'Plástico', 'Metal'], ultimaAtualizacao: 'há 10 min' },
  { id: 7, nome: 'Ecoponto São Bernardo', morada: 'Av. Dr. Lourenço Peixinho, Aveiro', lat: 40.6430, lng: -8.6490, ocupacao: 42, nivel: 'baixo', tipos: ['Papel', 'Metal'], ultimaAtualizacao: 'há 2h' },
  { id: 8, nome: 'Ecoponto Aradas', morada: 'R. de Aradas, Aveiro', lat: 40.6350, lng: -8.6600, ocupacao: 78, nivel: 'medio', tipos: ['Vidro', 'Plástico'], ultimaAtualizacao: 'há 30 min' },
  { id: 9, nome: 'Ecoponto Esgueira', morada: 'Zona Industrial de Aveiro', lat: 40.6460, lng: -8.6440, ocupacao: 91, nivel: 'alto', tipos: ['Papel', 'Vidro', 'Plástico', 'Metal'], ultimaAtualizacao: 'há 8 min' },
]

const nivelConfig = {
  baixo: { color: 'oklch(0.55 0.18 150)', bar: 'oklch(0.55 0.18 150 / 0.85)', label: 'Disponível' },
  medio: { color: '#fb923c',              bar: '#fb923ccc',                    label: 'Moderado'  },
  alto:  { color: '#f87171',              bar: '#f87171cc',                    label: 'Cheio'     },
}

function createMarker(nivel: FillLevel, isSelected: boolean) {
  const { color } = nivelConfig[nivel]
  const r = isSelected ? 14 : 10
  const svg = renderToStaticMarkup(
    <svg width={r * 2 + 4} height={r * 2 + 10} viewBox={`0 0 ${r * 2 + 4} ${r * 2 + 10}`} xmlns="http://www.w3.org/2000/svg">
      <circle cx={r + 2} cy={r + 2} r={r} fill="white" stroke={color} strokeWidth="2" />
      <circle cx={r + 2} cy={r + 2} r={r * 0.55} fill={color} />
      <polygon points={`${r + 2},${r * 2 + 10} ${r - 4},${r * 2 - 2} ${r + 8},${r * 2 - 2}`} fill={color} />
    </svg>
  )
  return divIcon({
    html: svg,
    className: '',
    iconSize: [r * 2 + 4, r * 2 + 10],
    iconAnchor: [r + 2, r * 2 + 10],
  })
}

function FlyTo({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap()
  useEffect(() => { map.flyTo([lat, lng], 16, { duration: 0.8 }) }, [lat, lng])
  return null
}

function MapaPage() {
  const [pesquisa, setPesquisa] = useState('')
  const [filtroNivel, setFiltroNivel] = useState<FillLevel | 'todos'>('todos')
  const [selected, setSelected] = useState<Ecoponto | null>(null)

  const filtered = ecopontos.filter((e) => {
    const matchNivel = filtroNivel === 'todos' || e.nivel === filtroNivel
    const matchSearch = pesquisa === '' || e.nome.toLowerCase().includes(pesquisa.toLowerCase())
    return matchNivel && matchSearch
  })

  return (
    /*
     * Usamos calc(100svh - X) onde X = navbar(~80px) + padding-top(24px) + padding-bottom(24px)
     * + header-row(~56px) + filtros(~40px) + 2 gaps(~32px) = ~256px → arredondado 260px
     * Assim o bloco de lista+mapa ocupa exatamente o espaço restante sem causar scroll externo.
     */
    <div className="flex flex-col gap-4" style={{ height: 'calc(100svh - 200px)', minHeight: 480 }}>

      {/* ── Cabeçalho ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div>
          <h1 className="text-xl font-bold text-foreground">Mapa de Ecopontos</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Aveiro · {ecopontos.length} ecopontos na sua zona</p>
        </div>
        <div className="relative w-full sm:w-60">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Pesquisar ecoponto..."
            value={pesquisa}
            onChange={(e) => setPesquisa(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-sm rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)]/50 transition-all"
          />
        </div>
      </div>

      {/* ── Filtros ── */}
      <div className="flex gap-2 flex-wrap items-center shrink-0">
        {([['todos', 'Todos'], ['baixo', 'Disponível'], ['medio', 'Moderado'], ['alto', 'Cheio']] as const).map(([val, label]) => (
          <button
            key={val}
            onClick={() => setFiltroNivel(val)}
            className={`px-4 py-1.5 text-xs font-medium rounded-full transition-all ${
              filtroNivel === val
                ? 'bg-[var(--primary)] text-white shadow-sm'
                : 'bg-card border border-border text-muted-foreground hover:border-[var(--primary)]/40 hover:text-foreground'
            }`}
          >
            {label}
          </button>
        ))}
        <div className="ml-auto hidden sm:flex items-center gap-4">
          {Object.entries(nivelConfig).map(([k, v]) => (
            <div key={k} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: v.color }} />
              {v.label}
            </div>
          ))}
        </div>
      </div>

      {/* ── Lista (esquerda) + Mapa (direita) ── preenche o espaço restante */}
      <div className="flex flex-col sm:flex-row gap-4 flex-1 min-h-0">

        {/* ── Coluna esquerda: lista + popup flutuante ── */}
        <div className="w-full sm:w-72 shrink-0 flex flex-col min-h-0 relative">

          {/* Lista — sempre visível, scroll interno */}
          <Card className="border border-border/70 shadow-sm rounded-xl flex-1 min-h-0 overflow-hidden">
            <div className="px-3 py-2 border-b border-border/70">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                {filtered.length} ecopontos
              </p>
            </div>
            <div className="h-full overflow-y-auto divide-y divide-border">
              {filtered.length === 0 && (
                <div className="p-4 text-sm text-muted-foreground text-center">Sem resultados</div>
              )}
              {filtered.map((eco) => {
                const cfg = nivelConfig[eco.nivel]
                const isActive = selected?.id === eco.id
                return (
                  <button
                    key={eco.id}
                    onClick={() => setSelected(isActive ? null : eco)}
                    className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors ${isActive ? 'bg-[var(--primary)]/8' : 'hover:bg-muted/40'}`}
                  >
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cfg.color }} />
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-medium truncate ${isActive ? 'text-[var(--primary)]' : 'text-foreground'}`}>{eco.nome}</p>
                      <p className="text-xs text-muted-foreground">{eco.ocupacao}% ocupado</p>
                    </div>
                    <span className="text-[11px] font-medium shrink-0" style={{ color: cfg.color }}>{cfg.label}</span>
                  </button>
                )
              })}
            </div>
          </Card>

        </div>

        {/* ── Mapa direita ── */}
        <Card className="flex-1 min-h-0 overflow-hidden border border-border/70 shadow-sm rounded-xl relative">
          <div className="h-full">
            <MapContainer
              center={[40.6405, -8.6537]}
              zoom={14}
              style={{ height: '100%', width: '100%' }}
              zoomControl={false}
            >
              <TileLayer
                attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {selected && <FlyTo lat={selected.lat} lng={selected.lng} />}
              {filtered.map((eco) => (
                <Marker
                  key={eco.id}
                  position={[eco.lat, eco.lng]}
                  icon={createMarker(eco.nivel, selected?.id === eco.id)}
                  eventHandlers={{ click: () => setSelected(eco) }}
                />
              ))}
            </MapContainer>
          </div>

          {/* Popup flutuante sobre o mapa */}
          {selected && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1100] w-80 animate-in slide-in-from-bottom-2 duration-200">
              <Card className="border border-border/70 shadow-lg rounded-xl overflow-hidden bg-card">
                <div className="h-1 w-full" style={{ backgroundColor: nivelConfig[selected.nivel].bar }} />
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-foreground leading-tight">{selected.nome}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 shrink-0" />{selected.morada}
                      </p>
                    </div>
                    <button
                      onClick={() => setSelected(null)}
                      className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="space-y-1">
                    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${selected.ocupacao}%`, backgroundColor: nivelConfig[selected.nivel].bar }} />
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-muted-foreground">{selected.ocupacao}% ocupado · {selected.ultimaAtualizacao}</span>
                      <span className="font-medium" style={{ color: nivelConfig[selected.nivel].color }}>
                        {nivelConfig[selected.nivel].label}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {selected.tipos.map((t) => (
                      <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button className="flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-semibold text-white bg-[var(--primary)] hover:opacity-90 rounded-lg transition-opacity">
                      <Navigation className="w-3.5 h-3.5" /> Como chegar
                    </button>
                    <button className="flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-semibold border border-destructive/60 text-destructive hover:bg-destructive/5 rounded-lg transition-colors">
                      <AlertTriangle className="w-3.5 h-3.5" /> Reportar
                    </button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </Card>

      </div>
    </div>
  )
}
