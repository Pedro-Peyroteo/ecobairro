import { createFileRoute } from '@tanstack/react-router'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Package, PlusCircle, Search, MapPin, Users, 
  ArrowRight
} from 'lucide-react'
import { useState, useMemo } from 'react'

export const Route = createFileRoute('/_layoutmain/partilhas')({
  component: PartilhasPage,
})

import { categorias, partilhasMock } from '@/mocks/partilhasMocks'

function PartilhasPage() {
  const [filtro, setFiltro] = useState('todos')
  const [pesquisa, setPesquisa] = useState('')

  const filtrados = useMemo(() => {
    return partilhasMock.filter(p => {
      const matchCat = filtro === 'todos' || p.categoria === filtro
      const matchText = p.titulo.toLowerCase().includes(pesquisa.toLowerCase()) || 
                       p.zona.toLowerCase().includes(pesquisa.toLowerCase())
      return matchCat && matchText
    })
  }, [filtro, pesquisa])

  return (
    <div className="flex flex-col gap-10 pb-12">
      
      {/* ── Cabeçalho ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Package className="w-5 h-5 text-[var(--primary)]" />
            <h1 className="text-xl font-bold text-foreground">Partilhas Locais</h1>
          </div>
          <p className="text-sm text-muted-foreground">Encontre ou ofereça objetos à comunidade do seu bairro.</p>
        </div>
        <Button className="gap-2 bg-[var(--primary)] hover:opacity-90 transition-opacity self-start sm:self-auto rounded-xl">
          <PlusCircle className="w-4 h-4" />
          Partilhar Algo
        </Button>
      </div>

      {/* ── Filtros e Pesquisa ── */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Pesquisar objetos ou zonas..."
              value={pesquisa}
              onChange={(e) => setPesquisa(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)]/50 transition-all font-medium shadow-sm"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1 w-full md:w-auto">
            {categorias.map((cat) => {
              const Icon = cat.icon
              const isActive = filtro === cat.id
              return (
                <button
                  key={cat.id}
                  onClick={() => setFiltro(cat.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                    isActive 
                      ? 'bg-[var(--primary)] text-white border-[var(--primary)] shadow-md shadow-[var(--primary)]/20' 
                      : 'bg-card text-muted-foreground border-border hover:border-[var(--primary)]/40 hover:text-foreground hover:shadow-sm'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-[var(--primary)]'}`} />
                  {cat.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Grelha de Objetos ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-4 bg-[var(--primary)] rounded-full" />
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Disponíveis Perto de Si</h2>
          </div>
          <p className="text-xs text-muted-foreground font-medium">{filtrados.length} resultados</p>
        </div>

        {filtrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <Search className="w-8 h-8 text-muted-foreground/30" />
            </div>
            <div>
              <p className="font-bold text-foreground">Sem resultados</p>
              <p className="text-sm text-muted-foreground">Tente ajustar os seus filtros ou pesquisa.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtrados.map((item) => (
              <Card key={item.id} className="group border border-border/70 shadow-sm rounded-xl overflow-hidden hover:shadow-md transition-all cursor-pointer">
                <div className="aspect-[4/3] w-full relative overflow-hidden bg-muted">
                  <img src={item.imagem} alt={item.titulo} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <Badge className="absolute top-3 right-3 bg-black/50 backdrop-blur-md border-none text-white text-[10px] font-bold uppercase tracking-tight">
                    {categorias.find(c => c.id === item.categoria)?.label}
                  </Badge>
                </div>
                <CardContent className="p-4 space-y-3">
                  <div>
                    <h3 className="font-bold text-sm text-foreground leading-snug line-clamp-1 group-hover:text-[var(--primary)] transition-colors">
                      {item.titulo}
                    </h3>
                    <div className="flex items-center gap-2 mt-1.5 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1 font-medium"><MapPin className="w-3 h-3" /> {item.zona}</span>
                      <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                      <span>{item.distancia}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border/50">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-[var(--primary)]/10 flex items-center justify-center">
                        <Users className="w-3 h-3 text-[var(--primary)]" />
                      </div>
                      <p className="text-[10px] font-semibold text-foreground truncate max-w-[80px]">{item.user}</p>
                    </div>
                    <button className="flex items-center gap-1 text-[10px] font-bold text-[var(--primary)] uppercase tracking-wider group/btn">
                      Tenho Interesse <ArrowRight className="w-3 h-3 transition-transform group-hover/btn:translate-x-0.5" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}
