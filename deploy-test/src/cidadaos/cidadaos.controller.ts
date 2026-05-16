import { Body, Controller, Get, Inject, Put, UseGuards } from '@nestjs/common';
import type { CitizenSelfProfileResponse } from '@ecobairro/contracts';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CidadaosService } from './cidadaos.service';
import { UpdateCidadaoProfileDto } from './dto/update-cidadao-profile.dto';

@Controller('cidadaos')
@UseGuards(JwtAuthGuard)
export class CidadaosController {
  private readonly cidadaosService: CidadaosService;

  constructor(@Inject(CidadaosService) cidadaosService: CidadaosService) {
    this.cidadaosService = cidadaosService;
  }

  @Get('me')
  getMe(@CurrentUser() user: AuthenticatedUser): Promise<CitizenSelfProfileResponse> {
    return this.cidadaosService.getMe(user.userId, user.role);
  }

  @Put('me')
  updateMe(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: UpdateCidadaoProfileDto,
  ): Promise<CitizenSelfProfileResponse> {
    return this.cidadaosService.updateMe(user.userId, user.role, body);
  }
}
