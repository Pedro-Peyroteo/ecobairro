import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ZonasService } from './zonas.service';
import { CreateZonaDto } from './dto/create-zona.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('zonas')
export class ZonasController {
  constructor(private readonly zonasService: ZonasService) {}

  @Get()
  list() {
    return this.zonasService.listActive();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.zonasService.findOne(id);
  }

  @Post()
  @Roles('TECNICO_AUTARQUIA', 'TECNICO_CCDR', 'ADMIN')
  create(@Body() dto: CreateZonaDto) {
    return this.zonasService.create(dto);
  }

  @Patch(':id')
  @Roles('TECNICO_AUTARQUIA', 'TECNICO_CCDR', 'ADMIN')
  update(@Param('id') id: string, @Body() dto: Partial<CreateZonaDto>) {
    return this.zonasService.update(id, dto);
  }
}
