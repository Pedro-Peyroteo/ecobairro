import { createFileRoute } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { User, Bell, Shield, Palette, Save } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { getUser } from '@/lib/auth'

export const Route = createFileRoute('/_layoutmain/configuracoes')({
  component: ConfiguracoesPage,
})

const perfilSchema = z.object({
  nome: z.string().min(2, 'Nome obrigatório (mín. 2 caracteres)'),
  email: z.string().email('Email inválido'),
  telefone: z.string().optional(),
  morada: z.string().optional(),
})

type PerfilForm = z.infer<typeof perfilSchema>

function ConfiguracoesPage() {
  const user = getUser()

  const { register, handleSubmit, watch, formState: { errors } } = useForm<PerfilForm>({
    resolver: zodResolver(perfilSchema),
    defaultValues: {
      nome: user?.name ?? '',
      email: user?.email ?? '',
      telefone: '',
      morada: 'Aveiro, Portugal',
    },
  })

  const nomeAtual = watch('nome')

  const [notificacoes, setNotificacoes] = useState({
    emailReportes: true,
    emailNoticias: false,
    emailRecolhas: true,
    pushAlertas: true,
    pushCampanhas: true,
  })

  const [guardado, setGuardado] = useState(false)

  function onSavePerfil(_data: PerfilForm) {
    setGuardado(true)
    setTimeout(() => setGuardado(false), 2000)
  }

  return (
    <div className="flex flex-col gap-8 pb-12 max-w-2xl">

      <div>
        <h1 className="text-xl font-bold text-foreground">Configurações</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Gerir perfil, notificações e preferências</p>
      </div>

      {/* Perfil */}
      <Card className="border border-border/70 shadow-sm rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="w-7 h-7 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center">
              <User className="w-4 h-4 text-[var(--primary)]" />
            </div>
            Perfil
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-[var(--primary)] flex items-center justify-center text-white text-xl font-bold shrink-0">
              {(nomeAtual || 'U').split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase() || 'U'}
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{nomeAtual || 'Utilizador'}</p>
              <p className="text-xs text-muted-foreground capitalize">{user?.role ?? 'cidadao'}</p>
              <button className="text-xs text-[var(--primary)] hover:underline mt-1">Alterar foto</button>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSavePerfil)} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Nome completo</label>
                <input
                  type="text"
                  {...register('nome')}
                  placeholder="O seu nome"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)]/50 transition-all"
                />
                {errors.nome && <p className="text-xs text-destructive mt-1">{errors.nome.message}</p>}
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Email</label>
                <input
                  type="email"
                  {...register('email')}
                  placeholder="email@exemplo.pt"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)]/50 transition-all"
                />
                {errors.email && <p className="text-xs text-destructive mt-1">{errors.email.message}</p>}
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Telefone</label>
                <input
                  type="tel"
                  {...register('telefone')}
                  placeholder="+351 9XX XXX XXX"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)]/50 transition-all"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Localização</label>
                <input
                  type="text"
                  {...register('morada')}
                  placeholder="Cidade, País"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)]/50 transition-all"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              {guardado && <p className="text-xs text-emerald-600 font-medium">Guardado com sucesso</p>}
              <Button type="submit" size="sm" className="gap-2 bg-[var(--primary)] hover:opacity-90 transition-opacity ml-auto">
                <Save className="w-3.5 h-3.5" />
                Guardar alterações
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Notificações */}
      <Card className="border border-border/70 shadow-sm rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Bell className="w-4 h-4 text-amber-500" />
            </div>
            Notificações
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-1">
          {([
            { key: 'emailReportes', label: 'Atualizações dos meus reportes',    desc: 'Email quando o estado de um reporte muda'       },
            { key: 'emailNoticias', label: 'Novidades e eventos do bairro',     desc: 'Email com as últimas notícias'                  },
            { key: 'emailRecolhas', label: 'Confirmação de recolhas agendadas', desc: 'Email ao agendar ou confirmar recolha'          },
            { key: 'pushAlertas',   label: 'Alertas de ecopontos cheios',       desc: 'Notificação quando há alertas na sua zona'      },
            { key: 'pushCampanhas', label: 'Campanhas institucionais',          desc: 'Notificação de novos comunicados da autarquia'  },
          ] as const).map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between py-3 border-b border-border/50 last:border-0">
              <div>
                <p className="text-sm font-medium text-foreground">{label}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
              <button
                onClick={() => setNotificacoes(n => ({ ...n, [key]: !n[key] }))}
                className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none ${notificacoes[key] ? 'bg-[var(--primary)]' : 'bg-muted'}`}
              >
                <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${notificacoes[key] ? 'translate-x-4' : 'translate-x-0'}`} />
              </button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Segurança */}
      <Card className="border border-border/70 shadow-sm rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="w-7 h-7 rounded-lg bg-red-500/10 flex items-center justify-center">
              <Shield className="w-4 h-4 text-red-500" />
            </div>
            Segurança
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-0">
          {[
            { label: 'Palavra-passe',                  desc: 'Última alteração há 30 dias',   acao: 'Alterar',        cls: 'text-[var(--primary)]' },
            { label: 'Autenticação em dois fatores',   desc: 'Adicione uma camada extra',     acao: 'Ativar',         cls: 'text-[var(--primary)]' },
            { label: 'Sessões ativas',                 desc: '1 dispositivo ativo',           acao: 'Terminar todas', cls: 'text-destructive'     },
          ].map(({ label, desc, acao, cls }) => (
            <div key={label} className="flex items-center justify-between py-3 border-b border-border/50 last:border-0">
              <div>
                <p className="text-sm font-medium text-foreground">{label}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
              <button className={`text-xs font-medium hover:underline ${cls}`}>{acao}</button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Aparência */}
      <Card className="border border-border/70 shadow-sm rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="w-7 h-7 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Palette className="w-4 h-4 text-purple-500" />
            </div>
            Aparência
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">O tema (claro/escuro/sistema) pode ser alterado através do botão na barra superior.</p>
        </CardContent>
      </Card>
    </div>
  )
}
