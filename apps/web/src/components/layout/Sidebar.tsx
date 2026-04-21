import { Link, useRouterState } from '@tanstack/react-router'
import {
  LayoutDashboard,
  MapPin,
  FileText,
  Trash2,
  Bell,
  Users,
  Settings,
  BarChart3,
  Route,
  ShieldCheck,
  Leaf,
  ChevronLeft,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import type { UserRole, NavItem } from '@/types'

const navByRole: Record<UserRole, NavItem[]> = {
  cidadao: [
    { label: 'Dashboard', href: '/dashboard', icon: 'dashboard' },
    { label: 'Mapa Ecopontos', href: '/mapa', icon: 'map' },
    { label: 'Meus Reportes', href: '/reportes', icon: 'file' },
    { label: 'Pedidos Recolha', href: '/recolhas', icon: 'trash' },
    { label: 'Notificações', href: '/notificacoes', icon: 'bell' },
  ],
  operador: [
    { label: 'Dashboard', href: '/dashboard', icon: 'dashboard' },
    { label: 'Fila Prioridades', href: '/fila', icon: 'file' },
    { label: 'Mapa & Ecopontos', href: '/mapa', icon: 'map' },
    { label: 'Rotas', href: '/rotas', icon: 'route' },
    { label: 'Recolhas', href: '/recolhas', icon: 'trash' },
  ],
  tecnico_autarquia: [
    { label: 'Dashboard', href: '/dashboard', icon: 'dashboard' },
    { label: 'Zonas', href: '/zonas', icon: 'map' },
    { label: 'Reportes', href: '/reportes', icon: 'file' },
    { label: 'Campanhas', href: '/campanhas', icon: 'shield' },
    { label: 'Utilizadores', href: '/utilizadores', icon: 'users' },
  ],
  tecnico_ccdr: [
    { label: 'Dashboard', href: '/dashboard', icon: 'dashboard' },
    { label: 'Analytics', href: '/analytics', icon: 'chart' },
    { label: 'Zonas', href: '/zonas', icon: 'map' },
    { label: 'Audit Log', href: '/audit', icon: 'shield' },
  ],
  admin: [
    { label: 'Dashboard', href: '/dashboard', icon: 'dashboard' },
    { label: 'Utilizadores', href: '/utilizadores', icon: 'users' },
    { label: 'Ecopontos', href: '/ecopontos', icon: 'map' },
    { label: 'Analytics', href: '/analytics', icon: 'chart' },
    { label: 'Configurações', href: '/configuracoes', icon: 'settings' },
    { label: 'Audit Log', href: '/audit', icon: 'shield' },
  ],
  guest: [
    { label: 'Home', href: '/home', icon: 'dashboard' },
  ],
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  dashboard: LayoutDashboard,
  map: MapPin,
  file: FileText,
  trash: Trash2,
  bell: Bell,
  users: Users,
  settings: Settings,
  chart: BarChart3,
  route: Route,
  shield: ShieldCheck,
}

const roleLabels: Record<UserRole, string> = {
  cidadao: 'Cidadão',
  operador: 'Operador',
  tecnico_autarquia: 'Téc. Autarquia',
  tecnico_ccdr: 'Téc. CCDR',
  admin: 'Administrador',
  guest: 'Visitante',
}

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
  role: UserRole
}

export function Sidebar({ collapsed, onToggle, role }: SidebarProps) {
  const router = useRouterState()
  const currentPath = router.location.pathname
  const navItems = navByRole[role] ?? navByRole.cidadao

  return (
    <aside
      className={cn(
        'flex flex-col h-full bg-sidebar border-r border-sidebar-border transition-all duration-300',
        collapsed ? 'w-16' : 'w-60',
      )}
    >
      {/* Logo */}
      <div className={cn(
        'flex border-b border-sidebar-border shrink-0 transition-all',
        collapsed ? 'flex-col items-center py-4 gap-4 h-auto' : 'items-center h-16 px-4 justify-between'
      )}>
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 shrink-0">
            <Leaf className="w-5 h-5 text-primary" />
          </div>
          {!collapsed && (
            <span className="font-bold text-lg text-sidebar-foreground tracking-tight">ecoBairro</span>
          )}
        </div>
        <button
          onClick={onToggle}
          className="flex items-center justify-center w-8 h-8 rounded-lg text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors shrink-0"
          title={collapsed ? "Expandir menu" : "Colapsar menu"}
        >
          <ChevronLeft className={cn("w-5 h-5 shrink-0 transition-transform", collapsed && "rotate-180")} />
        </button>
      </div>

      {/* Role badge */}
      {!collapsed && (
        <div className="px-4 py-3 border-b border-sidebar-border">
          <Badge variant="secondary" className="text-xs w-full justify-center">
            {roleLabels[role]}
          </Badge>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
        {navItems.map((item) => {
          const Icon = iconMap[item.icon] ?? LayoutDashboard
          const isActive = currentPath === item.href || (item.href !== '/dashboard' && currentPath.startsWith(item.href))
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground',
                collapsed ? 'justify-center w-[42px] h-[42px] mx-auto px-0' : '',
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Footer / Definições */}
      <div className="p-3 mt-auto shrink-0 border-t border-sidebar-border">
        <Link
          to="/configuracoes"
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
            currentPath.startsWith('/configuracoes')
              ? 'bg-sidebar-accent text-sidebar-accent-foreground'
              : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground',
            collapsed ? 'justify-center w-[42px] h-[42px] mx-auto px-0' : '',
          )}
          title="Definições"
        >
          <Settings className="w-5 h-5 shrink-0" />
          {!collapsed && <span>Definições</span>}
        </Link>
      </div>
    </aside>
  )
}
