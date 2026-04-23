import { createFileRoute } from '@tanstack/react-router'
import { requireRole } from '@/lib/auth'
import { Card, CardContent } from '@/components/ui/card'
import { ShieldCheck, Search, Download, User, Settings, FileText, Trash2, LogIn, LogOut } from 'lucide-react'
import { useState } from 'react'

export const Route = createFileRoute('/_layoutmain/audit')({
  beforeLoad: requireRole(['tecnico_ccdr', 'admin']),
  component: AuditPage,
})

type TipoAcao = 'login' | 'logout' | 'create' | 'update' | 'delete' | 'config'

interface LogEntry {
  id: number
  utilizador: string
  papel: string
  acao: TipoAcao
  descricao: string
  ip: string
  data: string
  hora: string
}

const acaoConfig: Record<TipoAcao, { label: string; color: string; icon: React.ElementType }> = {
  login:  { label: 'Login',       color: '#60a5fa', icon: LogIn    },
  logout: { label: 'Logout',      color: '#94a3b8', icon: LogOut   },
  create: { label: 'Criação',     color: 'oklch(0.55 0.18 150)', icon: FileText  },
  update: { label: 'Alteração',   color: '#fb923c', icon: Settings },
  delete: { label: 'Eliminação',  color: '#f87171', icon: Trash2   },
  config: { label: 'Configuração',color: '#a78bfa', icon: Settings },
}

const mockLogs: LogEntry[] = [
  { id: 1,  utilizador: 'admin@ecobairro.pt',      papel: 'admin',              acao: 'config', descricao: 'Alterou configurações globais do sistema',          ip: '192.168.1.10', data: '22 Jan 2026', hora: '14:32' },
  { id: 2,  utilizador: 'joao.silva@cm-aveiro.pt', papel: 'tecnico_autarquia',  acao: 'create', descricao: 'Criou mensagem institucional #12',                  ip: '192.168.1.45', data: '22 Jan 2026', hora: '13:15' },
  { id: 3,  utilizador: 'ana.costa@cm-aveiro.pt',  papel: 'tecnico_autarquia',  acao: 'update', descricao: 'Editou zona geográfica "Zona Norte"',               ip: '192.168.1.52', data: '22 Jan 2026', hora: '11:48' },
  { id: 4,  utilizador: 'op01@ecobairro.pt',       papel: 'operador',           acao: 'login',  descricao: 'Sessão iniciada',                                   ip: '10.0.0.23',    data: '22 Jan 2026', hora: '09:00' },
  { id: 5,  utilizador: 'admin@ecobairro.pt',      papel: 'admin',              acao: 'delete', descricao: 'Eliminou utilizador id:47 (conta desativada)',       ip: '192.168.1.10', data: '21 Jan 2026', hora: '17:20' },
  { id: 6,  utilizador: 'rui.faria@cm-aveiro.pt',  papel: 'tecnico_ccdr',       acao: 'login',  descricao: 'Sessão iniciada',                                   ip: '172.16.0.8',   data: '21 Jan 2026', hora: '16:05' },
  { id: 7,  utilizador: 'op02@ecobairro.pt',       papel: 'operador',           acao: 'update', descricao: 'Atualizou estado do ecoponto EP-204 para "Cheio"',  ip: '10.0.0.31',    data: '21 Jan 2026', hora: '14:12' },
  { id: 8,  utilizador: 'joao.silva@cm-aveiro.pt', papel: 'tecnico_autarquia',  acao: 'create', descricao: 'Criou zona geográfica "Bairro do Liceu"',           ip: '192.168.1.45', data: '21 Jan 2026', hora: '10:33' },
  { id: 9,  utilizador: 'admin@ecobairro.pt',      papel: 'admin',              acao: 'update', descricao: 'Alterou papel de utilizador id:23 para "operador"', ip: '192.168.1.10', data: '20 Jan 2026', hora: '15:55' },
  { id: 10, utilizador: 'op01@ecobairro.pt',       papel: 'operador',           acao: 'logout', descricao: 'Sessão terminada',                                  ip: '10.0.0.23',    data: '20 Jan 2026', hora: '18:01' },
  { id: 11, utilizador: 'ana.costa@cm-aveiro.pt',  papel: 'tecnico_autarquia',  acao: 'delete', descricao: 'Arquivou mensagem institucional #8',                ip: '192.168.1.52', data: '20 Jan 2026', hora: '11:22' },
  { id: 12, utilizador: 'rui.faria@cm-aveiro.pt',  papel: 'tecnico_ccdr',       acao: 'logout', descricao: 'Sessão terminada',                                  ip: '172.16.0.8',   data: '19 Jan 2026', hora: '19:44' },
]

const tipoFiltros: { label: string; value: TipoAcao | 'todos' }[] = [
  { label: 'Todos',        value: 'todos'  },
  { label: 'Login/Logout', value: 'login'  },
  { label: 'Criação',      value: 'create' },
  { label: 'Alteração',    value: 'update' },
  { label: 'Eliminação',   value: 'delete' },
  { label: 'Configuração', value: 'config' },
]

function AuditPage() {
  const [filtroAcao, setFiltroAcao] = useState<TipoAcao | 'todos'>('todos')
  const [pesquisa, setPesquisa] = useState('')

  const lista = mockLogs.filter((l) => {
    const matchAcao = filtroAcao === 'todos' || l.acao === filtroAcao || (filtroAcao === 'login' && (l.acao === 'login' || l.acao === 'logout'))
    const matchSearch = pesquisa === '' ||
      l.utilizador.toLowerCase().includes(pesquisa.toLowerCase()) ||
      l.descricao.toLowerCase().includes(pesquisa.toLowerCase())
    return matchAcao && matchSearch
  })

  return (
    <div className="flex flex-col gap-8 pb-12">

      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">Auditoria e Logs</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{mockLogs.length} registos de auditoria</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl border border-border bg-card text-foreground hover:bg-accent transition-colors self-start sm:self-auto">
          <Download className="w-4 h-4" />
          Exportar CSV
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total de ações', value: mockLogs.length,                                         color: '#60a5fa' },
          { label: 'Utilizadores ativos', value: new Set(mockLogs.map(l => l.utilizador)).size,       color: 'oklch(0.55 0.18 150)' },
          { label: 'Eliminações',    value: mockLogs.filter(l => l.acao === 'delete').length,         color: '#f87171' },
          { label: 'Configurações',  value: mockLogs.filter(l => l.acao === 'config').length,         color: '#a78bfa' },
        ].map((s) => (
          <Card key={s.label} className="border border-border/70 shadow-sm rounded-xl">
            <CardContent className="pt-4 pb-3">
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{s.label}</p>
              <p className="text-2xl font-bold mt-1" style={{ color: s.color }}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filtros + Pesquisa */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="flex gap-2 flex-wrap">
          {tipoFiltros.map((f) => (
            <button
              key={f.value}
              onClick={() => setFiltroAcao(f.value as TipoAcao | 'todos')}
              className={`px-4 py-1.5 text-xs font-medium rounded-full transition-all ${
                filtroAcao === f.value || (f.value === 'login' && (filtroAcao === 'login' || filtroAcao === 'logout'))
                  ? 'bg-[var(--primary)] text-white shadow-sm'
                  : 'bg-card border border-border text-muted-foreground hover:border-[var(--primary)]/40 hover:text-foreground'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="relative sm:ml-auto w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Pesquisar utilizador ou ação..."
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
                <th className="text-left px-4 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Utilizador</th>
                <th className="text-left px-4 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Ação</th>
                <th className="text-left px-4 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Descrição</th>
                <th className="text-left px-4 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">IP</th>
                <th className="text-left px-4 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Data/Hora</th>
              </tr>
            </thead>
            <tbody>
              {lista.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground text-sm">
                    <div className="flex flex-col items-center gap-2">
                      <ShieldCheck className="w-8 h-8 opacity-30" />
                      Nenhum registo encontrado
                    </div>
                  </td>
                </tr>
              ) : lista.map((l, i) => {
                const cfg = acaoConfig[l.acao]
                const Icon = cfg.icon
                return (
                  <tr key={l.id} className={`border-b border-border/50 hover:bg-muted/20 transition-colors ${i % 2 === 0 ? '' : 'bg-muted/10'}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[var(--primary)]/10 flex items-center justify-center">
                          <User className="w-3.5 h-3.5 text-[var(--primary)]" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-foreground truncate max-w-[140px]">{l.utilizador}</p>
                          <p className="text-[10px] text-muted-foreground">{l.papel}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 px-2 py-1 rounded-full w-fit text-[10px] font-medium" style={{ color: cfg.color, backgroundColor: `color-mix(in srgb, ${cfg.color} 12%, transparent)` }}>
                        <Icon className="w-3 h-3" />
                        {cfg.label}
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <p className="text-xs text-muted-foreground max-w-xs truncate">{l.descricao}</p>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <code className="text-[11px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{l.ip}</code>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs text-foreground">{l.data}</p>
                      <p className="text-[10px] text-muted-foreground">{l.hora}</p>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
