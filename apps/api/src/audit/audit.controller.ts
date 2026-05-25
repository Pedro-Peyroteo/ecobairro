import { Controller, Get, Inject, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuditService } from './audit.service';
import { ListAuditDto } from './dto/list-audit.dto';

@Controller('audit-logs')
@UseGuards(JwtAuthGuard)
export class AuditController {
  private readonly audit: AuditService;
  constructor(@Inject(AuditService) audit: AuditService) {
    this.audit = audit;
  }

  @Get()
  list(@Query() query: ListAuditDto) {
    return this.audit.list(query);
  }
}
