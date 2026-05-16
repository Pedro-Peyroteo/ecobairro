import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import type {
  ListUsersQuery,
  ListUsersResponse,
  UserRecord,
  UserRole as ContractRole,
} from '@ecobairro/contracts';
import { PrismaService } from '../database/prisma.service';

const DB_ROLE_LABEL: Record<UserRole, string> = {
  CIDADAO:            'cidadao',
  OPERADOR_VEOLIA:    'operador',
  TECNICO_AUTARQUIA:  'tecnico_autarquia',
  TECNICO_CCDR:       'tecnico_ccdr',
  ADMIN:              'admin',
};

@Injectable()
export class UsersService {
  private readonly prisma: PrismaService;

  constructor(@Inject(PrismaService) prisma: PrismaService) {
    this.prisma = prisma;
  }

  async list(
    callerRole: ContractRole,
    query: ListUsersQuery,
  ): Promise<ListUsersResponse> {
    if (callerRole !== 'ADMIN') {
      throw new ForbiddenException('Only admins can list users');
    }

    const page     = coerce(query.page,     1);
    const pageSize = coerce(query.pageSize, 20);
    const skip     = (page - 1) * pageSize;

    const where: Prisma.UserWhereInput = {
      eliminadoEm: null,
      ...(query.role
        ? { role: roleFromString(query.role) }
        : {}),
      ...(query.ativo !== undefined
        ? query.ativo
          ? { eliminadoEm: null }
          : { NOT: { eliminadoEm: null } }
        : {}),
      ...(query.q
        ? {
            OR: [
              { email: { contains: query.q, mode: 'insensitive' } },
              { cidadaoPerfil: { nomeCompleto: { contains: query.q, mode: 'insensitive' } } },
            ],
          }
        : {}),
    };

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        orderBy: { criadoEm: 'desc' },
        skip,
        take: pageSize,
        include: { cidadaoPerfil: { select: { nomeCompleto: true } } },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      users: rows.map(r => mapRow(r)),
      total,
      page,
      pageSize,
    };
  }
}

function mapRow(u: {
  id: string;
  email: string;
  role: UserRole;
  criadoEm: Date;
  eliminadoEm: Date | null;
  cidadaoPerfil: { nomeCompleto: string | null } | null;
}): UserRecord {
  return {
    id:         u.id,
    email:      u.email,
    role:       DB_ROLE_LABEL[u.role],
    nome:       u.cidadaoPerfil?.nomeCompleto ?? null,
    ativo:      u.eliminadoEm === null,
    criado_em:  u.criadoEm.toISOString(),
  };
}

function roleFromString(s: string): UserRole | undefined {
  const map: Record<string, UserRole> = {
    cidadao:           UserRole.CIDADAO,
    operador:          UserRole.OPERADOR_VEOLIA,
    tecnico_autarquia: UserRole.TECNICO_AUTARQUIA,
    tecnico_ccdr:      UserRole.TECNICO_CCDR,
    admin:             UserRole.ADMIN,
  };
  return map[s];
}

function coerce(v: number | string | undefined, fallback: number): number {
  if (typeof v === 'number' && Number.isInteger(v) && v > 0) return v;
  if (typeof v === 'string') {
    const n = Number.parseInt(v, 10);
    if (Number.isInteger(n) && n > 0) return n;
  }
  return fallback;
}
