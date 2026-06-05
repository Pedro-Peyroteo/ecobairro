import { createFileRoute } from '@tanstack/react-router'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, ChevronRight, Search, Newspaper, Loader } from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
import { PaginationBar } from '@/components/ui/pagination-bar'
import { fetchJson } from '@/lib/http/fetch-json'
import { getApiErrorMessage } from '@/lib/http/api-error'
import { clientEnv } from '@/lib/env'
import type { ListNoticiasResponse, NoticiaRecord } from '@ecobairro/contracts'

export const Route = createFileRoute('/_layoutmain/noticias')({
  component: NoticiasPage,
})

const filtrosDef = [
  { label: 'Tudo',      value: 'tudo'     },
  { label: 'Notícias',  value: 'noticias' },
] as const

type Filtro = (typeof filtrosDef)[number]['value']

const POR_PAGINA = 6

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-PT', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

function NoticiasPage() {
  const [filtro, setFiltro]     = useState<Filtro>('tudo')
  const [pesquisa, setPesquisa] = useState('')
  const [pagina, setPagina]     = useState(1)
  const [noticias, setNoticias] = useState<NoticiaRecord[]>([])
  const [total, setTotal]       = useState(0)
  const [loading, setLoading]   = useState(true)
  const [listError, setListError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setListError(null)
    try {
      const params: Record<string, string | number> = { page: pagina, pageSize: POR_PAGINA }
      if (pesquisa.trim()) params.q = pesquisa.trim()

      const resp = await fetchJson<ListNoticiasResponse>('/v1/noticias', {
        baseUrl: clientEnv.apiBaseUrl,
        params,
      })
      setNoticias(resp.noticias)
      setTotal(resp.total)
    } catch (err) {
      setNoticias([])
      setTotal(0)
      setListError(getApiErrorMessage(err, 'Não foi possível carregar as notícias.'))
    } finally {
      setLoading(false)
    }
  }, [pagina, pesquisa])

  useEffect(() => { void load() }, [load])
  useEffect(() => { setPagina(1) }, [pesquisa, filtro])

  const pageCount = Math.ceil(total / POR_PAGINA)

  const noticiasDestaque = noticias.filter(n => n.destaque)
  const noticiasSec      = noticias.filter(n => !n.destaque)
  const noticiaDestaque  = noticiasDestaque[0] ?? null

  return (
    <div className="flex flex-col gap-6 pb-10">

      {listError && (
        <div role="alert" aria-live="polite" className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive flex items-center justify-between gap-3">
          <span>{listError}</span>
          <button onClick={() => void load()} className="text-xs font-medium underline-offset-2 hover:underline">Tentar novamente</button>
        </div>
      )}

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
        {filtrosDef.map((f) => (
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

      {/* ── Conteúdo ── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader className="w-6 h-6 text-muted-foreground animate-spin" />
          <p className="text-sm text-muted-foreground">A carregar notícias…</p>
        </div>
      ) : noticias.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
            <Search className="w-5 h-5 text-muted-foreground" />
          </div>
          <p className="font-semibold text-foreground">Sem resultados</p>
          <p className="text-sm text-muted-foreground max-w-xs">
            Não encontrámos conteúdos que correspondam à sua pesquisa.
          </p>
        </div>
      ) : (
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
                  src={noticiaDestaque.imagem_url}
                  alt={noticiaDestaque.titulo}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <CardContent className="p-5 space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] border-[var(--primary)]/40 text-[var(--primary)]">
                    {noticiaDestaque.tag}
                  </Badge>
                  <Badge variant="secondary" className="text-[10px]">Destaque</Badge>
                </div>
                <h3 className="font-bold text-base text-foreground leading-snug group-hover:text-[var(--primary)] transition-colors">
                  {noticiaDestaque.titulo}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                  {noticiaDestaque.resumo}
                </p>
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(noticiaDestaque.data)}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{noticiaDestaque.tempo_leitura_min} min</span>
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
              {noticiasSec.map((n) => (
                <Card key={n.id} className="overflow-hidden border border-border/70 shadow-none hover:shadow-sm transition-shadow cursor-pointer group">
                  <div className="h-36 w-full overflow-hidden bg-muted">
                    <img src={n.imagem_url} alt={n.titulo} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  </div>
                  <CardContent className="p-4 space-y-2">
                    <Badge variant="outline" className="text-[10px] border-[var(--primary)]/40 text-[var(--primary)]">{n.tag}</Badge>
                    <h3 className="font-semibold text-sm text-foreground leading-snug group-hover:text-[var(--primary)] transition-colors">{n.titulo}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{n.resumo}</p>
                    <div className="flex items-center gap-3 pt-1 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(n.data)}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{n.tempo_leitura_min} min</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ── Paginação ── */}
      {!loading && total > 0 && (
        <>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{total} item{total !== 1 ? 's' : ''}</span>
            <span>Página {pagina} de {pageCount}</span>
          </div>
          <PaginationBar page={pagina} pageCount={pageCount} onPage={setPagina} />
        </>
      )}
    </div>
  )
}
