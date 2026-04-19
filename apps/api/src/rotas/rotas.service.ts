import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import type { CreateRotaDto, UpdateRotaEstadoDto } from './dto/create-rota.dto';
import type { RotaExecucaoItem } from '@ecobairro/contracts';
import type { UserRole } from '@ecobairro/contracts';

const OP_ROLES: UserRole[] = ['OPERADOR_VEOLIA', 'TECNICO_AUTARQUIA', 'TECNICO_CCDR', 'ADMIN'];

@Injectable()
export class RotasService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(AuditService) private readonly audit: AuditService,
  ) {}

  async create(
    input: CreateRotaDto,
    operadorId: string,
    role: UserRole,
    ip: string,
  ): Promise<RotaExecucaoItem> {
    if (!OP_ROLES.includes(role)) throw new ForbiddenException('Acesso não autorizado');

    const rota = await this.prisma.rotaExecucao.create({
      data: {
        zonaId: input.zonaId,
        operadorId,
        dataExecucao: new Date(input.dataExecucao),
        estado: 'PLANEADA',
        ecopontos: input.ecopontos ?? [],
        notas: input.notas,
      },
    });

    this.audit.log({
      actorId: operadorId,
      acao: 'ROTA_CRIADA',
      entidade: 'rotas_execucao',
      entidadeId: rota.id,
      ip,
    });

    return this.toItem(rota);
  }

  async list(zonaId?: string, operadorId?: string): Promise<RotaExecucaoItem[]> {
    const rotas = await this.prisma.rotaExecucao.findMany({
      where: {
        ...(zonaId ? { zonaId } : {}),
        ...(operadorId ? { operadorId } : {}),
      },
      orderBy: { dataExecucao: 'desc' },
      take: 50,
    });
    return rotas.map(this.toItem);
  }

  async findOne(id: string): Promise<RotaExecucaoItem> {
    const rota = await this.prisma.rotaExecucao.findUnique({ where: { id } });
    if (!rota) throw new NotFoundException(`Rota ${id} não encontrada`);
    return this.toItem(rota);
  }

  async update(
    id: string,
    input: UpdateRotaEstadoDto,
    operadorId: string,
    role: UserRole,
    ip: string,
  ): Promise<RotaExecucaoItem> {
    if (!OP_ROLES.includes(role)) throw new ForbiddenException('Acesso não autorizado');

    const rota = await this.prisma.rotaExecucao.findUnique({ where: { id } });
    if (!rota) throw new NotFoundException(`Rota ${id} não encontrada`);

    const updated = await this.prisma.rotaExecucao.update({
      where: { id },
      data: {
        estado: input.estado,
        notas: input.notas ?? rota.notas,
        ...(input.ecopontos !== undefined ? { ecopontos: input.ecopontos } : {}),
        ...(input.estado === 'CONCLUIDA' ? { concluidaEm: new Date() } : {}),
      },
    });

    this.audit.log({
      actorId: operadorId,
      acao: 'ROTA_ATUALIZADA',
      entidade: 'rotas_execucao',
      entidadeId: id,
      detalhes: { estado: input.estado },
      ip,
    });

    return this.toItem(updated);
  }

  private toItem(r: {
    id: string;
    zonaId: string;
    operadorId: string;
    dataExecucao: Date;
    estado: string;
    ecopontos: string[];
    notas: string | null;
    criadoEm: Date;
    concluidaEm: Date | null;
  }): RotaExecucaoItem {
    return {
      id: r.id,
      zona_id: r.zonaId,
      operador_id: r.operadorId,
      data_execucao: r.dataExecucao.toISOString(),
      estado: r.estado,
      ecopontos: r.ecopontos,
      notas: r.notas,
      criado_em: r.criadoEm.toISOString(),
      concluida_em: r.concluidaEm?.toISOString() ?? null,
    };
  }
}
