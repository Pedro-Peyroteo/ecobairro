import { createFileRoute } from '@tanstack/react-router'
import { requireRole } from '@/lib/auth'
import { Card } from '@/components/ui/card'
import { Search, UserPlus, Shield, CheckCircle, XCircle, ChevronDown } from 'lucide-react'
import { useState } from 'react'
import type { UserRole } from '@/types'

export const Route = createFileRoute('/_layoutmain/utilizadores')({
  beforeLoad: requireRole(['admin']),
  component: UtilizadoresPage,
})

interface Utilizador {
  id: number
  nome: string
  email: string
  papel: UserRole
  ativo: boolean
  dataCriacao: string
  ultimoLogin: string
}

const papelConfig: Record<UserRole, { label: string; color: string }> = {
  guest:               { label: 'Visitante',         color: '#94a3b8' },
  cidadao:             { label: 'Cidadão',            color: '#60a5fa' },
  operador:            { label: 'Operador',           color: '#fb923c' },
  tecnico_autarquia:   { label: 'Téc. Autarquia',     color: '#a78bfa' },
  tecnico_ccdr:        { label: 'Téc. CCDR',          color: '#f472b6' },
  admin:               { label: 'Administrador',      color: 'oklch(0.55 0.18 150)' },
}

const mockUtilizadores: Utilizador[] = [
  { id: 1,  nome: 'João Silva',      email: 'joao.silva@gmail.com',         papel: 'cidadao',           ativo: true,  dataCriacao: '01 Jan 2026', ultimoLogin: '22 Jan 2026' },
  { id: 2,  nome: 'Ana Costa',       email: 'ana.costa@cm-aveiro.pt',       papel: 'tecnico_autarquia', ativo: true,  dataCriacao: '15 Nov 2025', ultimoLogin: '22 Jan 2026' },
  { id: 3,  nome: 'Rui Faria',       email: 'rui.faria@ccdr-c.pt',          papel: 'tecnico_ccdr',      ativo: true,  dataCriacao: '10 Out 2025', ultimoLogin: '21 Jan 2026' },
  { id: 4,  nome: 'Pedro Mendes',    email: 'op01@ecobairro.pt',            papel: 'operador',          ativo: true,  dataCriacao: '20 Set 2025', ultimoLogin: '22 Jan 2026' },
  { id: 5,  nome: 'Maria Ferreira',  email: 'maria.f@gmail.com',            papel: 'cidadao',           ativo: true,  dataCriacao: '05 Dez 2025', ultimoLogin: '20 Jan 2026' },
  { id: 6,  nome: 'Admin ecoBairro', email: 'admin@ecobairro.pt',           papel: 'admin',             ativo: true,  dataCriacao: '01 Jan 2025', ultimoLogin: '22 Jan 2026' },
  { id: 7,  nome: 'Carlos Neves',    email: 'carlos.neves@gmail.com',       papel: 'cidadao',           ativo: false, dataCriacao: '12 Nov 2025', ultimoLogin: '03 Jan 2026' },
  { id: 8,  nome: 'Sofia Lopes',     email: 'op02@ecobairro.pt',            papel: 'operador',          ativo: true,  dataCriacao: '01 Out 2025', ultimoLogin: '21 Jan 2026' },
  { id: 9,  nome: 'Miguel Rocha',    email: 'miguel.r@gmail.com',           papel: 'cidadao',           ativo: true,  dataCriacao: '18 Dez 2025', ultimoLogin: '19 Jan 2026' },
  { id: 10, nome: 'Inês Carvalho',   email: 'ines.c@cm-aveiro.pt',          papel: 'tecnico_autarquia', ativo: false, dataCriacao: '05 Ago 2025', ultimoLogin: '10 Jan 2026' },
]

const papeis: UserRole[] = ['cidadao', 'operador', 'tecnico_autarquia', 'tecnico_ccdr', 'admin']

function UtilizadoresPage() {
  const [utilizadores, setUtilizadores] = useState<Utilizador[]>(mockUtilizadores)
  const [pesquisa, setPesquisa] = useState('')
  const [filtroPapel, setFiltroPapel] = useState<UserRole | 'todos'>('todos')
  const [filtroAtivo, setFiltroAtivo] = useState<'todos' | 'ativo' | 'inativo'>('todos')

  const lista = utilizadores.filter((u) => {
    const matchSearch = pesquisa === '' || u.nome.toLowerCase().includes(pesquisa.toLowerCase()) || u.email.toLowerCase().includes(pesquisa.toLowerCase())
    const matchPapel = filtroPapel === 'todos' || u.papel === filtroPapel
    const matchAtivo = filtroAtivo === 'todos' || (filtroAtivo === 'ativo' ? u.ativo : !u.ativo)
    return matchSearch && matchPapel && matchAtivo
  })

  function alterarPapel(id: number, papel: UserRole) {
    setUtilizadores(prev => prev.map(u => u.id === id ? { ...u, papel } : u))
  }

  function alterarAtivo(id: number) {
    setUtilizadores(prev => prev.map(u => u.id === id ? { ...u, ativo: !u.ativo } : u))
  }

  return (
    <div className="flex flex-col gap-8 pb-12">

      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">Gestão de Utilizadores</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{utilizadores.length} utilizadores registados</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl bg-[var(--primary)] text-white hover:opacity-90 transition-opacity self-start sm:self-auto">
          <UserPlus className="w-4 h-4" />
          Convidar utilizador
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total',       value: utilizadores.length,                              color: '#60a5fa' },
          { label: 'Ativos',      value: utilizadores.filter(u => u.ativo).length,         color: 'oklch(0.55 0.18 150)' },
          { label: 'Inativos',    value: utilizadores.filter(u => !u.ativo).length,        color: '#f87171' },
          { label: 'Admins',      value: utilizadores.filter(u => u.papel === 'admin').length, color: '#a78bfa' },
        ].map((s) => (
          <Card key={s.label} className="border border-border/70 shadow-sm rounded-xl p-4">
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{s.label}</p>
            <p className="text-2xl font-bold mt-1" style={{ color: s.color }}>{s.value}</p>
          </Card>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Pesquisar nome ou email..."
            value={pesquisa}
            onChange={(e) => setPesquisa(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-sm rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)]/50 transition-all"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={filtroPapel}
            onChange={(e) => setFiltroPapel(e.target.value as UserRole | 'todos')}
            className="px-3 py-2 text-xs rounded-xl border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30"
          >
            <option value="todos">Todos os papéis</option>
            {papeis.map(p => <option key={p} value={p}>{papelConfig[p].label}</option>)}
          </select>
          <select
            value={filtroAtivo}
            onChange={(e) => setFiltroAtivo(e.target.value as 'todos' | 'ativo' | 'inativo')}
            className="px-3 py-2 text-xs rounded-xl border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30"
          >
            <option value="todos">Todos</option>
            <option value="ativo">Ativos</option>
            <option value="inativo">Inativos</option>
          </select>
        </div>
      </div>

      {/* Tabela */}
      <Card className="border border-border/70 shadow-sm rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Utilizador</th>
                <th className="text-left px-4 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Papel</th>
                <th className="text-left px-4 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Último login</th>
                <th className="text-left px-4 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Estado</th>
                <th className="text-left px-4 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody>
              {lista.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground text-sm">
                    <div className="flex flex-col items-center gap-2">
                      <Shield className="w-8 h-8 opacity-30" />
                      Nenhum utilizador encontrado
                    </div>
                  </td>
                </tr>
              ) : lista.map((u, i) => {
                const cfg = papelConfig[u.papel]
                const initials = u.nome.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
                return (
                  <tr key={u.id} className={`border-b border-border/50 hover:bg-muted/20 transition-colors ${i % 2 === 0 ? '' : 'bg-muted/10'}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-[var(--primary)] flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {initials}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-foreground">{u.nome}</p>
                          <p className="text-[10px] text-muted-foreground">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="relative inline-block">
                        <select
                          value={u.papel}
                          onChange={(e) => alterarPapel(u.id, e.target.value as UserRole)}
                          className="appearance-none pl-2 pr-6 py-1 text-[10px] font-medium rounded-full border-0 focus:outline-none focus:ring-1 focus:ring-[var(--primary)]/50 cursor-pointer"
                          style={{ color: cfg.color, backgroundColor: `color-mix(in srgb, ${cfg.color} 12%, transparent)` }}
                        >
                          {papeis.map(p => <option key={p} value={p}>{papelConfig[p].label}</option>)}
                        </select>
                        <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-2.5 h-2.5 pointer-events-none" style={{ color: cfg.color }} />
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <p className="text-xs text-muted-foreground">{u.ultimoLogin}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className={`flex items-center gap-1 text-[10px] font-medium w-fit px-2 py-0.5 rounded-full ${u.ativo ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30' : 'text-muted-foreground bg-muted'}`}>
                        {u.ativo ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {u.ativo ? 'Ativo' : 'Inativo'}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => alterarAtivo(u.id)}
                        className={`text-xs font-medium hover:underline ${u.ativo ? 'text-destructive' : 'text-[var(--primary)]'}`}
                      >
                        {u.ativo ? 'Desativar' : 'Ativar'}
                      </button>
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
