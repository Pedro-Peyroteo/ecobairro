import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { Prisma, ReportStatus, UserRole } from '@prisma/client';
import type {
  QuizAchievement,
  QuizAchievementKey,
  QuizMeResponse,
  QuizRankingEntry,
  QuizUserStats,
} from '@ecobairro/contracts';
import { PrismaService } from '../database/prisma.service';
import type { AuthenticatedUser } from '../auth/auth.types';

const ACHIEVEMENTS: Array<{
  key: QuizAchievementKey;
  nome: string;
  desc: string;
}> = [
  { key: 'eco_sabio', nome: 'Eco-Sábio', desc: 'Acertou 10 quizzes seguidos' },
  { key: 'olho_vivo', nome: 'Olho Vivo', desc: 'Primeiro reporte resolvido' },
  { key: 'reciclagem_pro', nome: 'Reciclagem Pro', desc: '100kg reciclados este ano' },
  { key: 'mestre_da_rua', nome: 'Mestre da Rua', desc: 'Ativo em 5 zonas diferentes' },
  { key: 'lenda_urbana', nome: 'Lenda Urbana', desc: 'Ficou no Top 3 do mês' },
  { key: 'benfeitor', nome: 'Benfeitor', desc: '5 partilhas concluídas' },
];

function toDateKeyUTC(d: Date): string {
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

function computeStreakFromResolvedDates(resolvedDates: Date[]): number {
  if (resolvedDates.length === 0) return 0;
  const unique = new Set(resolvedDates.map(toDateKeyUTC));
  const latest = resolvedDates[0]!;
  let cursor = new Date(toDateKeyUTC(latest) + 'T00:00:00.000Z'); // start at latest date
  let streak = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const key = toDateKeyUTC(cursor);
    if (!unique.has(key)) break;
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}

function computeAvatar(nomeCompleto: string | null, email: string): string {
  const fallback = email.split('@')[0] ?? 'U';
  const base = (nomeCompleto ?? fallback).trim();
  const parts = base.split(/\s+/).filter(Boolean);
  const initials = parts.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '?').join('');
  return initials.padEnd(2, '?');
}

function levelFromPoints(pontos: number): { nivel: string; proximoNivel: string; curMin: number; curMax: number } {
  if (pontos < 500) {
    return { nivel: 'Iniciante', proximoNivel: 'Eco-Guerreiro', curMin: 0, curMax: 500 };
  }
  if (pontos < 1000) {
    return { nivel: 'Eco-Guerreiro', proximoNivel: 'Guardião Verde', curMin: 500, curMax: 1000 };
  }
  if (pontos < 1500) {
    return { nivel: 'Guardião Verde', proximoNivel: 'Eco-Guardiões', curMin: 1000, curMax: 1500 };
  }
  return { nivel: 'Eco-Guardiões', proximoNivel: 'Líder da Reciclagem', curMin: 1500, curMax: 2000 };
}

@Injectable()
export class GamificationService {
  private readonly prisma: PrismaService;

  constructor(@Inject(PrismaService) prisma: PrismaService) {
    this.prisma = prisma;
  }

  async getQuizMe(user: AuthenticatedUser): Promise<QuizMeResponse> {
    if (user.role !== UserRole.CIDADAO) {
      throw new ForbiddenException('Only citizens can access quiz stats');
    }

    // Active challenge (optional; fallback if missing in DB).
    const now = new Date();
    const year = now.getUTCFullYear();

    const challenge = await this.prisma.quizDesafio.findFirst({
      where: { ativo: true, ano: year },
      orderBy: { criadoEm: 'desc' },
    });

    const hero = {
      titulo: challenge?.titulo ?? `Herói da Reciclagem ${year}`,
      bonus_xp: challenge?.bonusXp ?? 50,
      tempo_limite_seconds: challenge?.tempoLimiteMin != null ? challenge.tempoLimiteMin * 60 : 120,
    };

    const [resolvedCount, resolvedDates, partilhasCount] = await Promise.all([
      this.prisma.report.count({
        where: { userId: user.userId, status: ReportStatus.RESOLVIDO },
      }),
      this.prisma.report.findMany({
        where: { userId: user.userId, status: ReportStatus.RESOLVIDO },
        select: { criadoEm: true },
        orderBy: { criadoEm: 'desc' },
      }),
      this.prisma.partilha.count({
        where: { userId: user.userId },
      }),
    ]);

    const streak = computeStreakFromResolvedDates(resolvedDates.map((r) => r.criadoEm));
    const pontos = resolvedCount * 100 + partilhasCount * 50;

    const lvl = levelFromPoints(pontos);
    const faltamPts = Math.max(lvl.curMax - pontos, 0);
    const xp = Math.max(
      0,
      Math.min(100, Math.round(((pontos - lvl.curMin) / Math.max(lvl.curMax - lvl.curMin, 1)) * 100)),
    );

    // Ranking: top citizens by points (all-time).
    const citizens = await this.prisma.user.findMany({
      where: { role: UserRole.CIDADAO, eliminadoEm: null },
      select: { id: true, email: true, cidadaoPerfil: { select: { nomeCompleto: true } } },
    });

    const rankings = await Promise.all(
      citizens.map(async (c) => {
        const [rResolved, rPartilhas] = await Promise.all([
          this.prisma.report.count({ where: { userId: c.id, status: ReportStatus.RESOLVIDO } }),
          this.prisma.partilha.count({ where: { userId: c.id } }),
        ]);
        const pontosC = rResolved * 100 + rPartilhas * 50;
        const nome = c.cidadaoPerfil?.nomeCompleto ?? c.email;
        const avatar = computeAvatar(c.cidadaoPerfil?.nomeCompleto ?? null, c.email);
        return { id: c.id, nome, pontos: pontosC, avatar };
      }),
    );

    rankings.sort((a, b) => b.pontos - a.pontos);
    const myIndex = rankings.findIndex((r) => r.id === user.userId);
    const posicao = myIndex >= 0 ? myIndex + 1 : 0;

    const top = rankings.slice(0, 5).map((r) => ({
      id: r.id,
      nome: r.nome,
      pontos: r.pontos,
      avatar: r.avatar,
      isMe: r.id === user.userId,
    })) satisfies QuizRankingEntry[];

    // Monthly ranking for "Lenda Urbana"
    const monthStart = new Date(Date.UTC(year, now.getUTCMonth(), 1));
    const monthEnd = new Date(Date.UTC(year, now.getUTCMonth() + 1, 1));

    const monthRankings = await Promise.all(
      citizens.map(async (c) => {
        const [rResolvedMonth, pPartilhasMonth] = await Promise.all([
          this.prisma.report.count({
            where: {
              userId: c.id,
              status: ReportStatus.RESOLVIDO,
              criadoEm: { gte: monthStart, lt: monthEnd },
            },
          }),
          this.prisma.partilha.count({
            where: {
              userId: c.id,
              criadoEm: { gte: monthStart, lt: monthEnd },
            },
          }),
        ]);
        const pontosM = rResolvedMonth * 100 + pPartilhasMonth * 50;
        return { id: c.id, pontos: pontosM };
      }),
    );

    monthRankings.sort((a, b) => b.pontos - a.pontos);
    const myMonthIndex = monthRankings.findIndex((r) => r.id === user.userId);
    const myMonthRank = myMonthIndex >= 0 ? myMonthIndex + 1 : 999;
    const isTop3Month = myMonthRank <= 3;

    // Extra metrics for achievements.
    const [distinctLocalCount, resolvedKgApprox] = await Promise.all([
      this.prisma.report
        .findMany({
          where: { userId: user.userId, status: ReportStatus.RESOLVIDO },
          select: { local: true },
        })
        .then((rows) => new Set(rows.map((r) => r.local)).size),
      Promise.resolve(resolvedCount * 5),
    ]);

    const conquistas: QuizAchievement[] = ACHIEVEMENTS.map((a) => {
      let unlocked = false;
      switch (a.key) {
        case 'eco_sabio':
          unlocked = streak >= 10;
          break;
        case 'olho_vivo':
          unlocked = resolvedCount >= 1;
          break;
        case 'reciclagem_pro':
          unlocked = resolvedKgApprox >= 100;
          break;
        case 'mestre_da_rua':
          unlocked = distinctLocalCount >= 5;
          break;
        case 'lenda_urbana':
          unlocked = isTop3Month;
          break;
        case 'benfeitor':
          unlocked = partilhasCount >= 5;
          break;
      }
      return {
        key: a.key,
        nome: a.nome,
        desc: a.desc,
        unlocked,
      };
    });

    const userStats: QuizUserStats = {
      pontos,
      nivel: lvl.nivel,
      proximoNivel: lvl.proximoNivel,
      xp,
      faltam_pts: faltamPts,
      streak,
      posicao,
    };

    return {
      hero,
      userStats,
      ranking: top,
      conquistas,
    };
  }
}

