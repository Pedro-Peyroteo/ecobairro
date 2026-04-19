import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Req,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import type { Request } from 'express';
import { AdminService } from './admin.service';
import { CreateOperadorDto, UpdateOperadorDto } from './dto/create-operador.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('operadores')
  createOperador(
    @Body() dto: CreateOperadorDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ) {
    return this.adminService.createOperador(dto, user.userId, req.ip ?? '');
  }

  @Get('operadores')
  listOperadores() {
    return this.adminService.listOperadores();
  }

  @Get('operadores/:id')
  findOperador(@Param('id') id: string) {
    return this.adminService.findOperador(id);
  }

  @Patch('operadores/:id')
  updateOperador(
    @Param('id') id: string,
    @Body() dto: UpdateOperadorDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ) {
    return this.adminService.updateOperador(id, dto, user.userId, req.ip ?? '');
  }

  @Delete('operadores/:id')
  @HttpCode(204)
  removeOperador(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ) {
    return this.adminService.softDeleteOperador(id, user.userId, req.ip ?? '');
  }
}
