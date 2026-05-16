import { Inject, Injectable } from '@nestjs/common';
import { ReportStatus, UserRole } from '@prisma/client';
import type { HomeFeedResponse } from '@ecobairro/contracts';
import type { AuthenticatedUser } from '../auth/auth.types';
import { PrismaService } from '../database/prisma.service';

const datePt = new Intl.DateTimeFormat('pt-PT', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

@Injectable()
export class HomeService {
  private readonly prisma: PrismaService;

  constructor(@Inject(PrismaService) prisma: PrismaService) {
    this.prisma = prisma;
  }

  async getFeed(user: AuthenticatedUser | null): Promise<HomeFeedResponse> {
    const isCitizen = user?.role === 'CIDADAO';
    const currentUser =
      user == null
        ? null
        : await this.prisma.user.findUnique({
            where: { id: user.userId },
            include: { cidadaoPerfil: true },
          });

    const [ecopontos, partilhas, noticias, comunidadePax] = await Promise.all([
      this.prisma.ecoponto.findMany({
        where: { ativo: true },
        orderBy: { ordem: 'asc' },
      }),
      this.prisma.partilha.findMany({
        where:
          user == null
            ? undefined
            : {
                OR: [{ userId: user.userId }, { userId: null }],
              },
        orderBy: { criadoEm: 'desc' },
        take: 10,
      }),
      this.prisma.noticia.findMany({
        orderBy: { publishedAt: 'desc' },
        take: 6,
      }),
      this.prisma.user.count({
        where: { role: UserRole.CIDADAO, eliminadoEm: null },
      }),
    ]);

    const alerta =
      ecopontos.length === 0
        ? null
        : ecopontos.reduce((a, b) => (a.ocupacao >= b.ocupacao ? a : b));

    let personalTotal = 0;
    let personalResolved = 0;

    if (isCitizen && user) {
      [personalTotal, personalResolved] = await Promise.all([
        this.prisma.report.count({ where: { userId: user.userId } }),
        this.prisma.report.count({
          where: { userId: user.userId, status: ReportStatus.RESOLVIDO },
        }),
      ]);
    }

    const ativos = Math.max(personalTotal - personalResolved, 0);
    const progresso =
      personalTotal > 0
        ? Math.round((personalResolved / personalTotal) * 100)
        : 0;

    const proximoNivel =
      personalTotal === 0
        ? 'Reciclador Avançado'
        : progresso >= 80
          ? 'Mestre Reciclador'
          : 'Reciclador Avançado';

    const pontos = Math.min(500, personalResolved * 80 + ativos * 15);
    const pontosProximo = 500;
    const nivel = pontos >= 400 ? 'Reciclador Avançado' : 'Reciclador';

    const reciclagemKg = personalResolved * 5;
    const arvoresEquivalentes = Math.max(0, Math.floor(personalResolved / 2));

    return {
      ecopontos: ecopontos.map((e) => ({
        id: e.id,
        nome: e.nome,
        distancia: e.distanciaLabel,
        ocupacao: e.ocupacao,
        map_url: e.mapTileUrl ?? '',
      })),
      partilhas: partilhas.map((p) => ({
        id: p.id,
        titulo: p.titulo,
        utilizador: p.autorNome,
        zona: p.zona,
      })),
      noticias: noticias.map((n) => ({
        id: n.id,
        imagem_url: n.imagemUrl,
        titulo: n.titulo,
        resumo: n.resumo,
        data: datePt.format(n.publishedAt),
        tempo_leitura: `${n.tempoLeituraMin} min`,
      })),
      alerta: alerta
        ? { nome: alerta.nome, ocupacao: alerta.ocupacao }
        : null,
      viewer:
        currentUser == null
          ? null
          : {
              id: currentUser.id,
              nome: currentUser.cidadaoPerfil?.nomeCompleto ?? null,
              email: currentUser.email,
              role: currentUser.role,
            },
      gamification: {
        nivel,
        pontos,
        pontos_proximo: pontosProximo,
      },
      impacto: {
        reciclagem_kg: reciclagemKg,
        comunidade_pax: comunidadePax,
        arvores_equivalentes: arvoresEquivalentes,
      },
      reports: {
        ativos,
        resolvidos: personalResolved,
        total: personalTotal,
        progresso,
        proximo_nivel: proximoNivel,
      },
    };
  }
}
