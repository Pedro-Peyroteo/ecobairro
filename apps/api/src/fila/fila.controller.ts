import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FilaService } from './fila.service';
import { ListFilaDto } from './dto/list-fila.dto';
import { UpdateTarefaDto } from './dto/update-tarefa.dto';

@Controller('fila')
@UseGuards(JwtAuthGuard)
export class FilaController {
  constructor(private readonly fila: FilaService) {}

  @Get()
  list(@Query() query: ListFilaDto) {
    return this.fila.list(query);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTarefaDto) {
    return this.fila.update(id, dto);
  }
}
