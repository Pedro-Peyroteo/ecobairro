import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { RedisService } from '../redis/redis.service';
import type { CreateQuizDto, ResponderOpcaoDto } from './dto/quiz.dto';
import type {
  BadgeItem,
  QuizItem,
  QuizSessaoResult,
  RankingItem,
} from '@ecobairro/contracts';

const BADGES_CACHE_KEY = 'badges:catalogo';
const BADGES_TTL = 24 * 60 * 60;

@Injectable()
export class GamificacaoService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(RedisService) private readonly redis: RedisService,
  ) {}

  // ── Badges ──────────────────────────────────────────────────────────────────

  async listBadges(): Promise<BadgeItem[]> {
    const client = this.redis.getClient();
    const cached = await client.get(BADGES_CACHE_KEY);
    if (cached) return JSON.parse(cached) as BadgeItem[];

    const badges = await this.prisma.badge.findMany({
      where: { ativo: true },
      orderBy: { criadoEm: 'asc' },
    });

    const result: BadgeItem[] = badges.map((b) => ({
      id: b.id,
      codigo: b.codigo,
      nome: b.nome,
      descricao: b.descricao,
      icon_url: b.iconUrl,
      condicao: b.condicao as Record<string, unknown>,
    }));

    await client.set(BADGES_CACHE_KEY, JSON.stringify(result), 'EX', BADGES_TTL);
    return result;
  }

  async listMeusBadges(cidadaoId: string): Promise<BadgeItem[]> {
    const rows = await this.prisma.cidadaoBadge.findMany({
      where: { cidadaoId },
      include: { badge: true },
      orderBy: { ganhoEm: 'desc' },
    });

    return rows.map((r) => ({
      id: r.badge.id,
      codigo: r.badge.codigo,
      nome: r.badge.nome,
      descricao: r.badge.descricao,
      icon_url: r.badge.iconUrl,
      condicao: r.badge.condicao as Record<string, unknown>,
      ganho_em: r.ganhoEm.toISOString(),
    }));
  }

  async criarBadge(input: {
    codigo: string;
    nome: string;
    descricao: string;
    iconUrl?: string;
    condicao: Record<string, unknown>;
  }): Promise<BadgeItem> {
    const badge = await this.prisma.badge.create({
      data: {
        codigo: input.codigo,
        nome: input.nome,
        descricao: input.descricao,
        iconUrl: input.iconUrl,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        condicao: input.condicao as any,
        ativo: true,
      },
    });
    await this.redis.getClient().del(BADGES_CACHE_KEY);
    return {
      id: badge.id,
      codigo: badge.codigo,
      nome: badge.nome,
      descricao: badge.descricao,
      icon_url: badge.iconUrl,
      condicao: badge.condicao as Record<string, unknown>,
    };
  }

  // ── Quiz ────────────────────────────────────────────────────────────────────

  async criarQuiz(input: CreateQuizDto, criadoPor: string): Promise<QuizItem> {
    for (const pergunta of input.perguntas) {
      const corretas = pergunta.opcoes.filter((o) => o.correta).length;
      if (corretas !== 1) {
        throw new BadRequestException(
          `Pergunta "${pergunta.texto}" deve ter exactamente uma opção correcta`,
        );
      }
    }

    const quiz = await this.prisma.$transaction(async (tx) => {
      const q = await tx.quiz.create({
        data: {
          titulo: input.titulo,
          tipo: input.tipo ?? 'SEMANAL',
          disponivelDe: new Date(input.disponivelDe),
          disponivelAte: new Date(input.disponivelAte),
          criadoPor,
          ativo: true,
        },
      });

      for (const pInput of input.perguntas) {
        const p = await tx.quizPergunta.create({
          data: { quizId: q.id, texto: pInput.texto, ordem: pInput.ordem },
        });
        for (const o of pInput.opcoes) {
          await tx.quizOpcao.create({
            data: {
              perguntaId: p.id,
              texto: o.texto,
              correta: o.correta,
              ordem: o.ordem,
            },
          });
        }
      }

      return q;
    });

    return this.findQuiz(quiz.id);
  }

  async findQuizDisponivel(tipo?: string): Promise<QuizItem | null> {
    const now = new Date();
    const cacheKey = `quiz:atual:${tipo ?? 'SEMANAL'}`;
    const client = this.redis.getClient();
    const cached = await client.get(cacheKey);
    if (cached) return JSON.parse(cached) as QuizItem;

    const quiz = await this.prisma.quiz.findFirst({
      where: {
        ativo: true,
        tipo: tipo ?? 'SEMANAL',
        disponivelDe: { lte: now },
        disponivelAte: { gte: now },
      },
      orderBy: { disponivelAte: 'desc' },
    });

    if (!quiz) return null;
    const item = await this.findQuiz(quiz.id);
    await client.set(cacheKey, JSON.stringify(item), 'EX', 5 * 60);
    return item;
  }

  async findQuiz(id: string): Promise<QuizItem> {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id },
      include: {
        perguntas: {
          orderBy: { ordem: 'asc' },
          include: {
            opcoes: {
              orderBy: { ordem: 'asc' },
              select: { id: true, texto: true, ordem: true, correta: false },
            },
          },
        },
      },
    });
    if (!quiz) throw new NotFoundException(`Quiz ${id} não encontrado`);

    return {
      id: quiz.id,
      titulo: quiz.titulo,
      tipo: quiz.tipo,
      disponivel_de: quiz.disponivelDe.toISOString(),
      disponivel_ate: quiz.disponivelAte.toISOString(),
      perguntas: quiz.perguntas.map((p) => ({
        id: p.id,
        texto: p.texto,
        ordem: p.ordem,
        opcoes: p.opcoes.map((o) => ({ id: o.id, texto: o.texto, ordem: o.ordem })),
      })),
    };
  }

  async iniciarSessao(quizId: string, cidadaoId: string): Promise<{ sessao_id: string }> {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
      select: { id: true, ativo: true, disponivelDe: true, disponivelAte: true },
    });
    if (!quiz || !quiz.ativo) throw new NotFoundException('Quiz não disponível');

    const now = new Date();
    if (now < quiz.disponivelDe || now > quiz.disponivelAte) {
      throw new BadRequestException('Quiz fora do período de disponibilidade');
    }

    const existente = await this.prisma.quizSessao.findUnique({
      where: { quizId_cidadaoId: { quizId, cidadaoId } },
    });
    if (existente?.concluida) {
      throw new BadRequestException('Já completou este quiz');
    }

    const sessao = existente ?? await this.prisma.quizSessao.create({
      data: { quizId, cidadaoId, respostas: [] },
    });

    // TTL in Redis — 30 min session
    await this.redis.getClient().set(
      `quiz:sessao:${sessao.id}`,
      JSON.stringify({ quizId, cidadaoId, inicio: now.toISOString() }),
      'EX',
      30 * 60,
    );

    return { sessao_id: sessao.id };
  }

  async responder(
    input: ResponderOpcaoDto,
    cidadaoId: string,
  ): Promise<{ correto: boolean; pontuacao_atual: number }> {
    const client = this.redis.getClient();
    const sessaoRaw = await client.get(`quiz:sessao:${input.sessaoId}`);
    if (!sessaoRaw) throw new BadRequestException('Sessão expirada ou inválida');

    const sessao = await this.prisma.quizSessao.findUnique({
      where: { id: input.sessaoId },
    });
    if (!sessao || sessao.cidadaoId !== cidadaoId) {
      throw new ForbiddenException('Sessão inválida');
    }
    if (sessao.concluida) {
      throw new BadRequestException('Esta sessão já foi concluída');
    }

    const opcao = await this.prisma.quizOpcao.findUnique({
      where: { id: input.opcaoId },
      select: { correta: true, perguntaId: true },
    });
    if (!opcao || opcao.perguntaId !== input.perguntaId) {
      throw new BadRequestException('Opção inválida para a pergunta');
    }

    const respostas = sessao.respostas as Array<{
      perguntaId: string;
      opcaoId: string;
      correto: boolean;
    }>;

    if (respostas.some((r) => r.perguntaId === input.perguntaId)) {
      throw new BadRequestException('Pergunta já respondida');
    }

    respostas.push({ perguntaId: input.perguntaId, opcaoId: input.opcaoId, correto: opcao.correta });

    const totalPerguntas = await this.prisma.quizPergunta.count({
      where: { quizId: sessao.quizId },
    });

    const todasRespondidas = respostas.length >= totalPerguntas;
    const novasPontuacao = respostas.filter((r) => r.correto).length;

    await this.prisma.quizSessao.update({
      where: { id: input.sessaoId },
      data: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        respostas: respostas as any,
        pontuacao: novasPontuacao,
        ...(todasRespondidas ? { concluida: true, concluidaEm: new Date() } : {}),
      },
    });

    if (todasRespondidas) {
      await client.del(`quiz:sessao:${input.sessaoId}`);
    }

    return { correto: opcao.correta, pontuacao_atual: novasPontuacao };
  }

  async resultado(sessaoId: string, cidadaoId: string): Promise<QuizSessaoResult> {
    const sessao = await this.prisma.quizSessao.findUnique({
      where: { id: sessaoId },
    });
    if (!sessao || sessao.cidadaoId !== cidadaoId) {
      throw new NotFoundException('Sessão não encontrada');
    }

    return {
      sessao_id: sessao.id,
      quiz_id: sessao.quizId,
      pontuacao: sessao.pontuacao,
      concluida: sessao.concluida,
      concluida_em: sessao.concluidaEm?.toISOString() ?? null,
    };
  }

  async ranking(zonaId?: string): Promise<RankingItem[]> {
    const cacheKey = zonaId ? `ranking:zona:${zonaId}:semanal` : 'ranking:global:semanal';
    const client = this.redis.getClient();
    const cached = await client.get(cacheKey);
    if (cached) return JSON.parse(cached) as RankingItem[];

    const rows = await this.prisma.quizSessao.groupBy({
      by: ['cidadaoId'],
      _sum: { pontuacao: true },
      orderBy: { _sum: { pontuacao: 'desc' } },
      take: 20,
    });

    const result: RankingItem[] = rows.map((r, idx) => ({
      posicao: idx + 1,
      cidadao_id: r.cidadaoId,
      pontuacao_total: r._sum.pontuacao ?? 0,
    }));

    await client.set(cacheKey, JSON.stringify(result), 'EX', 15 * 60);
    return result;
  }
}
