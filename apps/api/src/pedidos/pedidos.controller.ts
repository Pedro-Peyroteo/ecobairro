import { Controller, Get, Post, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { PedidosService } from './pedidos.service';
import { CreatePedidoDto, UpdatePedidoEstadoDto } from './dto/create-pedido.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';

@UseGuards(JwtAuthGuard)
@Controller('pedidos-recolha')
export class PedidosController {
  constructor(private readonly pedidosService: PedidosService) {}

  @Post()
  create(@Body() dto: CreatePedidoDto, @CurrentUser() user: AuthenticatedUser) {
    return this.pedidosService.create(dto, user.userId);
  }

  @Get('meus')
  listMine(@CurrentUser() user: AuthenticatedUser) {
    return this.pedidosService.listMine(user.userId);
  }

  @Get('pendentes')
  listPendentes(@CurrentUser() user: AuthenticatedUser) {
    return this.pedidosService.listPendentes(user.role);
  }

  @Patch(':id/estado')
  updateEstado(
    @Param('id') id: string,
    @Body() dto: UpdatePedidoEstadoDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.pedidosService.updateEstado(id, dto, user.userId, user.role);
  }
}
