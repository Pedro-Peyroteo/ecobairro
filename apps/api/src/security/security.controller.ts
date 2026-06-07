import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  ParseUUIDPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import type {
  ActiveSessionRecord,
  ListActiveSessionsResponse,
  ListSecurityLogsResponse,
} from '@ecobairro/contracts';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { SecurityService } from './security.service';
import { SessionService } from './session.service';

class PageQuery {
  page?: number;
  pageSize?: number;
}

@Controller('security')
@UseGuards(JwtAuthGuard)
export class SecurityController {
  private readonly security: SecurityService;
  private readonly session: SessionService;

  constructor(
    @Inject(SecurityService) security: SecurityService,
    @Inject(SessionService) session: SessionService,
  ) {
    this.security = security;
    this.session = session;
  }

  // ─── Sessões activas ──────────────────────────────────────────────────────

  @Get('sessions')
  async listSessions(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ListActiveSessionsResponse> {
    const sessions = await this.session.list(user.userId);
    const mapped: ActiveSessionRecord[] = sessions.map((s) => ({
      id: s.id,
      ip_address: s.ipAddress,
      user_agent: s.userAgent ?? null,
      device: null,
      browser: null,
      os: null,
      criado_em: s.criadoEm.toISOString(),
      expires_at: s.expiresAt.toISOString(),
      current: false, // frontend pode marcar a sessão actual via access token
    }));
    return { sessions: mapped };
  }

  @Delete('sessions/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async revokeSession(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) sessionId: string,
  ): Promise<void> {
    await this.session.revoke(user.userId, sessionId);
  }

  @Delete('sessions')
  @HttpCode(HttpStatus.NO_CONTENT)
  async revokeAllSessions(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<void> {
    await this.session.revokeAll(user.userId);
    await this.security.revokeUser(user.userId);
  }

  // ─── Histórico de segurança ───────────────────────────────────────────────

  @Get('logs')
  async listLogs(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: PageQuery,
  ): Promise<ListSecurityLogsResponse> {
    const page = Math.max(1, Number(query.page) || 1);
    const pageSize = Math.min(50, Math.max(1, Number(query.pageSize) || 20));
    const { rows, total } = await this.security.listLogs(
      user.userId,
      page,
      pageSize,
    );
    return {
      logs: rows.map((r) => ({
        id: r.id,
        event: r.event as ListSecurityLogsResponse['logs'][number]['event'],
        ip_address: r.ipAddress,
        user_agent: r.userAgent ?? null,
        criado_em: r.criadoEm.toISOString(),
      })),
      page,
      pageSize,
      total,
    };
  }
}
