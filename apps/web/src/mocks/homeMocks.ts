import { 
  PlusCircle, Truck, Trophy
} from 'lucide-react'

export const mockUser = { 
  nome: 'João Silva', 
  nivel: 'Reciclador', 
  pontos: 340, 
  pontosProximo: 500 
}

export const alertaCritico = { 
  nome: 'Ecoponto Mercado Central', 
  ocupacao: 95 
}

export const atalhos = [
  { label: 'Criar Reporte', icon: PlusCircle },
  { label: 'Pedir Recolha', icon: Truck },
  { label: 'Quiz Semanal', icon: Trophy },
]

export const ecopontos = [
  { id: 1, nome: 'Ecoponto Rossio', distancia: '250 m', ocupacao: 25, mapUrl: 'https://a.tile.openstreetmap.org/16/31336/24641.png' },
  { id: 2, nome: 'Ecoponto Mercado', distancia: '400 m', ocupacao: 95, mapUrl: 'https://b.tile.openstreetmap.org/16/31336/24640.png' },
  { id: 3, nome: 'Ecoponto Universidade', distancia: '800 m', ocupacao: 60, mapUrl: 'https://c.tile.openstreetmap.org/16/31335/24641.png' },
]

export const reports = { 
  ativos: 4, 
  resolvidos: 8, 
  total: 12, 
  progresso: 72, 
  proximoNivel: 'Reciclador Avançado' 
}

export const partilhas = [
  { id: 1, titulo: 'Frigorífico em bom estado', utilizador: 'Ana M.', zona: 'Rossio' },
  { id: 2, titulo: 'Cadeiras de jardim (x4)', utilizador: 'Carlos V.', zona: 'Vera Cruz' },
  { id: 3, titulo: 'Livros técnicos', utilizador: 'Sofia R.', zona: 'Glória' },
]

export const noticias = [
  {
    id: 1,
    imagem: 'https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?q=80&w=600&auto=format&fit=crop',
    titulo: 'Campanha de Limpeza do Rio',
    resumo: 'Próxima reunião marcada para sexta-feira às 15h. Venha ajudar a limpar as margens do Rio Vouga.',
    data: '20 Dez 2025',
    tempo: '3 min',
  },
  {
    id: 2,
    imagem: 'https://images.unsplash.com/photo-1604187351574-c75ca79f5807?q=80&w=600&auto=format&fit=crop',
    titulo: 'Novos Ecopontos Inteligentes',
    resumo: '15 novos equipamentos com sensores IoT e compactação solar instalados no centro de Aveiro.',
    data: '18 Dez 2025',
    tempo: '2 min',
  },
  {
    id: 3,
    imagem: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?q=80&w=600&auto=format&fit=crop',
    titulo: 'Compostagem Urbana no Parque',
    resumo: 'O município lança o programa de compostagem coletiva em 5 parques da cidade. Inscrições abertas.',
    data: '15 Dez 2025',
    tempo: '4 min',
  },
]
