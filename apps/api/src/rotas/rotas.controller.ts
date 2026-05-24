import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RotasService } from './rotas.service';
import { UpdateRotaDto } from './dto/update-rota.dto';

@Controller('rotas')
@UseGuards(JwtAuthGuard)
export class RotasController {
  private readonly rotas: RotasService;
  constructor(@Inject(RotasService) rotas: RotasService) {
    this.rotas = rotas;
  }

  @Get()
  list() {
    return this.rotas.list();
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateRotaDto) {
    return this.rotas.update(id, dto);
  }
}
