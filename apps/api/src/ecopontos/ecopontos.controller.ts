import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { EcopontosService } from './ecopontos.service';
import { CreateEcopontoDto } from './dto/create-ecoponto.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('ecopontos')
export class EcopontosController {
  constructor(private readonly ecopontosService: EcopontosService) {}

  @Get('zona/:zonaId')
  listByZona(@Param('zonaId') zonaId: string) {
    return this.ecopontosService.listByZona(zonaId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ecopontosService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OPERADOR_VEOLIA', 'TECNICO_AUTARQUIA', 'TECNICO_CCDR', 'ADMIN')
  create(@Body() dto: CreateEcopontoDto) {
    return this.ecopontosService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OPERADOR_VEOLIA', 'TECNICO_AUTARQUIA', 'TECNICO_CCDR', 'ADMIN')
  update(@Param('id') id: string, @Body() dto: Partial<CreateEcopontoDto>) {
    return this.ecopontosService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TECNICO_AUTARQUIA', 'TECNICO_CCDR', 'ADMIN')
  remove(@Param('id') id: string) {
    return this.ecopontosService.softDelete(id);
  }
}
