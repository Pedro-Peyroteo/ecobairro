import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Req,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import type { Request } from 'express';
import { RgpdService } from './rgpd.service';
import { ConsentirDto } from './dto/consentimento.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';

@Controller('cidadaos/me')
@UseGuards(JwtAuthGuard)
export class RgpdController {
  constructor(private readonly rgpdService: RgpdService) {}

  @Get('consentimentos')
  listConsentimentos(@CurrentUser() user: AuthenticatedUser) {
    return this.rgpdService.listConsentimentos(user.userId);
  }

  @Post('consentimentos')
  consentir(
    @Body() dto: ConsentirDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ) {
    return this.rgpdService.consentir(user.userId, dto, req.ip ?? '');
  }

  @Delete('consentimentos/:finalidade')
  @HttpCode(204)
  revogar(
    @Param('finalidade') finalidade: string,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ) {
    return this.rgpdService.revogar(user.userId, finalidade, req.ip ?? '');
  }

  @Post('portabilidade')
  portabilidade(@CurrentUser() user: AuthenticatedUser, @Req() req: Request) {
    return this.rgpdService.pedirPortabilidade(user.userId, req.ip ?? '');
  }
}
