import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ReportsService } from './reports.service';
import { CreateReportDto, UpdateReportEstadoDto } from './dto/create-report.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';

@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  // RF-08: Create a report (citizen only, with antispam + duplicate detection)
  @Post()
  create(@Body() dto: CreateReportDto, @CurrentUser() user: AuthenticatedUser) {
    return this.reportsService.create(dto, user.userId);
  }

  // View citizen's own reports
  @Get('meus')
  listMine(@CurrentUser() user: AuthenticatedUser) {
    return this.reportsService.listMine(user.userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.reportsService.findOne(id);
  }

  // RF-11: Timeline of state transitions
  @Get(':id/timeline')
  getTimeline(@Param('id') id: string) {
    return this.reportsService.getTimeline(id);
  }

  // RF-12: Subscribe to an existing report (instead of creating a duplicate)
  @Post(':id/subscricao')
  subscribe(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.reportsService.subscribe(id, user.userId);
  }

  // RF-10: Update report state (operators/tecnico/admin only)
  @Patch(':id/estado')
  @UseGuards(RolesGuard)
  @Roles('OPERADOR_VEOLIA', 'TECNICO_AUTARQUIA', 'TECNICO_CCDR', 'ADMIN')
  updateEstado(
    @Param('id') id: string,
    @Body() dto: UpdateReportEstadoDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.reportsService.updateEstado(id, dto, user.userId, user.role);
  }
}
