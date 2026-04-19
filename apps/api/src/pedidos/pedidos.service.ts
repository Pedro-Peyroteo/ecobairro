import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import type { CreatePedidoDto, UpdatePedidoEstadoDto } from './dto/create-pedido.dto';
import type { PedidoRecolhaItem } from '@ecobairro/contracts';
import type { UserRole } from '@ecobairro/contracts';

@Injectable()
export class PedidosService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async create(input: CreatePedidoDto, cidadaoId: string): Promise<PedidoRecolhaItem> {
    const pedido = await this.prisma.pedidoRecolha.create({
      data: {
        cidadaoId,
        morada: input.morada,
        tipoMaterial: input.tipoMaterial,
        volumeEstimado: input.volumeEstimado,
        fotoUrl: input.fotoUrl,
        notas: input.notas,
      },
    });
    return this.toItem(pedido);
  }

  async listMine(cidadaoId: string): Promise<PedidoRecolhaItem[]> {
    const items = await this.prisma.pedidoRecolha.findMany({
      where: { cidadaoId },
      orderBy: { criadoEm: 'desc' },
    });
    return items.map(this.toItem);
  }

  async listPendentes(role: UserRole): Promise<PedidoRecolhaItem[]> {
    if (!['OPERADOR_VEOLIA', 'TECNICO_AUTARQUIA', 'ADMIN'].includes(role)) {
      throw new ForbiddenException('Acesso não autorizado');
    }
    const items = await this.prisma.pedidoRecolha.findMany({
      where: { estado: 'PENDENTE' },
      orderBy: { criadoEm: 'asc' },
    });
    return items.map(this.toItem);
  }

  async updateEstado(
    id: string,
    input: UpdatePedidoEstadoDto,
    operadorId: string,
    role: UserRole,
  ): Promise<PedidoRecolhaItem> {
    if (!['OPERADOR_VEOLIA', 'TECNICO_AUTARQUIA', 'ADMIN'].includes(role)) {
      throw new ForbiddenException('Acesso não autorizado');
    }

    const pedido = await this.prisma.pedidoRecolha.findUnique({ where: { id } });
    if (!pedido) throw new NotFoundException(`Pedido ${id} não encontrado`);

    const updated = await this.prisma.pedidoRecolha.update({
      where: { id },
      data: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        estado: input.estado as any,
        notas: input.notas ?? pedido.notas,
        operadorId: pedido.operadorId ?? operadorId,
      },
    });

    return this.toItem(updated);
  }

  private toItem(p: {
    id: string;
    cidadaoId: string;
    morada: string;
    tipoMaterial: string;
    volumeEstimado: string | null;
    fotoUrl: string | null;
    estado: string;
    notas: string | null;
    criadoEm: Date;
    atualizadoEm: Date;
  }): PedidoRecolhaItem {
    return {
      id: p.id,
      cidadao_id: p.cidadaoId,
      morada: p.morada,
      tipo_material: p.tipoMaterial,
      volume_estimado: p.volumeEstimado,
      foto_url: p.fotoUrl,
      estado: p.estado,
      notas: p.notas,
      criado_em: p.criadoEm.toISOString(),
      atualizado_em: p.atualizadoEm.toISOString(),
    };
  }
}
