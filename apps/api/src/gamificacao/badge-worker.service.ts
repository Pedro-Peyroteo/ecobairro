import { Injectable, Inject, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { NotificacoesService } from '../notificacoes/notificacoes.service';

/**
 * Motor de atribuição automática de badges.
 * Chamado após eventos relevantes (report criado, quiz concluído, recolha concluída, etc.)
 *
 * Estrutura do campo `condicao` (JSONB do modelo Badge):
 * {
 *   tipo: 'MIN_REPORTS' | 'MIN_QUIZ_PONTUACAO' | 'MIN_RECOLHAS' | 'PRIMEIRO_REPORT' | ...
 *   valor?: number
 * }
 */
@Injectable()
export class BadgeWorkerService {
  private readonly logger = new Logger(BadgeWorkerService.name);

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(NotificacoesService) private readonly notif: NotificacoesService,
  ) {}

  /** Avaliar e atribuir badges elegíveis a um cidadão */
  async avaliar(cidadaoId: string): Promise<void> {
    const [allBadges, alreadyEarned] = await Promise.all([
      this.prisma.badge.findMany({ where: { ativo: true } }),
      this.prisma.cidadaoBadge.findMany({
        where: { cidadaoId },
        select: { badgeId: true },
      }),
    ]);

    const earnedIds = new Set(alreadyEarned.map((b) => b.badgeId));
    const eligible = allBadges.filter((b) => !earnedIds.has(b.id));

    for (const badge of eligible) {
      const condicao = badge.condicao as Record<string, unknown>;
      const tipo = condicao['tipo'] as string | undefined;
      const valor = Number(condicao['valor'] ?? 0);

      let ganhou = false;

      try {
        switch (tipo) {
          case 'PRIMEIRO_REPORT': {
            const count = await this.prisma.report.count({
              where: { cidadaoId, eliminadoEm: null },
            });
            ganhou = count >= 1;
            break;
          }
          case 'MIN_REPORTS': {
            const count = await this.prisma.report.count({
              where: { cidadaoId, eliminadoEm: null },
            });
            ganhou = count >= valor;
            break;
          }
          case 'MIN_QUIZ_PONTUACAO': {
            const result = await this.prisma.quizSessao.aggregate({
              _sum: { pontuacao: true },
              where: { cidadaoId, concluida: true },
            });
            ganhou = (result._sum.pontuacao ?? 0) >= valor;
            break;
          }
          case 'MIN_RECOLHAS': {
            const count = await this.prisma.pedidoRecolha.count({
              where: { cidadaoId, estado: 'CONCLUIDO' },
            });
            ganhou = count >= valor;
            break;
          }
          case 'MIN_PARTILHAS': {
            const count = await this.prisma.partilhaMaterial.count({
              where: { cidadaoId, eliminadoEm: null },
            });
            ganhou = count >= valor;
            break;
          }
          case 'QUIZ_PERFEITO': {
            // Pelo menos uma sessão com 100% de respostas correctas
            const sessoes = await this.prisma.quizSessao.findMany({
              where: { cidadaoId, concluida: true },
              include: {
                quiz: { include: { perguntas: { select: { id: true } } } },
              },
            });
            ganhou = sessoes.some(
              (s) => s.pontuacao === s.quiz.perguntas.length && s.quiz.perguntas.length > 0,
            );
            break;
          }
          default:
            // Tipo desconhecido — ignora sem erro
            break;
        }
      } catch (err) {
        this.logger.warn(`Erro a avaliar badge ${badge.codigo} para ${cidadaoId}: ${String(err)}`);
        continue;
      }

      if (ganhou) {
        await this.prisma.cidadaoBadge.create({
          data: { cidadaoId, badgeId: badge.id },
        });

        await this.notif.send({
          cidadao_id: cidadaoId,
          tipo: 'BADGE_GANHO',
          titulo: `Parabéns! Conquistou o badge "${badge.nome}"`,
          corpo: badge.descricao,
          canal: 'APP',
          payload: { badgeId: badge.id, badgeCodigo: badge.codigo },
        });

        this.logger.log(`Badge "${badge.codigo}" atribuído a ${cidadaoId}`);
      }
    }
  }
}
