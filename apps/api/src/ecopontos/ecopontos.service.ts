import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  CreateEcopontoRequest,
  EcopontoNivel,
  EcopontoRecord,
  EcopontoSensor,
  ListEcopontosResponse,
  UpdateEcopontoRequest,
  UserRole,
} from '@ecobairro/contracts';
import { PrismaService } from '../database/prisma.service';

function computeNivel(ocupacao: number): EcopontoNivel {
  if (ocupacao >= 95) return 'cheio';
  if (ocupacao >= 80) return 'alto';
  if (ocupacao >= 50) return 'medio';
  return 'baixo';
}

const WRITER_ROLES: UserRole[] = [
  'OPERADOR_VEOLIA',
  'TECNICO_AUTARQUIA',
  'TECNICO_CCDR',
  'ADMIN',
];

function assertWriter(role: UserRole): void {
  if (!WRITER_ROLES.includes(role)) {
    throw new ForbiddenException('Insufficient permissions');
  }
}

function mapRow(row: {
  id: string;
  nome: string;
  codigo: string | null;
  morada: string;
  zona: string | null;
  distanciaLabel: string;
  ocupacao: number;
  tipos: unknown;
  sensorEstado: string;
  ultimaRecolha: string | null;
  ultimaAtualizacao: string | null;
  lat: number;
  lng: number;
  ativo: boolean;
  ordem: number;
}): EcopontoRecord {
  const tipos = Array.isArray(row.tipos) ? (row.tipos as string[]) : [];
  return {
    id: row.id,
    nome: row.nome,
    codigo: row.codigo,
    morada: row.morada,
    zona: row.zona,
    distancia_label: row.distanciaLabel,
    ocupacao: row.ocupacao,
    nivel: computeNivel(row.ocupacao),
    tipos,
    sensor_estado: row.sensorEstado as EcopontoSensor,
    ultima_recolha: row.ultimaRecolha,
    ultima_atualizacao: row.ultimaAtualizacao,
    lat: row.lat,
    lng: row.lng,
    ativo: row.ativo,
    ordem: row.ordem,
  };
}

@Injectable()
export class EcopontosService {
  private readonly prisma: PrismaService;

  constructor(@Inject(PrismaService) prisma: PrismaService) {
    this.prisma = prisma;
  }

  async list(apenasAtivos = true): Promise<ListEcopontosResponse> {
    const rows = await this.prisma.ecoponto.findMany({
      where: apenasAtivos ? { ativo: true } : undefined,
      orderBy: { ordem: 'asc' },
    });
    return { ecopontos: rows.map(mapRow) };
  }

  async create(
    role: UserRole,
    input: CreateEcopontoRequest,
  ): Promise<EcopontoRecord> {
    assertWriter(role);
    const row = await this.prisma.ecoponto.create({
      data: {
        nome: input.nome,
        codigo: input.codigo ?? null,
        morada: input.morada,
        zona: input.zona ?? null,
        ocupacao: input.ocupacao,
        tipos: input.tipos ?? [],
        sensorEstado: input.sensor_estado ?? 'online',
        ultimaRecolha: input.ultima_recolha ?? null,
        lat: input.lat,
        lng: input.lng,
        ordem: input.ordem ?? 0,
      },
    });
    return mapRow(row);
  }

  async update(
    role: UserRole,
    id: string,
    input: UpdateEcopontoRequest,
  ): Promise<EcopontoRecord> {
    assertWriter(role);
    try {
      const row = await this.prisma.ecoponto.update({
        where: { id },
        data: {
          ...(input.nome !== undefined && { nome: input.nome }),
          ...(input.codigo !== undefined && { codigo: input.codigo }),
          ...(input.morada !== undefined && { morada: input.morada }),
          ...(input.zona !== undefined && { zona: input.zona }),
          ...(input.ocupacao !== undefined && { ocupacao: input.ocupacao }),
          ...(input.tipos !== undefined && { tipos: input.tipos }),
          ...(input.sensor_estado !== undefined && { sensorEstado: input.sensor_estado }),
          ...(input.ultima_recolha !== undefined && { ultimaRecolha: input.ultima_recolha }),
          ...(input.lat !== undefined && { lat: input.lat }),
          ...(input.lng !== undefined && { lng: input.lng }),
          ...(input.ativo !== undefined && { ativo: input.ativo }),
          ...(input.ordem !== undefined && { ordem: input.ordem }),
        },
      });
      return mapRow(row);
    } catch {
      throw new NotFoundException('Ecoponto not found');
    }
  }

  async remove(role: UserRole, id: string): Promise<void> {
    assertWriter(role);
    const result = await this.prisma.ecoponto.updateMany({
      where: { id },
      data: { ativo: false },
    });
    if (result.count === 0) {
      throw new NotFoundException('Ecoponto not found');
    }
  }
}
