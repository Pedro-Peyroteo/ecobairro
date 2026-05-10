import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { RecolhasService } from './recolhas.service';
import { ListRecolhasDto } from './dto/list-recolhas.dto';
import { CreateRecolhaDto } from './dto/create-recolha.dto';

@Controller('recolhas')
@UseGuards(JwtAuthGuard)
export class RecolhasController {
  constructor(private readonly recolhas: RecolhasService) {}

  @Get()
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListRecolhasDto,
  ) {
    return this.recolhas.list(user.userId, query);
  }

  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateRecolhaDto,
  ) {
    return this.recolhas.create(user.userId, dto);
  }
}
