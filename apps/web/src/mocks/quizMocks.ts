import { 
  Target, Medal, 
  Brain, Zap, Award, Star
} from 'lucide-react'

export const userStats = {
  pontos: 1250,
  nivel: 'Guardião Verde',
  proximoNivel: 'Eco-Guerreiro',
  xp: 75,
  streak: 5,
  posicao: 12
}

export const ranking = [
  { id: 1, nome: 'Ana Costa', pontos: 2450, avatar: 'AC' },
  { id: 2, nome: 'Pedro Vale', pontos: 2100, avatar: 'PV' },
  { id: 3, nome: 'Sílvia Reis', pontos: 1980, avatar: 'SR' },
  { id: 4, nome: 'João Silva', pontos: 1250, avatar: 'JS', isMe: true },
  { id: 5, nome: 'Marta Dias', pontos: 1100, avatar: 'MD' },
]

export const conquistas = [
  { id: 1, nome: 'Eco-Sábio', desc: 'Acertou 10 quizzes seguidos', icon: Brain, unlocked: true, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  { id: 2, nome: 'Olho Vivo', desc: 'Primeiro reporte resolvido', icon: Zap, unlocked: true, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  { id: 3, nome: 'Reciclagem Pro', desc: '100kg reciclados este ano', icon: Medal, unlocked: true, color: 'text-green-500', bg: 'bg-green-500/10' },
  { id: 4, nome: 'Mestre da Rua', desc: 'Ativo em 5 zonas diferentes', icon: Target, unlocked: false, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { id: 5, nome: 'Lenda Urbana', desc: 'Ficou no Top 3 do mês', icon: Star, unlocked: false, color: 'text-[var(--primary)]', bg: 'bg-[var(--primary)]/10' },
  { id: 6, nome: 'Benfeitor', desc: '5 partilhas concluídas', icon: Award, unlocked: false, color: 'text-rose-500', bg: 'bg-rose-500/10' },
]
