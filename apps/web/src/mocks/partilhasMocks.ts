import { 
  CircleEllipsis, Sofa, Lamp, Book, Shirt 
} from 'lucide-react'

export const categorias = [
  { id: 'todos', label: 'Tudo', icon: CircleEllipsis },
  { id: 'moveis', label: 'Móveis', icon: Sofa },
  { id: 'eletro', label: 'Eletro', icon: Lamp },
  { id: 'livros', label: 'Livros', icon: Book },
  { id: 'roupa', label: 'Roupa', icon: Shirt },
]

export const partilhasMock = [
  { 
    id: 1, 
    titulo: 'Frigorífico Smeg em bom estado', 
    categoria: 'eletro', 
    zona: 'Rossio', 
    user: 'Ana Miranda', 
    imagem: 'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?q=80&w=600&auto=format&fit=crop',
    distancia: '400m de si',
    data: 'Hoje'
  },
  { 
    id: 2, 
    titulo: 'Sofá de 2 lugares (Cinza)', 
    categoria: 'moveis', 
    zona: 'Glória', 
    user: 'Carlos V.', 
    imagem: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=600&auto=format&fit=crop',
    distancia: '1.2km de si',
    data: 'Ontem'
  },
  { 
    id: 3, 
    titulo: 'Coleção de livros técnicos', 
    categoria: 'livros', 
    zona: 'Vera Cruz', 
    user: 'Sofia Roberto', 
    imagem: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?q=80&w=600&auto=format&fit=crop',
    distancia: '800m de si',
    data: '2 dias atrás'
  },
  { 
    id: 4, 
    titulo: 'Candeeiro de pé industrial', 
    categoria: 'eletro', 
    zona: 'Beira-Mar', 
    user: 'Ricardo P.', 
    imagem: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?q=80&w=600&auto=format&fit=crop',
    distancia: '300m de si',
    data: 'Hoje'
  },
  { 
    id: 5, 
    titulo: 'Mesa de centro em carvalho', 
    categoria: 'moveis', 
    zona: 'Rossio', 
    user: 'Marta S.', 
    imagem: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?q=80&w=600&auto=format&fit=crop',
    distancia: '500m de si',
    data: 'Ontem'
  },
  { 
    id: 6, 
    titulo: 'Casaco de inverno (M)', 
    categoria: 'roupa', 
    zona: 'Santiago', 
    user: 'Joana F.', 
    imagem: 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?q=80&w=600&auto=format&fit=crop',
    distancia: '1.5km de si',
    data: '3 dias atrás'
  }
]
