import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import type { TarefaRecord } from '@ecobairro/contracts';
import type { ListFilaDto } from './dto/list-fila.dto';
import type { UpdateTarefaDto } from './dto/update-tarefa.dto';

function mapRow(t: {
  id: string;
  titulo: string;
  local: string;
  tipo: string;
  prioridade: string;
  estado: string;
  atribuido: string | null;
  criadoEm: Date;
}): TarefaRecord {
  return {
    id: t.id,
    titulo: t.titulo,
    local: t.local,
    tipo: t.tipo,
    prioridade: t.prioridade as TarefaRecord['prioridade'],
    estado: t.estado as TarefaRecord['estado'],
    atribuido: t.atribuido,
    criado_em: t.criadoEm.toISOString(),
  };
}

@Injectable()
export class FilaService {
  private readonly prisma: PrismaService;
  constructor(@Inject(PrismaService) prisma: PrismaService) {
    this.prisma = prisma;
  }

  async list(query: ListFilaDto) {
    const where =
      query.estado && query.estado !== 'todos'
        ? { estado: query.estado }
        : {};

    const rows = await this.prisma.tarefa.findMany({
      where,
      orderBy: [{ criadoEm: 'asc' }],
    });

    return { tarefas: rows.map(mapRow), total: rows.length };
  }

  async update(id: string, dto: UpdateTarefaDto) {
    const row = await this.prisma.tarefa.update({
      where: { id },
      data: {
        ...(dto.prioridade !== undefined && { prioridade: dto.prioridade }),
        ...(dto.estado !== undefined && { estado: dto.estado }),
        ...(dto.atribuido !== undefined && { atribuido: dto.atribuido }),
      },
    });
    return mapRow(row);
  }
}
