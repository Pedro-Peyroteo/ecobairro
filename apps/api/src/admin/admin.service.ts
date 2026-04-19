import {
  Injectable,
  Inject,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import bcrypt from 'bcrypt';
import { readNumberEnv } from '@ecobairro/config';
import { PrismaService } from '../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import type { CreateOperadorDto, UpdateOperadorDto } from './dto/create-operador.dto';
import type { OperadorDetail } from '@ecobairro/contracts';

const ALLOWED_OP_ROLES = ['OPERADOR_VEOLIA', 'TECNICO_AUTARQUIA', 'TECNICO_CCDR'] as const;
type OpRole = (typeof ALLOWED_OP_ROLES)[number];

@Injectable()
export class AdminService {
  private readonly bcryptRounds = readNumberEnv('BCRYPT_ROUNDS', 12);

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(AuditService) private readonly audit: AuditService,
  ) {}

  async createOperador(
    input: CreateOperadorDto,
    actorId: string,
    ip: string,
  ): Promise<OperadorDetail> {
    const role = (input.role ?? 'OPERADOR_VEOLIA') as OpRole;
    if (!ALLOWED_OP_ROLES.includes(role)) {
      throw new BadRequestException(
        `Role inválido. Permitidos: ${ALLOWED_OP_ROLES.join(', ')}`,
      );
    }

    const existing = await this.prisma.user.findUnique({
      where: { email: input.email.trim().toLowerCase() },
      select: { id: true },
    });
    if (existing) throw new ConflictException('Email já registado');

    const passwordHash = await bcrypt.hash(input.password, this.bcryptRounds);

    const user = await this.prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          email: input.email.trim().toLowerCase(),
          passwordHash,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          role: role as any,
        },
      });
      await tx.operadorPerfil.create({
        data: {
          userId: created.id,
          nomeCompleto: input.nomeCompleto,
          entidadeEmpregadora: input.entidadeEmpregadora,
          cargo: input.cargo,
          zonasResponsabilidade: input.zonasResponsabilidade ?? [],
        },
      });
      return created;
    });

    this.audit.log({
      actorId,
      acao: 'OPERADOR_CRIADO',
      entidade: 'users',
      entidadeId: user.id,
      detalhes: { role, entidade: input.entidadeEmpregadora },
      ip,
    });

    return this.findOperador(user.id);
  }

  async findOperador(userId: string): Promise<OperadorDetail> {
    const u = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        eliminadoEm: true,
        criadoEm: true,
        operadorPerfil: true,
      },
    });

    if (!u || u.eliminadoEm) throw new NotFoundException('Operador não encontrado');
    if (!u.operadorPerfil) throw new NotFoundException('Perfil de operador não encontrado');

    return {
      id: u.id,
      email: u.email,
      role: u.role as string,
      nome_completo: u.operadorPerfil.nomeCompleto,
      entidade_empregadora: u.operadorPerfil.entidadeEmpregadora,
      cargo: u.operadorPerfil.cargo ?? null,
      zonas_responsabilidade: u.operadorPerfil.zonasResponsabilidade,
      criado_em: u.criadoEm.toISOString(),
    };
  }

  async listOperadores(): Promise<OperadorDetail[]> {
    const users = await this.prisma.user.findMany({
      where: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        role: { in: ['OPERADOR_VEOLIA', 'TECNICO_AUTARQUIA', 'TECNICO_CCDR'] as any },
        eliminadoEm: null,
      },
      select: {
        id: true,
        email: true,
        role: true,
        criadoEm: true,
        operadorPerfil: true,
      },
      orderBy: { criadoEm: 'desc' },
    });

    return users
      .filter((u) => u.operadorPerfil)
      .map((u) => ({
        id: u.id,
        email: u.email,
        role: u.role as string,
        nome_completo: u.operadorPerfil!.nomeCompleto,
        entidade_empregadora: u.operadorPerfil!.entidadeEmpregadora,
        cargo: u.operadorPerfil!.cargo ?? null,
        zonas_responsabilidade: u.operadorPerfil!.zonasResponsabilidade,
        criado_em: u.criadoEm.toISOString(),
      }));
  }

  async updateOperador(
    userId: string,
    input: UpdateOperadorDto,
    actorId: string,
    ip: string,
  ): Promise<OperadorDetail> {
    const u = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, eliminadoEm: true, operadorPerfil: { select: { id: true } } },
    });

    if (!u || u.eliminadoEm || !u.operadorPerfil) {
      throw new NotFoundException('Operador não encontrado');
    }

    if (input.role) {
      const role = input.role as OpRole;
      if (!ALLOWED_OP_ROLES.includes(role)) {
        throw new BadRequestException(`Role inválido`);
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await this.prisma.user.update({ where: { id: userId }, data: { role: role as any } });
    }

    await this.prisma.operadorPerfil.update({
      where: { userId },
      data: {
        ...(input.nomeCompleto !== undefined && { nomeCompleto: input.nomeCompleto }),
        ...(input.entidadeEmpregadora !== undefined && {
          entidadeEmpregadora: input.entidadeEmpregadora,
        }),
        ...(input.cargo !== undefined && { cargo: input.cargo }),
        ...(input.zonasResponsabilidade !== undefined && {
          zonasResponsabilidade: input.zonasResponsabilidade,
        }),
      },
    });

    this.audit.log({
      actorId,
      acao: 'OPERADOR_ATUALIZADO',
      entidade: 'users',
      entidadeId: userId,
      ip,
    });

    return this.findOperador(userId);
  }

  async softDeleteOperador(
    userId: string,
    actorId: string,
    ip: string,
  ): Promise<void> {
    const u = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, eliminadoEm: true },
    });

    if (!u || u.eliminadoEm) throw new NotFoundException('Operador não encontrado');

    await this.prisma.user.update({
      where: { id: userId },
      data: { eliminadoEm: new Date() },
    });

    this.audit.log({
      actorId,
      acao: 'OPERADOR_DESATIVADO',
      entidade: 'users',
      entidadeId: userId,
      ip,
    });
  }
}
