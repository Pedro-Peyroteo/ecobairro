import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import { PartilhasService } from './partilhas.service';
import { CreatePartilhaDto, CreateMensagemPartilhaDto } from './dto/create-partilha.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';

@Controller('partilhas')
export class PartilhasController {
  constructor(private readonly partilhasService: PartilhasService) {}

  @Get()
  list(@Query('estado') estado?: string) {
    return this.partilhasService.list(estado);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.partilhasService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreatePartilhaDto, @CurrentUser() user: AuthenticatedUser) {
    return this.partilhasService.create(dto, user.userId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(204)
  close(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.partilhasService.close(id, user.userId);
  }

  @Get(':id/mensagens')
  listMensagens(@Param('id') id: string) {
    return this.partilhasService.listMensagens(id);
  }

  @Post(':id/mensagens')
  @UseGuards(JwtAuthGuard)
  addMensagem(
    @Param('id') id: string,
    @Body() dto: CreateMensagemPartilhaDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.partilhasService.addMensagem(id, dto, user.userId);
  }
}
