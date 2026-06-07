import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import type {
  EcopontoNivel,
  EcopontoRecord,
  ListEcopontosResponse,
} from '@ecobairro/contracts';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import type { EcopontoSensor } from '@ecobairro/contracts';
import { CreateEcopontoDto } from './dto/create-ecoponto.dto';
import { UpdateEcopontoDto } from './dto/update-ecoponto.dto';
import { EcopontosService } from './ecopontos.service';

@Controller('ecopontos')
export class EcopontosController {
  private readonly svc: EcopontosService;

  constructor(@Inject(EcopontosService) svc: EcopontosService) {
    this.svc = svc;
  }

  /**
   * Lista ecopontos com filtros opcionais:
   * ?q=texto          — pesquisa livre em nome, morada, código postal, zona
   * ?zona=Bonfim      — filtro exacto por zona (case-insensitive)
   * ?codigo_postal=38 — prefixo do código postal
   * ?tipo=Papel       — tipo de resíduo (valor do array JSON)
   * ?nivel=cheio      — nível de ocupação computado
   * ?todos=true       — inclui inativos
   */
  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  list(
    @Query('q') q?: string,
    @Query('zona') zona?: string,
    @Query('codigo_postal') codigoPostal?: string,
    @Query('tipo') tipo?: string,
    @Query('nivel') nivel?: string,
    @Query('todos') todos?: string,
  ): Promise<ListEcopontosResponse> {
    return this.svc.list({
      q: q || undefined,
      zona: zona || undefined,
      codigo_postal: codigoPostal || undefined,
      tipo: tipo || undefined,
      nivel: (nivel as EcopontoNivel) || undefined,
      todos: todos === 'true',
    });
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: CreateEcopontoDto,
  ): Promise<EcopontoRecord> {
    return this.svc.create(user.role, {
      ...body,
      sensor_estado: body.sensor_estado as EcopontoSensor | undefined,
    });
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateEcopontoDto,
  ): Promise<EcopontoRecord> {
    return this.svc.update(user.role, id, {
      ...body,
      sensor_estado: body.sensor_estado as EcopontoSensor | undefined,
    });
  }

  /** Soft-delete: marca ativo=false. */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.svc.remove(user.role, id);
  }
}
