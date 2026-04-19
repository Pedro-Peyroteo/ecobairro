import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { RotasService } from './rotas.service';
import { CreateRotaDto, UpdateRotaEstadoDto } from './dto/create-rota.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('OPERADOR_VEOLIA', 'TECNICO_AUTARQUIA', 'TECNICO_CCDR', 'ADMIN')
@Controller('rotas')
export class RotasController {
  constructor(private readonly rotasService: RotasService) {}

  @Post()
  create(
    @Body() dto: CreateRotaDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ) {
    return this.rotasService.create(dto, user.userId, user.role, req.ip ?? '');
  }

  @Get()
  list(
    @Query('zona_id') zonaId?: string,
    @Query('operador_id') operadorId?: string,
  ) {
    return this.rotasService.list(zonaId, operadorId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.rotasService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateRotaEstadoDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ) {
    return this.rotasService.update(id, dto, user.userId, user.role, req.ip ?? '');
  }
}
