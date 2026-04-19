import { Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { MensagensService } from './mensagens.service';
import { CreateMensagemInstitucionalDto } from './dto/create-mensagem.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';

@Controller('mensagens')
export class MensagensController {
  constructor(private readonly mensagensService: MensagensService) {}

  @Get()
  list(@Query('todas') todas?: string) {
    return this.mensagensService.list(todas !== 'true');
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.mensagensService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TECNICO_AUTARQUIA', 'TECNICO_CCDR', 'ADMIN')
  create(
    @Body() dto: CreateMensagemInstitucionalDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.mensagensService.create(dto, user.userId);
  }

  @Post(':id/publicar')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TECNICO_AUTARQUIA', 'TECNICO_CCDR', 'ADMIN')
  publish(@Param('id') id: string) {
    return this.mensagensService.publish(id);
  }
}
