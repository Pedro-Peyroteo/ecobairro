import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Param,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { CampanhasService } from './campanhas.service';
import { CreateCampanhaDto } from './dto/create-campanha.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';

@Controller('campanhas')
export class CampanhasController {
  constructor(private readonly campanhasService: CampanhasService) {}

  /** CB1 — Listar campanhas activas */
  @Get()
  @UseGuards(JwtAuthGuard)
  listAtivas() {
    return this.campanhasService.listAtivas();
  }

  /** CB2 — Detalhe */
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string) {
    return this.campanhasService.findOne(id);
  }

  /** CB3 — Elegibilidade */
  @Get(':id/elegibilidade')
  @UseGuards(JwtAuthGuard)
  elegibilidade(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.campanhasService.checkElegibilidade(id, user.userId);
  }

  /** CB4 — Listagem admin */
  @Get('admin/todas')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TECNICO_AUTARQUIA', 'ADMIN')
  listAdmin() {
    return this.campanhasService.listAdmin();
  }

  /** CB5 — Criar campanha */
  @Post('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TECNICO_AUTARQUIA', 'ADMIN')
  create(
    @Body() dto: CreateCampanhaDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ) {
    return this.campanhasService.create(dto, user.userId, req.ip ?? '');
  }

  /** CB6 — Editar */
  @Put('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TECNICO_AUTARQUIA', 'ADMIN')
  update(
    @Param('id') id: string,
    @Body() dto: Partial<CreateCampanhaDto>,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ) {
    return this.campanhasService.update(id, dto, user.userId, req.ip ?? '');
  }

  /** CB7 — Activar */
  @Patch('admin/:id/ativar')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TECNICO_AUTARQUIA', 'ADMIN')
  ativar(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ) {
    return this.campanhasService.ativar(id, user.userId, req.ip ?? '');
  }
}
