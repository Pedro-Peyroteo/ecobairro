import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import type { CreatePartilhaDto, CreateMensagemPartilhaDto } from './dto/create-partilha.dto';
import type { PartilhaItem, PartilhaMensagemItem } from '@ecobairro/contracts';

@Injectable()
export class PartilhasService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async create(input: CreatePartilhaDto, cidadaoId: string): Promise<PartilhaItem> {
    if (!input.disclaimerAceite) {
      throw new BadRequestException('O disclaimer deve ser aceite antes de partilhar');
    }

    const partilha = await this.prisma.partilhaMaterial.create({
      data: {
        cidadaoId,
        titulo: input.titulo,
        descricao: input.descricao,
        categoria: input.categoria,
        zonaId: input.zonaId,
        fotoUrl: input.fotoUrl,
        disclaimerAceite: true,
        estado: 'DISPONIVEL',
      },
    });

    return this.toItem(partilha);
  }

  async list(estado?: string): Promise<PartilhaItem[]> {
    const items = await this.prisma.partilhaMaterial.findMany({
      where: {
        eliminadoEm: null,
        ...(estado ? { estado } : {}),
      },
      orderBy: { criadoEm: 'desc' },
      take: 50,
    });
    return items.map(this.toItem);
  }

  async findOne(id: string): Promise<PartilhaItem> {
    const item = await this.prisma.partilhaMaterial.findUnique({
      where: { id },
    });
    if (!item || item.eliminadoEm) throw new NotFoundException(`Partilha ${id} não encontrada`);
    return this.toItem(item);
  }

  async close(id: string, cidadaoId: string): Promise<void> {
    const item = await this.prisma.partilhaMaterial.findUnique({
      where: { id },
      select: { cidadaoId: true, eliminadoEm: true },
    });
    if (!item || item.eliminadoEm) throw new NotFoundException('Partilha não encontrada');
    if (item.cidadaoId !== cidadaoId) throw new ForbiddenException('Não é o dono desta partilha');

    await this.prisma.partilhaMaterial.update({
      where: { id },
      data: { estado: 'CONCLUIDO', eliminadoEm: new Date() },
    });
  }

  async addMensagem(
    partilhaId: string,
    input: CreateMensagemPartilhaDto,
    remetenteId: string,
  ): Promise<PartilhaMensagemItem> {
    const partilha = await this.prisma.partilhaMaterial.findUnique({
      where: { id: partilhaId },
      select: { id: true, eliminadoEm: true },
    });
    if (!partilha || partilha.eliminadoEm) throw new NotFoundException('Partilha não encontrada');

    const msg = await this.prisma.partilhaMensagem.create({
      data: { partilhaId, remetenteId, texto: input.texto },
    });

    return {
      id: msg.id,
      partilha_id: msg.partilhaId,
      remetente_id: msg.remetenteId,
      texto: msg.texto,
      criado_em: msg.criadoEm.toISOString(),
    };
  }

  async listMensagens(partilhaId: string): Promise<PartilhaMensagemItem[]> {
    const msgs = await this.prisma.partilhaMensagem.findMany({
      where: { partilhaId },
      orderBy: { criadoEm: 'asc' },
    });
    return msgs.map((m) => ({
      id: m.id,
      partilha_id: m.partilhaId,
      remetente_id: m.remetenteId,
      texto: m.texto,
      criado_em: m.criadoEm.toISOString(),
    }));
  }

  private toItem(p: {
    id: string;
    cidadaoId: string;
    titulo: string;
    descricao: string;
    categoria: string;
    estado: string;
    zonaId: string | null;
    fotoUrl: string | null;
    criadoEm: Date;
    atualizadoEm: Date;
  }): PartilhaItem {
    return {
      id: p.id,
      cidadao_id: p.cidadaoId,
      titulo: p.titulo,
      descricao: p.descricao,
      categoria: p.categoria,
      estado: p.estado,
      zona_id: p.zonaId,
      foto_url: p.fotoUrl,
      criado_em: p.criadoEm.toISOString(),
      atualizado_em: p.atualizadoEm.toISOString(),
    };
  }
}
