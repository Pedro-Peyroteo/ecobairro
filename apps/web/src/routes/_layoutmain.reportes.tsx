import { createFileRoute } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  MapPin, Calendar, ChevronRight, PlusCircle, Search,
  Clock, CheckCircle, XCircle, AlertCircle, Loader, Package
} from 'lucide-react'
import { useState } from 'react'

export const Route = createFileRoute('/_layoutmain/reportes')({
  component: ReportesPage,
})

/* ─── Tipos ─── */
type Status = 'pendente' | 'analise' | 'resolvido' | 'rejeitado'

interface Reporte {
  id: number
  titulo: string
  tipo: string
  descricao: string
  local: string
  data: string
  status: Status
  imagem?: string
}

/* ─── Config de status ─── */
const statusConfig: Record<Status, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  pendente:  { label: 'Pendente',    color: '#fb923c', bg: 'bg-orange-50 dark:bg-orange-950/30',  icon: Clock       },
  analise:   { label: 'Em Análise',  color: '#60a5fa', bg: 'bg-blue-50 dark:bg-blue-950/30',      icon: Loader      },
  resolvido: { label: 'Resolvido',   color: 'oklch(0.55 0.18 150)', bg: 'bg-emerald-50 dark:bg-emerald-950/30', icon: CheckCircle },
  rejeitado: { label: 'Rejeitado',   color: '#f87171', bg: 'bg-red-50 dark:bg-red-950/30',        icon: XCircle     },
}

/* ─── Dados mock ─── */
const reportes: Reporte[] = [
  {
    id: 1,
    titulo: 'Ecoponto cheio — vidro a transbordar',
    tipo: 'Ecoponto Cheio',
    descricao: 'O contentor de vidro do Ecoponto Rossio está completamente cheio há 3 dias e já está a transbordar para o passeio.',
    local: 'Praça do Rossio, Aveiro',
    data: '18 Dez 2025',
    status: 'resolvido',
    imagem: 'https://images.unsplash.com/photo-1604187351574-c75ca79f5807?q=80&w=200&auto=format&fit=crop',
  },
  {
    id: 2,
    titulo: 'Resíduos depositados fora do ecoponto',
    tipo: 'Deposição Ilegal',
    descricao: 'Sacos de lixo doméstico foram depositados na via pública junto ao Mercado, fora dos contentores.',
    local: 'R. do Mercado, Aveiro',
    data: '20 Dez 2025',
    status: 'analise',
    imagem: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?q=80&w=200&auto=format&fit=crop',
  },
  {
    id: 3,
    titulo: 'Tampa do ecoponto danificada',
    tipo: 'Dano em Equipamento',
    descricao: 'A tampa do contentor amarelo (plásticos) da Universidade está partida, expondo os resíduos à chuva.',
    local: 'Campus Universitário, Aveiro',
    data: '19 Dez 2025',
    status: 'pendente',
  },
  {
    id: 4,
    titulo: 'Odores intensos junto ao ecoponto',
    tipo: 'Odores',
    descricao: 'Odores muito intensos junto ao ecoponto da Glória. Possível resíduo orgânico no contentor errado.',
    local: 'R. da Glória, Aveiro',
    data: '15 Dez 2025',
    status: 'resolvido',
  },
  {
    id: 5,
    titulo: 'Ecoponto vandalizado',
    tipo: 'Vandalismo',
    descricao: 'O ecoponto da Beira-Mar foi vandalizado com graffiti e um dos contentores está virado ao lado.',
    local: 'Av. Beira-Mar, Aveiro',
    data: '12 Dez 2025',
    status: 'rejeitado',
    imagem: 'https://images.unsplash.com/photo-1569336415962-a4bd9f69cd83?q=80&w=200&auto=format&fit=crop',
  },
  {
    id: 6,
    titulo: 'Contentor de papel cheio',
    tipo: 'Ecoponto Cheio',
    descricao: 'Contentor azul do Vera Cruz a transbordar. Muitas caixas de cartão depositadas fora.',
    local: 'R. Vera Cruz, Aveiro',
    data: '21 Dez 2025',
    status: 'pendente',
  },
  {
    id: 7,
    titulo: 'Resíduos de construção despejados',
    tipo: 'Deposição Ilegal',
    descricao: 'Entulho e resíduos de obra foram despejados num terreno baldio perto da escola.',
    local: 'R. das Flores, Aveiro',
    data: '10 Dez 2025',
    status: 'resolvido',
  },
  {
    id: 8,
    titulo: 'Ecoponto com porta bloqueada',
    tipo: 'Dano em Equipamento',
    descricao: 'A abertura do contentor de metal está bloqueada, impossibilitando a deposição de resíduos.',
    local: 'Av. Dr. Lourenço Peixinho, Aveiro',
    data: '08 Dez 2025',
    status: 'analise',
  },
]

const filtros: { label: string; value: Status | 'todos' }[] = [
  { label: 'Todos',       value: 'todos'    },
  { label: 'Pendente',    value: 'pendente' },
  { label: 'Em Análise',  value: 'analise'  },
  { label: 'Resolvido',   value: 'resolvido'},
  { label: 'Rejeitado',   value: 'rejeitado'},
]

/* ─── Página ─── */
function ReportesPage() {
  const [filtro, setFiltro] = useState<Status | 'todos'>('todos')
  const [pesquisa, setPesquisa] = useState('')
  const [expandido, setExpandido] = useState<number | null>(null)

  const lista = reportes.filter((r) => {
    const matchFiltro = filtro === 'todos' || r.status === filtro
    const matchSearch = pesquisa === '' || r.titulo.toLowerCase().includes(pesquisa.toLowerCase()) || r.local.toLowerCase().includes(pesquisa.toLowerCase())
    return matchFiltro && matchSearch
  })

  const contagens = {
    pendente:  reportes.filter(r => r.status === 'pendente').length,
    analise:   reportes.filter(r => r.status === 'analise').length,
    resolvido: reportes.filter(r => r.status === 'resolvido').length,
    rejeitado: reportes.filter(r => r.status === 'rejeitado').length,
  }

  return (
    <div className="flex flex-col gap-10 pb-12">

      {/* ── Cabeçalho ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">Os Meus Reportes</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{reportes.length} reportes submetidos</p>
        </div>
        <Button size="sm" className="gap-2 bg-[var(--primary)] hover:opacity-90 transition-opacity self-start sm:self-auto">
          <PlusCircle className="w-4 h-4" />
          Novo Reporte
        </Button>
      </div>

      {/* ── Resumo ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Pendentes',   value: contagens.pendente,  icon: Clock,        color: '#fb923c',  desc: 'aguardando triagem' },
          { label: 'Em Análise',  value: contagens.analise,   icon: Loader,       color: '#60a5fa',  desc: 'em processamento' },
          { label: 'Resolvidos',  value: contagens.resolvido, icon: CheckCircle,  color: 'oklch(0.55 0.18 150)', desc: 'concluídos com sucesso' },
          { label: 'Rejeitados',  value: contagens.rejeitado, icon: XCircle,      color: '#f87171',  desc: 'não procedentes' },
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
                <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{stat.desc}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* ── Filtros + Pesquisa ── */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="flex gap-2 flex-wrap">
          {filtros.map((f) => (
            <button
              key={f.value}
              onClick={() => setFiltro(f.value)}
              className={`px-4 py-1.5 text-xs font-medium rounded-full transition-all ${
                filtro === f.value
                  ? 'bg-[var(--primary)] text-white shadow-sm'
                  : 'bg-card border border-border text-muted-foreground hover:border-[var(--primary)]/40 hover:text-foreground'
              }`}
            >
              {f.label}
              {f.value !== 'todos' && (
                <span className={`ml-1.5 text-[10px] font-bold ${filtro === f.value ? 'opacity-80' : 'opacity-60'}`}>
                  {contagens[f.value as Status]}
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="relative sm:ml-auto w-full sm:w-56">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Pesquisar..."
            value={pesquisa}
            onChange={(e) => setPesquisa(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-sm rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)]/50 transition-all"
          />
        </div>
      </div>

      {/* ── Lista ── */}
      {lista.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
            <Package className="w-5 h-5 text-muted-foreground" />
          </div>
          <p className="font-semibold text-foreground">Sem reportes</p>
          <p className="text-sm text-muted-foreground max-w-xs">Não encontrámos reportes para os filtros selecionados.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {lista.map((r) => {
            const cfg = statusConfig[r.status]
            const Icon = cfg.icon
            const isOpen = expandido === r.id

            return (
              <Card
                key={r.id}
                className="border border-border/70 shadow-sm rounded-xl hover:shadow-md transition-all cursor-pointer"
                onClick={() => setExpandido(isOpen ? null : r.id)}
              >
                <CardContent className="p-0">
                  {/* Linha principal */}
                  <div className="flex items-start gap-4 p-4">
                    {/* Imagem ou ícone */}
                    {r.imagem ? (
                      <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-muted">
                        <img src={r.imagem} alt="" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className={`w-12 h-12 rounded-lg shrink-0 flex items-center justify-center ${cfg.bg}`}>
                        <AlertCircle className="w-5 h-5" style={{ color: cfg.color }} />
                      </div>
                    )}

                    {/* Conteúdo */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground leading-snug truncate pr-2">{r.titulo}</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">{r.tipo}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium" style={{ color: cfg.color, backgroundColor: `color-mix(in srgb, ${cfg.color} 10%, transparent)` }}>
                            <Icon className="w-3 h-3" />
                            {cfg.label}
                          </div>
                          <ChevronRight className={`w-4 h-4 text-muted-foreground/50 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`} />
                        </div>
                      </div>

                      <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{r.local}</span>
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{r.data}</span>
                      </div>
                    </div>
                  </div>

                  {/* Expansão com detalhe */}
                  {isOpen && (
                    <div className={`px-4 pb-4 border-t border-border pt-3 ${cfg.bg}`}>
                      <p className="text-sm text-foreground/80 leading-relaxed">{r.descricao}</p>
                      <div className="flex gap-2 mt-3">
                        <button className="text-xs font-medium text-[var(--primary)] hover:underline">Ver detalhes completos</button>
                        {r.status === 'pendente' && (
                          <span className="text-muted-foreground/50">·</span>
                        )}
                        {r.status === 'pendente' && (
                          <button className="text-xs font-medium text-destructive hover:underline">Cancelar reporte</button>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
