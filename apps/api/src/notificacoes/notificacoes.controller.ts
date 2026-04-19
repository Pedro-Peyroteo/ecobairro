import { Controller, Get, Patch, Param, Query, UseGuards } from '@nestjs/common';
import { NotificacoesService } from './notificacoes.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';

@UseGuards(JwtAuthGuard)
@Controller('notificacoes')
export class NotificacoesController {
  constructor(private readonly notificacoesService: NotificacoesService) {}

  @Get()
  listMine(
    @CurrentUser() user: AuthenticatedUser,
    @Query('cursor') cursor?: string,
    @Query('take') take?: string,
    @Query('nao_lidas') naoLidas?: string,
  ) {
    return this.notificacoesService.listMine(user.userId, {
      cursor,
      take: take ? parseInt(take, 10) : undefined,
      somenteNaoLidas: naoLidas === 'true',
    });
  }

  @Get('count')
  unreadCount(@CurrentUser() user: AuthenticatedUser) {
    return this.notificacoesService.getUnreadCount(user.userId);
  }

  @Patch(':id/lida')
  markRead(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.notificacoesService.markRead(id, user.userId);
  }
}
