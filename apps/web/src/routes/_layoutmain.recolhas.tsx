import { createFileRoute } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Truck, PlusCircle, Clock, Calendar, CheckCircle,
  ChevronRight, Info, MapPin, Package, AlertTriangle
} from 'lucide-react'
import { useState } from 'react'
import { PaginationBar } from '@/components/ui/pagination-bar'

export const Route = createFileRoute('/_layoutmain/recolhas')({
  component: RecolhasPage,
})

/* ─── Dados Mock ─── */
const pedidosMock = [
  {
    id: '#REC-021',
    tipo: 'Monos Volumosos',
    subtipo: 'Frigorífico e Máquina de Lavar',
    morada: 'Rua de Aveiro, 12, 3º Dto',
    dataPedido: '18/04/2026',
    dataPrevista: '22/04/2026',
    status: 'agendado',
    obs: 'Deixar junto à porta do prédio.'
  },
  {
    id: '#REC-018',
    tipo: 'Entulho',
    subtipo: 'Restos de obras (Tijolos)',
    morada: 'Av. Dr. Lourenço Peixinho, 45',
    dataPedido: '10/04/2026',
    dataPrevista: '12/04/2026',
    status: 'concluido',
    obs: 'Sacos bem fechados.'
  },
  {
    id: '#REC-025',
    tipo: 'Monos Volumosos',
    subtipo: 'Sofá de 3 lugares',
    morada: 'Rua Direita, 8',
    dataPedido: '20/04/2026',
    dataPrevista: 'Pendente',
    status: 'pendente',
    obs: 'Não cabe no elevador.'
  }
]

const statusConfig: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  pendente:  { label: 'Pendente',  icon: Clock,        color: '#fb923c',              bg: 'bg-orange-500/10' },
  agendado:  { label: 'Agendado',  icon: Calendar,     color: '#60a5fa',              bg: 'bg-blue-500/10'   },
  concluido: { label: 'Concluído', icon: CheckCircle,  color: 'oklch(0.55 0.18 150)', bg: 'bg-green-500/10'  },
}

const POR_PAGINA = 5

function RecolhasPage() {
  const [expandido, setExpandido] = useState<string | null>(null)
  const [pagina, setPagina] = useState(1)

  const contagens = {
    pendente:  pedidosMock.filter(p => p.status === 'pendente').length,
    agendado:  pedidosMock.filter(p => p.status === 'agendado').length,
    concluido: pedidosMock.filter(p => p.status === 'concluido').length,
  }

  const pageCount = Math.ceil(pedidosMock.length / POR_PAGINA)
  const paginados = pedidosMock.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA)

  return (
    <div className="flex flex-col gap-10 pb-12">

      {/* ── Cabeçalho ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Truck className="w-5 h-5 text-[var(--primary)]" />
            <h1 className="text-xl font-bold text-foreground">Monos e Entulhos</h1>
          </div>
          <p className="text-sm text-muted-foreground">Agende e acompanhe a recolha de objetos volumosos e entulho.</p>
        </div>
        <Button className="gap-2 bg-[var(--primary)] hover:opacity-90 transition-opacity self-start sm:self-auto rounded-xl">
          <PlusCircle className="w-4 h-4" />
          Agendar Recolha
        </Button>
      </div>

      {/* ── Resumo ── */}
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
                <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{stat.desc}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* ── Seção de Dicas/Info ── */}
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

      {/* ── Lista de Pedidos ── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-[var(--primary)]" />
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Os Meus Pedidos</h2>
          </div>
          <span className="text-xs text-muted-foreground">{pedidosMock.length} pedido{pedidosMock.length !== 1 ? 's' : ''}</span>
        </div>

        <div className="flex flex-col gap-3">
          {paginados.map((p) => {
            const cfg = statusConfig[p.status]
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
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {p.dataPedido}</span>
                      </div>
                    </div>
                    <ChevronRight className={`w-5 h-5 text-muted-foreground/30 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                  </div>

                  {isOpen && (
                    <div className="px-4 pb-4 pt-2 border-t border-border/50 bg-muted/20">
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div className="space-y-1">
                          <p className="text-muted-foreground font-medium">Data Prevista</p>
                          <p className="text-foreground font-semibold">{p.dataPrevista}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-muted-foreground font-medium">Observações</p>
                          <p className="text-foreground italic">"{p.obs}"</p>
                        </div>
                      </div>
                      <div className="mt-4 flex gap-3">
                        <button className="text-[11px] font-bold text-[var(--primary)] hover:underline uppercase tracking-wider">Ver detalhes</button>
                        {p.status === 'pendente' && (
                          <button className="text-[11px] font-bold text-destructive hover:underline uppercase tracking-wider">Cancelar</button>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
        <PaginationBar page={pagina} pageCount={pageCount} onPage={setPagina} />
      </section>
    </div>
  )
}
