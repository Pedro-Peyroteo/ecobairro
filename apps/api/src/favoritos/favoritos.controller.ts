import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import { FavoritosService } from './favoritos.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';

@Controller('cidadaos/me/favoritos')
@UseGuards(JwtAuthGuard)
export class FavoritosController {
  constructor(private readonly favoritosService: FavoritosService) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.favoritosService.list(user.userId);
  }

  @Post()
  add(
    @Body() body: { ecoponto_id: string },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.favoritosService.add(user.userId, body.ecoponto_id);
  }

  @Delete(':ecopontoId')
  @HttpCode(204)
  remove(
    @Param('ecopontoId') ecopontoId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.favoritosService.remove(user.userId, ecopontoId);
  }
}
