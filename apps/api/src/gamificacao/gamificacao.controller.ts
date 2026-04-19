import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { GamificacaoService } from './gamificacao.service';
import { CreateQuizDto, ResponderOpcaoDto } from './dto/quiz.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';

@Controller('gamificacao')
export class GamificacaoController {
  constructor(private readonly gamificacaoService: GamificacaoService) {}

  // ── Badges ──────────────────────────────────────────────────────────────────

  @Get('badges')
  listBadges() {
    return this.gamificacaoService.listBadges();
  }

  @Get('badges/meus')
  @UseGuards(JwtAuthGuard)
  meusBadges(@CurrentUser() user: AuthenticatedUser) {
    return this.gamificacaoService.listMeusBadges(user.userId);
  }

  @Post('badges')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  criarBadge(
    @Body()
    dto: {
      codigo: string;
      nome: string;
      descricao: string;
      iconUrl?: string;
      condicao: Record<string, unknown>;
    },
  ) {
    return this.gamificacaoService.criarBadge(dto);
  }

  // ── Quiz ────────────────────────────────────────────────────────────────────

  @Get('quiz/disponivel')
  findQuizDisponivel(@Query('tipo') tipo?: string) {
    return this.gamificacaoService.findQuizDisponivel(tipo);
  }

  @Get('quiz/:id')
  findQuiz(@Param('id') id: string) {
    return this.gamificacaoService.findQuiz(id);
  }

  @Post('quiz')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  criarQuiz(@Body() dto: CreateQuizDto, @CurrentUser() user: AuthenticatedUser) {
    return this.gamificacaoService.criarQuiz(dto, user.userId);
  }

  @Post('quiz/:id/iniciar')
  @UseGuards(JwtAuthGuard)
  iniciarSessao(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.gamificacaoService.iniciarSessao(id, user.userId);
  }

  @Post('quiz/sessao/responder')
  @UseGuards(JwtAuthGuard)
  responder(@Body() dto: ResponderOpcaoDto, @CurrentUser() user: AuthenticatedUser) {
    return this.gamificacaoService.responder(dto, user.userId);
  }

  @Get('quiz/sessao/:sessaoId')
  @UseGuards(JwtAuthGuard)
  resultado(@Param('sessaoId') sessaoId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.gamificacaoService.resultado(sessaoId, user.userId);
  }

  // ── Ranking ─────────────────────────────────────────────────────────────────

  @Get('ranking')
  ranking(@Query('zona_id') zonaId?: string) {
    return this.gamificacaoService.ranking(zonaId);
  }
}
