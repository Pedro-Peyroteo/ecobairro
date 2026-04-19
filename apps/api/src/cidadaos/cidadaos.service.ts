import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import type {
  CitizenSelfProfileResponse,
  UpdateCitizenSelfProfileRequest,
  UserRole as ContractUserRole,
} from '@ecobairro/contracts';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class CidadaosService {
  private readonly prisma: PrismaService;

  constructor(@Inject(PrismaService) prisma: PrismaService) {
    this.prisma = prisma;
  }

  async getMe(userId: string, role: ContractUserRole): Promise<CitizenSelfProfileResponse> {
    assertCitizen(role);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        cidadaoPerfil: true,
      },
    });

    if (!user || user.eliminadoEm || !user.cidadaoPerfil) {
      throw new NotFoundException('Citizen profile not found');
    }

    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      role: 'CIDADAO',
      email_verified: user.emailVerified,
      nome_completo: user.cidadaoPerfil.nomeCompleto,
      gamification_opt_in: user.cidadaoPerfil.gamificationOptIn,
      notificacao_prefs: asJsonObject(user.cidadaoPerfil.notificacaoPrefs),
      dashboard_widgets: asJsonObject(user.cidadaoPerfil.dashboardWidgets),
      criado_em: user.criadoEm.toISOString(),
    };
  }

  async updateMe(
    userId: string,
    role: ContractUserRole,
    input: UpdateCitizenSelfProfileRequest,
  ): Promise<CitizenSelfProfileResponse> {
    assertCitizen(role);

    await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        include: { cidadaoPerfil: true },
      });

      if (!user || user.eliminadoEm || !user.cidadaoPerfil) {
        throw new NotFoundException('Citizen profile not found');
      }

      await tx.user.update({
        where: { id: userId },
        data: {
          phone: input.phone ?? user.phone,
        },
      });

      await tx.cidadaoPerfil.update({
        where: { userId },
        data: buildProfileUpdateData(input),
      });
    });

    return this.getMe(userId, role);
  }

  async reconsentirRgpd(
    userId: string,
    role: ContractUserRole,
    versao: string,
  ): Promise<{ rgpd_version: string; rgpd_accepted_at: string }> {
    assertCitizen(role);

    const perfil = await this.prisma.cidadaoPerfil.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!perfil) throw new NotFoundException('Perfil não encontrado');

    const agora = new Date();
    await this.prisma.cidadaoPerfil.update({
      where: { userId },
      data: {
        rgpdAccepted: true,
        rgpdVersion: versao,
        rgpdAcceptedAt: agora,
      },
    });

    return { rgpd_version: versao, rgpd_accepted_at: agora.toISOString() };
  }

  async deletarConta(userId: string, role: ContractUserRole): Promise<void> {
    assertCitizen(role);
    await this.prisma.user.update({
      where: { id: userId },
      data: { eliminadoEm: new Date() },
    });
  }
}

function assertCitizen(role: ContractUserRole): asserts role is 'CIDADAO' {
  if (role !== UserRole.CIDADAO) {
    throw new ForbiddenException('Only citizens can access this route');
  }
}

function asJsonObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function buildProfileUpdateData(
  input: UpdateCitizenSelfProfileRequest,
): Prisma.CidadaoPerfilUpdateInput {
  const data: Prisma.CidadaoPerfilUpdateInput = {};

  if (input.nome_completo !== undefined) {
    data.nomeCompleto = input.nome_completo;
  }

  if (input.gamification_opt_in !== undefined) {
    data.gamificationOptIn = input.gamification_opt_in;
  }

  if (input.notificacao_prefs !== undefined) {
    data.notificacaoPrefs = input.notificacao_prefs as Prisma.InputJsonValue;
  }

  if (input.dashboard_widgets !== undefined) {
    data.dashboardWidgets = input.dashboard_widgets as Prisma.InputJsonValue;
  }

  return data;
}
