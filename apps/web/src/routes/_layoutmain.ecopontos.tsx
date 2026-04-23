import { createFileRoute } from '@tanstack/react-router'
import { requireRole } from '@/lib/auth'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Search, PlusCircle, MapPin, X, Save, Pencil, Trash2, Wifi, WifiOff } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

export const Route = createFileRoute('/_layoutmain/ecopontos')({
  beforeLoad: requireRole(['operador', 'admin']),
  component: EcopontosPage,
})

type NivelEnchimento = 'baixo' | 'medio' | 'alto' | 'cheio'
type EstadoSensor = 'online' | 'offline'

interface Ecoponto {
  id: number
  codigo: string
  morada: string
  zona: string
  nivel: NivelEnchimento
  sensor: EstadoSensor
  ultimaRecolha: string
  lat: number
  lng: number
}

const nivelConfig: Record<NivelEnchimento, { label: string; color: string; pct: number }> = {
  baixo: { label: 'Baixo',  color: 'oklch(0.55 0.18 150)', pct: 20 },
  medio: { label: 'Médio',  color: '#60a5fa',               pct: 55 },
  alto:  { label: 'Alto',   color: '#fb923c',               pct: 80 },
  cheio: { label: 'Cheio',  color: '#f87171',               pct: 100 },
}

const mockEcopontos: Ecoponto[] = [
  { id: 1,  codigo: 'EP-001', morada: 'Praça do Rossio',              zona: 'Centro', nivel: 'cheio',  sensor: 'online',  ultimaRecolha: '20 Jan 2026', lat: 40.640, lng: -8.654 },
  { id: 2,  codigo: 'EP-002', morada: 'R. do Mercado, 12',            zona: 'Centro', nivel: 'alto',   sensor: 'online',  ultimaRecolha: '21 Jan 2026', lat: 40.638, lng: -8.651 },
  { id: 3,  codigo: 'EP-003', morada: 'Campus Universitário',         zona: 'Norte',  nivel: 'medio',  sensor: 'online',  ultimaRecolha: '19 Jan 2026', lat: 40.631, lng: -8.657 },
  { id: 4,  codigo: 'EP-004', morada: 'R. da Glória, 45',             zona: 'Sul',    nivel: 'baixo',  sensor: 'offline', ultimaRecolha: '18 Jan 2026', lat: 40.635, lng: -8.660 },
  { id: 5,  codigo: 'EP-005', morada: 'Av. Beira-Mar',                zona: 'Oeste',  nivel: 'cheio',  sensor: 'online',  ultimaRecolha: '17 Jan 2026', lat: 40.642, lng: -8.665 },
  { id: 6,  codigo: 'EP-006', morada: 'R. Vera Cruz, 33',             zona: 'Centro', nivel: 'alto',   sensor: 'online',  ultimaRecolha: '22 Jan 2026', lat: 40.639, lng: -8.653 },
  { id: 7,  codigo: 'EP-007', morada: 'R. das Flores, 7',             zona: 'Norte',  nivel: 'medio',  sensor: 'offline', ultimaRecolha: '15 Jan 2026', lat: 40.633, lng: -8.648 },
  { id: 8,  codigo: 'EP-008', morada: 'Av. Dr. Lourenço Peixinho, 90',zona: 'Este',   nivel: 'baixo',  sensor: 'online',  ultimaRecolha: '20 Jan 2026', lat: 40.637, lng: -8.643 },
]

const zonas = ['Centro', 'Norte', 'Sul', 'Este', 'Oeste'] as const

const ecopontoSchema = z.object({
  codigo: z.string().min(1, 'Código obrigatório'),
  morada: z.string().min(3, 'Morada obrigatória'),
  zona: z.enum(zonas),
  nivel: z.enum(['baixo', 'medio', 'alto', 'cheio']),
})

type EcopontoForm = z.infer<typeof ecopontoSchema>

function EcopontosPage() {
  const [ecopontos, setEcopontos] = useState<Ecoponto[]>(mockEcopontos)
  const [pesquisa, setPesquisa] = useState('')
  const [filtroNivel, setFiltroNivel] = useState<NivelEnchimento | 'todos'>('todos')
  const [modal, setModal] = useState<'novo' | 'editar' | null>(null)
  const [editando, setEditando] = useState<Ecoponto | null>(null)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<EcopontoForm>({
    resolver: zodResolver(ecopontoSchema),
  })

  const lista = ecopontos.filter((e) => {
    const matchSearch = pesquisa === '' || e.codigo.toLowerCase().includes(pesquisa.toLowerCase()) || e.morada.toLowerCase().includes(pesquisa.toLowerCase()) || e.zona.toLowerCase().includes(pesquisa.toLowerCase())
    const matchNivel = filtroNivel === 'todos' || e.nivel === filtroNivel
    return matchSearch && matchNivel
  })

  function abrirNovo() {
    setEditando(null)
    reset({ codigo: '', morada: '', zona: 'Centro', nivel: 'baixo' })
    setModal('novo')
  }

  function abrirEditar(ep: Ecoponto) {
    setEditando(ep)
    reset({ codigo: ep.codigo, morada: ep.morada, zona: ep.zona as typeof zonas[number], nivel: ep.nivel })
    setModal('editar')
  }

  function onSubmit(data: EcopontoForm) {
    if (editando) {
      setEcopontos(prev => prev.map(ep => ep.id === editando.id ? { ...ep, ...data } : ep))
    } else {
      const novo: Ecoponto = { id: Date.now(), ...data, sensor: 'online', ultimaRecolha: '—', lat: 40.638, lng: -8.654 }
      setEcopontos(prev => [...prev, novo])
    }
    setModal(null)
  }

  function eliminar(id: number) {
    setEcopontos(prev => prev.filter(ep => ep.id !== id))
  }

  return (
    <div className="flex flex-col gap-8 pb-12">

      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">Parque de Equipamentos</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{ecopontos.length} ecopontos registados</p>
        </div>
        <Button size="sm" className="gap-2 bg-[var(--primary)] hover:opacity-90 transition-opacity self-start sm:self-auto" onClick={abrirNovo}>
          <PlusCircle className="w-4 h-4" />
          Novo Ecoponto
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Online',     value: ecopontos.filter(e => e.sensor === 'online').length,  color: 'oklch(0.55 0.18 150)' },
          { label: 'Offline',    value: ecopontos.filter(e => e.sensor === 'offline').length, color: '#94a3b8'               },
          { label: 'Cheios',     value: ecopontos.filter(e => e.nivel === 'cheio').length,    color: '#f87171'               },
          { label: 'Nível Alto', value: ecopontos.filter(e => e.nivel === 'alto').length,     color: '#fb923c'               },
        ].map((s) => (
          <Card key={s.label} className="border border-border/70 shadow-sm rounded-xl p-4">
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{s.label}</p>
            <p className="text-2xl font-bold mt-1" style={{ color: s.color }}>{s.value}</p>
          </Card>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
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
        <div className="relative sm:ml-auto w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Pesquisar código, morada ou zona..."
            value={pesquisa}
            onChange={(e) => setPesquisa(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-sm rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)]/50 transition-all"
          />
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
              {lista.map((ep, i) => {
                const cfg = nivelConfig[ep.nivel]
                return (
                  <tr key={ep.id} className={`border-b border-border/50 hover:bg-muted/20 transition-colors ${i % 2 === 0 ? '' : 'bg-muted/10'}`}>
                    <td className="px-4 py-3">
                      <code className="text-xs font-semibold text-foreground bg-muted px-1.5 py-0.5 rounded">{ep.codigo}</code>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-xs text-foreground">
                        <MapPin className="w-3 h-3 text-muted-foreground shrink-0" />
                        <span className="truncate max-w-[160px]">{ep.morada}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-foreground">{ep.zona}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 min-w-[100px]">
                        <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${cfg.pct}%`, backgroundColor: cfg.color }} />
                        </div>
                        <span className="text-[10px] font-medium" style={{ color: cfg.color }}>{cfg.label}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className={`flex items-center gap-1 text-[10px] font-medium w-fit px-2 py-0.5 rounded-full ${ep.sensor === 'online' ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30' : 'text-muted-foreground bg-muted'}`}>
                        {ep.sensor === 'online' ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                        {ep.sensor === 'online' ? 'Online' : 'Offline'}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{ep.ultimaRecolha}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => abrirEditar(ep)} className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => eliminar(ep.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
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
          <div className="relative z-10 w-full max-w-md bg-card rounded-2xl shadow-2xl border border-border p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-foreground">{modal === 'novo' ? 'Novo Ecoponto' : 'Editar Ecoponto'}</h2>
              <button onClick={() => setModal(null)} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 sm:col-span-1">
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Código</label>
                  <input type="text" {...register('codigo')} placeholder="EP-XXX"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30" />
                  {errors.codigo && <p className="text-xs text-destructive mt-1">{errors.codigo.message}</p>}
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Morada</label>
                  <input type="text" {...register('morada')} placeholder="Endereço"
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
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Nível</label>
                  <select {...register('nivel')}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30">
                    {(['baixo', 'medio', 'alto', 'cheio'] as const).map(n => <option key={n} value={n}>{nivelConfig[n].label}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" size="sm" onClick={() => setModal(null)}>Cancelar</Button>
                <Button type="submit" size="sm" className="gap-1.5 bg-[var(--primary)] hover:opacity-90 transition-opacity">
                  <Save className="w-3.5 h-3.5" />
                  {modal === 'novo' ? 'Criar' : 'Guardar'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
