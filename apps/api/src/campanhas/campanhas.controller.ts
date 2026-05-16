import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { CampanhasService } from './campanhas.service';
import { ListCampanhasDto } from './dto/list-campanhas.dto';
import { CreateCampanhaDto } from './dto/create-campanha.dto';
import { UpdateCampanhaDto } from './dto/update-campanha.dto';

@Controller('campanhas')
@UseGuards(JwtAuthGuard)
export class CampanhasController {
  constructor(private readonly campanhas: CampanhasService) {}

  @Get()
  list(@Query() query: ListCampanhasDto) {
    return this.campanhas.list(query);
  }

  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateCampanhaDto,
  ) {
    return this.campanhas.create(dto, user.userId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCampanhaDto) {
    return this.campanhas.update(id, dto);
  }
}
