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
  ListEcopontosQuery,
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
  codigoPostal: string | null;
  zona: string | null;
  distanciaLabel: string;
  ocupacao: number;
  tipos: unknown;
  sensorEstado: string;
  ultimaRecolha: string | null;
  ultimaAtualizacao: string | null;
  lat: number;
  lng: number;
  bateria: number | null;
  temperatura: number | null;
  ativo: boolean;
  ordem: number;
}): EcopontoRecord {
  const tipos = Array.isArray(row.tipos) ? (row.tipos as string[]) : [];
  return {
    id: row.id,
    nome: row.nome,
    codigo: row.codigo,
    morada: row.morada,
    codigo_postal: row.codigoPostal,
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
    bateria: row.bateria,
    temperatura: row.temperatura,
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

  async list(query: ListEcopontosQuery = {}): Promise<ListEcopontosResponse> {
    const { q, zona, codigo_postal, tipo, nivel, todos } = query;
    const apenasAtivos = !todos;

    // Condições dinâmicas
    const where: Record<string, unknown> = {};
    if (apenasAtivos) where['ativo'] = true;

    if (zona) where['zona'] = { equals: zona, mode: 'insensitive' };

    if (codigo_postal) {
      where['codigoPostal'] = { startsWith: codigo_postal, mode: 'insensitive' };
    }

    if (q) {
      const contains = { contains: q, mode: 'insensitive' };
      where['OR'] = [
        { nome: contains },
        { morada: contains },
        { codigoPostal: contains },
        { zona: contains },
      ];
    }

    const rows = await this.prisma.ecoponto.findMany({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      where: where as any,
      orderBy: { ordem: 'asc' },
    });

    // Filtro em memória para tipos (JSON array) e nível (computado)
    let filtered = rows.map(mapRow);
    if (tipo) {
      filtered = filtered.filter(r => r.tipos.includes(tipo));
    }
    if (nivel) {
      filtered = filtered.filter(r => r.nivel === nivel);
    }

    return { ecopontos: filtered, total: filtered.length };
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
