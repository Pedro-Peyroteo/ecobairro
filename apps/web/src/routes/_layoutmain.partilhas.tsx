import { createFileRoute } from '@tanstack/react-router'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Package, PlusCircle, Search, MapPin, Users,
  ArrowRight, Upload, X, ImageIcon
} from 'lucide-react'
import { useState, useMemo, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { PaginationBar } from '@/components/ui/pagination-bar'
import { categorias, partilhasMock } from '@/mocks/partilhasMocks'

export const Route = createFileRoute('/_layoutmain/partilhas')({
  component: PartilhasPage,
})

const categoriasIds = ['moveis', 'eletro', 'livros', 'roupa'] as const

const novaPartilhaSchema = z.object({
  titulo:    z.string().min(3, 'Título obrigatório (mín. 3 caracteres)'),
  categoria: z.enum(categoriasIds, { errorMap: () => ({ message: 'Selecione uma categoria' }) }),
  zona:      z.string().min(2, 'Zona obrigatória'),
  imagem:    z.custom<FileList>()
    .refine(fl => fl && fl.length > 0, 'Fotografia obrigatória')
    .refine(fl => !fl || fl.length === 0 || fl[0].size <= 5 * 1024 * 1024, 'Tamanho máximo: 5 MB')
    .refine(fl => !fl || fl.length === 0 || ['image/jpeg', 'image/png', 'image/webp'].includes(fl[0].type), 'Formato não suportado (JPG, PNG ou WebP)'),
})

type NovaPartilhaForm = z.infer<typeof novaPartilhaSchema>

const POR_PAGINA = 4

function PartilhasPage() {
  const [filtro, setFiltro] = useState('todos')
  const [pesquisa, setPesquisa] = useState('')
  const [pagina, setPagina] = useState(1)
  const [todasPartilhas, setTodasPartilhas] = useState(partilhasMock)
  const [modalAberto, setModalAberto] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<NovaPartilhaForm>({
    resolver: zodResolver(novaPartilhaSchema),
  })

  const imagemWatch = watch('imagem')
  const imagemFile = imagemWatch?.[0]

  useEffect(() => {
    if (!imagemFile) { setPreviewUrl(null); return }
    const url = URL.createObjectURL(imagemFile)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [imagemFile])

  const filtrados = useMemo(() => {
    return todasPartilhas.filter(p => {
      const matchCat  = filtro === 'todos' || p.categoria === filtro
      const matchText = p.titulo.toLowerCase().includes(pesquisa.toLowerCase()) ||
                        p.zona.toLowerCase().includes(pesquisa.toLowerCase())
      return matchCat && matchText
    })
  }, [todasPartilhas, filtro, pesquisa])

  useEffect(() => { setPagina(1) }, [filtro, pesquisa])

  const pageCount = Math.ceil(filtrados.length / POR_PAGINA)
  const paginados = filtrados.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA)

  function abrirModal() {
    reset()
    setPreviewUrl(null)
    setModalAberto(true)
  }

  function fecharModal() {
    setModalAberto(false)
    setPreviewUrl(null)
    reset()
  }

  function onSubmitPartilha(data: NovaPartilhaForm) {
    const nova = {
      id: Date.now(),
      titulo: data.titulo,
      categoria: data.categoria,
      zona: data.zona,
      user: 'Eu',
      imagem: previewUrl!,
      distancia: 'No seu bairro',
      data: 'Agora',
    }
    setTodasPartilhas(prev => [nova, ...prev])
    fecharModal()
  }

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
        <Button className="gap-2 bg-[var(--primary)] hover:opacity-90 transition-opacity self-start sm:self-auto rounded-xl" onClick={abrirModal}>
          <PlusCircle className="w-4 h-4" />
          Partilhar Algo
        </Button>
      </div>

      {/* ── Filtros e Pesquisa ── */}
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

      {/* ── Grelha de Objetos ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-4 bg-[var(--primary)] rounded-full" />
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Disponíveis Perto de Si</h2>
          </div>
          <p className="text-xs text-muted-foreground font-medium">{filtrados.length} resultado{filtrados.length !== 1 ? 's' : ''}</p>
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
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {paginados.map((item) => (
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
            <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
              <span>A mostrar {(pagina - 1) * POR_PAGINA + 1}–{Math.min(pagina * POR_PAGINA, filtrados.length)} de {filtrados.length}</span>
              <span>Página {pagina} de {pageCount}</span>
            </div>
            <PaginationBar page={pagina} pageCount={pageCount} onPage={setPagina} />
          </>
        )}
      </div>

      {/* ── Modal Nova Partilha ── */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={fecharModal} />
          <div className="relative z-10 w-full max-w-md bg-card rounded-2xl shadow-2xl border border-border p-6 flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-foreground">Partilhar Objeto</h2>
              <button onClick={fecharModal} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit(onSubmitPartilha)} className="flex flex-col gap-3">

              {/* Fotografia — em destaque no topo */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Fotografia</label>
                {previewUrl ? (
                  <div className="relative rounded-xl overflow-hidden border border-border">
                    <img src={previewUrl} alt="Preview" className="w-full h-44 object-cover" />
                    <button
                      type="button"
                      onClick={() => { reset({ ...watch(), imagem: undefined as any }); setPreviewUrl(null) }}
                      className="absolute top-2 right-2 w-7 h-7 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                    <div className="absolute bottom-2 left-2 bg-black/50 text-white text-[10px] px-2 py-0.5 rounded-full font-medium truncate max-w-[200px]">
                      {imagemFile?.name}
                    </div>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center h-36 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-[var(--primary)]/50 hover:bg-muted/30 transition-all">
                    <Upload className="w-8 h-8 text-muted-foreground/40" />
                    <p className="text-xs font-medium text-muted-foreground mt-2">Clique para selecionar imagem</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-0.5">JPG, PNG ou WebP · Máx. 5 MB</p>
                    <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" {...register('imagem')} />
                  </label>
                )}
                {errors.imagem && <p className="text-xs text-destructive mt-1">{errors.imagem.message as string}</p>}
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Título do objeto</label>
                <input type="text" {...register('titulo')} placeholder="Ex: Sofá de 2 lugares em bom estado..."
                  className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30" />
                {errors.titulo && <p className="text-xs text-destructive mt-1">{errors.titulo.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Categoria</label>
                  <select {...register('categoria')}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30">
                    <option value="">Selecione...</option>
                    {categorias.filter(c => c.id !== 'todos').map(c => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                  {errors.categoria && <p className="text-xs text-destructive mt-1">{errors.categoria.message}</p>}
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Zona</label>
                  <input type="text" {...register('zona')} placeholder="Ex: Rossio, Glória..."
                    className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30" />
                  {errors.zona && <p className="text-xs text-destructive mt-1">{errors.zona.message}</p>}
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-1">
                <Button type="button" variant="outline" size="sm" onClick={fecharModal}>Cancelar</Button>
                <Button type="submit" size="sm" className="bg-[var(--primary)] hover:opacity-90 transition-opacity">
                  <ImageIcon className="w-3.5 h-3.5 mr-1.5" />
                  Publicar Partilha
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
