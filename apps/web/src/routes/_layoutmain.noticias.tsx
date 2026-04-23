import { createFileRoute } from '@tanstack/react-router'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, MapPin, ChevronRight, Search, Newspaper, CalendarDays } from 'lucide-react'
import { useState, useEffect } from 'react'
import { PaginationBar } from '@/components/ui/pagination-bar'

export const Route = createFileRoute('/_layoutmain/noticias')({
  component: NoticiasPage,
})

/* ─── Tipos ─── */
type Categoria = 'tudo' | 'noticias' | 'eventos'

/* ─── Dados mock ─── */
const noticias = [
  {
    id: 1,
    tipo: 'noticias' as const,
    destaque: true,
    imagem: 'https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?q=80&w=900&auto=format&fit=crop',
    titulo: 'Campanha de Limpeza do Rio Vouga',
    resumo: 'O município de Aveiro convida todos os cidadãos a participar na grande campanha de limpeza das margens do Rio Vouga. Serão fornecidos equipamentos e os voluntários receberão eco-pontos extra na plataforma ecoBairro.',
    data: '20 Dez 2025',
    tempo: '3 min',
    tag: 'Ambiente',
  },
  {
    id: 2,
    tipo: 'noticias' as const,
    destaque: false,
    imagem: 'https://images.unsplash.com/photo-1604187351574-c75ca79f5807?q=80&w=600&auto=format&fit=crop',
    titulo: 'Novos Ecopontos Inteligentes Instalados',
    resumo: '15 novos equipamentos com sensores IoT e compactação solar foram instalados no centro de Aveiro.',
    data: '18 Dez 2025',
    tempo: '2 min',
    tag: 'Infraestrutura',
  },
  {
    id: 3,
    tipo: 'noticias' as const,
    destaque: false,
    imagem: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?q=80&w=600&auto=format&fit=crop',
    titulo: 'Compostagem Urbana Chega a 5 Parques',
    resumo: 'O programa de compostagem coletiva expande-se a mais cinco parques da cidade. As inscrições estão abertas para residentes.',
    data: '15 Dez 2025',
    tempo: '4 min',
    tag: 'Sustentabilidade',
  },
  {
    id: 4,
    tipo: 'noticias' as const,
    destaque: false,
    imagem: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?q=80&w=600&auto=format&fit=crop',
    titulo: 'Aveiro Bate Recorde de Reciclagem em 2025',
    resumo: 'Com mais de 4.200 toneladas separadas, o município atinge o melhor resultado de sempre em taxa de valorização de resíduos.',
    data: '10 Dez 2025',
    tempo: '3 min',
    tag: 'Relatório',
  },
]

const eventos = [
  {
    id: 10,
    tipo: 'eventos' as const,
    imagem: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=600&auto=format&fit=crop',
    titulo: 'Mercado Solidário de Natal',
    resumo: 'Troca e doação de bens usados em bom estado. Entrada livre para todos os moradores do município.',
    diaSemana: 'Sáb',
    dia: '21',
    mes: 'DEZ',
    hora: '10:00 – 18:00',
    local: 'Praça do Peixe, Aveiro',
    tag: 'Comunidade',
  },
  {
    id: 11,
    tipo: 'eventos' as const,
    imagem: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=600&auto=format&fit=crop',
    titulo: 'Workshop: Reciclagem Criativa',
    resumo: 'Aprenda a reutilizar materiais em casa com técnicas práticas e sustentáveis. Vagas limitadas, inscreva-se já!',
    diaSemana: 'Ter',
    dia: '07',
    mes: 'JAN',
    hora: '14:30 – 17:00',
    local: 'Casa da Cultura de Aveiro',
    tag: 'Workshop',
  },
  {
    id: 12,
    tipo: 'eventos' as const,
    imagem: 'https://images.unsplash.com/photo-1569336415962-a4bd9f69cd83?q=80&w=600&auto=format&fit=crop',
    titulo: 'Dia Mundial dos Oceanos – Aveiro Limpa',
    resumo: 'Ação conjunta de limpeza da Ria de Aveiro com organizações ambientais locais e escolas do município.',
    diaSemana: 'Dom',
    dia: '08',
    mes: 'JAN',
    hora: '09:00 – 13:00',
    local: 'Cais dos Mercantéis, Aveiro',
    tag: 'Voluntariado',
  },
]

const filtros: { label: string; value: Categoria }[] = [
  { label: 'Tudo',      value: 'tudo'     },
  { label: 'Notícias',  value: 'noticias' },
  { label: 'Eventos',   value: 'eventos'  },
]

const POR_PAGINA = 4

/* ─── Página ─── */
function NoticiasPage() {
  const [filtro, setFiltro] = useState<Categoria>('tudo')
  const [pesquisa, setPesquisa] = useState('')
  const [pagina, setPagina] = useState(1)

  const todos = [...noticias, ...eventos]

  const listaFiltrada = todos.filter((item) => {
    const matchFiltro = filtro === 'tudo' || item.tipo === filtro
    const matchPesquisa = pesquisa === '' || item.titulo.toLowerCase().includes(pesquisa.toLowerCase())
    return matchFiltro && matchPesquisa
  })

  useEffect(() => { setPagina(1) }, [filtro, pesquisa])

  const pageCount = Math.ceil(listaFiltrada.length / POR_PAGINA)
  const lista = listaFiltrada.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA)

  const noticiasVisiveis = lista.filter((i) => i.tipo === 'noticias')
  const eventosVisiveis  = lista.filter((i) => i.tipo === 'eventos')
  const noticiaDestaque  = noticiasVisiveis.find((n: any) => n.destaque)
  const noticiasSec      = noticiasVisiveis.filter((n: any) => !n.destaque)

  return (
    <div className="flex flex-col gap-6 pb-10">

      {/* ── Cabeçalho ── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Notícias e Eventos</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Fique a par do que acontece no ecoBairro</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Pesquisar..."
            value={pesquisa}
            onChange={(e) => setPesquisa(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)]/50 transition-all"
          />
        </div>
      </div>

      {/* ── Filtros ── */}
      <div className="flex gap-2">
        {filtros.map((f) => (
          <button
            key={f.value}
            onClick={() => setFiltro(f.value)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              filtro === f.value
                ? 'bg-[var(--primary)] text-white shadow-sm'
                : 'bg-card border border-border text-muted-foreground hover:border-[var(--primary)]/40 hover:text-foreground'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* ── Notícias ── */}
      {(filtro === 'tudo' || filtro === 'noticias') && noticiasVisiveis.length > 0 && (
        <section className="space-y-3">
          {filtro === 'tudo' && (
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide flex items-center gap-2">
              <Newspaper className="w-4 h-4 text-[var(--primary)]" /> Notícias
            </h2>
          )}

          {/* Destaque */}
          {noticiaDestaque && (
            <Card className="overflow-hidden border border-border/70 shadow-none hover:shadow-sm transition-shadow cursor-pointer group">
              <div className="h-48 sm:h-60 w-full overflow-hidden bg-muted">
                <img
                  src={(noticiaDestaque as any).imagem}
                  alt={(noticiaDestaque as any).titulo}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <CardContent className="p-5 space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] border-[var(--primary)]/40 text-[var(--primary)]">
                    {(noticiaDestaque as any).tag}
                  </Badge>
                  <Badge variant="secondary" className="text-[10px]">Destaque</Badge>
                </div>
                <h3 className="font-bold text-base text-foreground leading-snug group-hover:text-[var(--primary)] transition-colors">
                  {(noticiaDestaque as any).titulo}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                  {(noticiaDestaque as any).resumo}
                </p>
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{(noticiaDestaque as any).data}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{(noticiaDestaque as any).tempo}</span>
                  </div>
                  <span className="flex items-center gap-1 text-xs font-medium text-[var(--primary)]">
                    Ler mais <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Grelha secundária */}
          {noticiasSec.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {noticiasSec.map((n: any) => (
                <Card key={n.id} className="overflow-hidden border border-border/70 shadow-none hover:shadow-sm transition-shadow cursor-pointer group">
                  <div className="h-36 w-full overflow-hidden bg-muted">
                    <img src={n.imagem} alt={n.titulo} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  </div>
                  <CardContent className="p-4 space-y-2">
                    <Badge variant="outline" className="text-[10px] border-[var(--primary)]/40 text-[var(--primary)]">{n.tag}</Badge>
                    <h3 className="font-semibold text-sm text-foreground leading-snug group-hover:text-[var(--primary)] transition-colors">{n.titulo}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{n.resumo}</p>
                    <div className="flex items-center gap-3 pt-1 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{n.data}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{n.tempo}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ── Eventos ── */}
      {(filtro === 'tudo' || filtro === 'eventos') && eventosVisiveis.length > 0 && (
        <section className="space-y-3">
          {filtro === 'tudo' && (
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-[var(--primary)]" /> Eventos
            </h2>
          )}
          <div className="flex flex-col divide-y divide-border rounded-xl border border-border/70 bg-card overflow-hidden">
            {eventosVisiveis.map((ev: any) => (
              <div key={ev.id} className="flex items-start gap-4 p-4 hover:bg-muted/30 transition-colors cursor-pointer group">
                <div className="flex flex-col items-center justify-center w-12 shrink-0 text-center">
                  <span className="text-[10px] font-medium text-muted-foreground uppercase">{ev.diaSemana}</span>
                  <span className="text-2xl font-bold text-[var(--primary)] leading-none">{ev.dia}</span>
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">{ev.mes}</span>
                </div>
                <div className="w-px self-stretch bg-border shrink-0" />
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-start gap-2 justify-between">
                    <h3 className="font-semibold text-sm text-foreground leading-snug group-hover:text-[var(--primary)] transition-colors">{ev.titulo}</h3>
                    <Badge variant="outline" className="text-[10px] shrink-0 border-[var(--primary)]/40 text-[var(--primary)]">{ev.tag}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{ev.resumo}</p>
                  <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{ev.hora}</span>
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{ev.local}</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground/40 shrink-0 mt-1" />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Empty state ── */}
      {listaFiltrada.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
            <Search className="w-5 h-5 text-muted-foreground" />
          </div>
          <p className="font-semibold text-foreground">Sem resultados</p>
          <p className="text-sm text-muted-foreground max-w-xs">
            Não encontrámos conteúdos que correspondam à sua pesquisa.
          </p>
        </div>
      )}

      {/* ── Paginação ── */}
      {listaFiltrada.length > 0 && (
        <>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{listaFiltrada.length} item{listaFiltrada.length !== 1 ? 's' : ''}</span>
            <span>Página {pagina} de {pageCount}</span>
          </div>
          <PaginationBar page={pagina} pageCount={pageCount} onPage={setPagina} />
        </>
      )}
    </div>
  )
}
