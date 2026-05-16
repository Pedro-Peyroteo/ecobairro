import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import type { CampanhaRecord } from '@ecobairro/contracts';
import type { CreateCampanhaDto } from './dto/create-campanha.dto';
import type { UpdateCampanhaDto } from './dto/update-campanha.dto';
import type { ListCampanhasDto } from './dto/list-campanhas.dto';

function mapRow(c: {
  id: string;
  titulo: string;
  corpo: string;
  estado: string;
  dataValidade: Date;
  autor: string;
  criadoEm: Date;
}): CampanhaRecord {
  return {
    id: c.id,
    titulo: c.titulo,
    corpo: c.corpo,
    estado: c.estado as CampanhaRecord['estado'],
    data_criacao: c.criadoEm.toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }),
    data_validade: c.dataValidade.toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }),
    autor: c.autor,
  };
}

function coerce(v: number | undefined, def: number): number {
  return v && v > 0 ? v : def;
}

@Injectable()
export class CampanhasService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListCampanhasDto) {
    const page = coerce(query.page, 1);
    const pageSize = coerce(query.pageSize, 20);
    const skip = (page - 1) * pageSize;

    const where = {
      ...(query.estado ? { estado: query.estado } : {}),
      ...(query.q
        ? { titulo: { contains: query.q, mode: 'insensitive' as const } }
        : {}),
    };

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.campanha.findMany({
        where,
        orderBy: { criadoEm: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.campanha.count({ where }),
    ]);

    return { campanhas: rows.map(mapRow), total, page, pageSize };
  }

  async create(dto: CreateCampanhaDto, userId: string): Promise<CampanhaRecord> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, cidadaoPerfil: { select: { nomeCompleto: true } } },
    });
    const autor =
      user?.cidadaoPerfil?.nomeCompleto ??
      user?.email?.split('@')[0] ??
      'Câmara de Aveiro';

    const row = await this.prisma.campanha.create({
      data: {
        titulo: dto.titulo,
        corpo: dto.corpo,
        dataValidade: new Date(dto.dataValidade),
        autor,
      },
    });
    return mapRow(row);
  }

  async update(id: string, dto: UpdateCampanhaDto): Promise<CampanhaRecord> {
    const row = await this.prisma.campanha.update({
      where: { id },
      data: {
        ...(dto.titulo !== undefined && { titulo: dto.titulo }),
        ...(dto.corpo !== undefined && { corpo: dto.corpo }),
        ...(dto.estado !== undefined && { estado: dto.estado }),
        ...(dto.dataValidade !== undefined && {
          dataValidade: new Date(dto.dataValidade),
        }),
      },
    });
    return mapRow(row);
  }
}
