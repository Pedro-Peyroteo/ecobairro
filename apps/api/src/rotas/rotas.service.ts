import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import type { RotaRecord } from '@ecobairro/contracts';
import type { UpdateRotaDto } from './dto/update-rota.dto';

function mapRow(r: {
  id: string;
  nome: string;
  operador: string;
  estado: string;
  ecopontos: number;
  distancia: string;
  duracao: string;
  waypoints: unknown;
  cor: string;
}): RotaRecord {
  return {
    id: r.id,
    nome: r.nome,
    operador: r.operador,
    estado: r.estado as RotaRecord['estado'],
    ecopontos: r.ecopontos,
    distancia: r.distancia,
    duracao: r.duracao,
    waypoints: r.waypoints as [number, number][],
    cor: r.cor,
  };
}

@Injectable()
export class RotasService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    const rows = await this.prisma.rota.findMany({
      orderBy: { criadoEm: 'asc' },
    });
    return { rotas: rows.map(mapRow), total: rows.length };
  }

  async update(id: string, dto: UpdateRotaDto): Promise<RotaRecord> {
    const row = await this.prisma.rota.update({
      where: { id },
      data: {
        ...(dto.estado !== undefined && { estado: dto.estado }),
        ...(dto.operador !== undefined && { operador: dto.operador }),
      },
    });
    return mapRow(row);
  }
}
