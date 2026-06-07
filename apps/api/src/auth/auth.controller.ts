import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import type {
  AuthMeResponse,
  ForgotPasswordResponse,
  LoginResponse,
  RegisterResponse,
} from '@ecobairro/contracts';
import { AuthService } from './auth.service';
import { CurrentUser } from './current-user.decorator';
import type { AuthenticatedUser } from './auth.types';
import { JwtAuthGuard } from './jwt-auth.guard';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { RefreshDto } from './dto/refresh.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { VerifyTwoFactorDto } from './dto/verify-two-factor.dto';
import { buildRequestContext } from '../security/request-context.helper';

// TTL dos cookies alinhados com os TTLs dos tokens
const ACCESS_COOKIE_MAX_AGE_MS = 15 * 60 * 1000; // 15 min
const REFRESH_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 dias

function setAuthCookies(res: Response, accessToken: string, refreshToken: string): void {
  const isProd = process.env.NODE_ENV === 'production';
  const base = { httpOnly: true, secure: isProd, sameSite: 'strict' as const };
  res.cookie('access_token', accessToken, { ...base, maxAge: ACCESS_COOKIE_MAX_AGE_MS, path: '/' });
  // Fix #3: refresh token enviado apenas ao endpoint de refresh
  res.cookie('refresh_token', refreshToken, {
    ...base,
    maxAge: REFRESH_COOKIE_MAX_AGE_MS,
    path: '/api/v1/auth/refresh',
  });
}

function clearAuthCookies(res: Response): void {
  res.clearCookie('access_token', { path: '/' });
  res.clearCookie('refresh_token', { path: '/api/v1/auth/refresh' });
}

@Controller('auth')
export class AuthController {
  private readonly authService: AuthService;

  constructor(@Inject(AuthService) authService: AuthService) {
    this.authService = authService;
  }

  @Post('register')
  register(
    @Body() body: RegisterDto,
    @Req() req: Request,
  ): Promise<RegisterResponse> {
    return this.authService.register(body, buildRequestContext(req));
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ login: { ttl: 15 * 60 * 1000, limit: 10 } })
  async login(
    @Body() body: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LoginResponse> {
    const result = await this.authService.login(body, buildRequestContext(req));
    // Fix #3: se o login completou (sem 2FA pendente), emite cookies HttpOnly
    if (!result.requires_2fa && result.access_token) {
      setAuthCookies(res, result.access_token, result.refresh_token ?? '');
      // Não expor tokens no corpo — retornar apenas o necessário
      return { ...result, access_token: '', refresh_token: '' };
    }
    return result;
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Body() body: Partial<RefreshDto>,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LoginResponse> {
    // Fix #3: aceita refresh token do cookie HttpOnly (preferido) ou do body (API clients)
    const refreshToken = (req.cookies as Record<string, string>)?.['refresh_token'] ?? body.refresh_token ?? '';
    const result = await this.authService.refresh(
      { refresh_token: refreshToken },
      buildRequestContext(req),
    );
    if (result.access_token) {
      setAuthCookies(res, result.access_token, result.refresh_token ?? '');
      return { ...result, access_token: '', refresh_token: '' };
    }
    return result;
  }

  @Post('verify-2fa')
  @HttpCode(HttpStatus.OK)
  @Throttle({ login: { ttl: 15 * 60 * 1000, limit: 10 } })
  async verifyTwoFactor(
    @Body() body: VerifyTwoFactorDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LoginResponse> {
    const result = await this.authService.verifyTwoFactor(body, buildRequestContext(req));
    if (result.access_token) {
      setAuthCookies(res, result.access_token, result.refresh_token ?? '');
      return { ...result, access_token: '', refresh_token: '' };
    }
    return result;
  }

  @Post('me')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  me(@CurrentUser() user: AuthenticatedUser): Promise<AuthMeResponse> {
    return this.authService.me(user.userId);
  }

  // Fix #6: rate limiting nas rotas de email públicas
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ login: { ttl: 15 * 60 * 1000, limit: 5 } })
  forgotPassword(@Body() body: ForgotPasswordDto): Promise<ForgotPasswordResponse> {
    return this.authService.forgotPassword(body);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Throttle({ login: { ttl: 15 * 60 * 1000, limit: 5 } })
  async resetPassword(@Body() body: ResetPasswordDto): Promise<void> {
    await this.authService.resetPassword(body);
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Throttle({ login: { ttl: 15 * 60 * 1000, limit: 10 } })
  async verifyEmail(@Body() body: VerifyEmailDto): Promise<void> {
    await this.authService.verifyEmail(body.token);
  }

  @Post('resend-verification')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Throttle({ login: { ttl: 15 * 60 * 1000, limit: 3 } })
  async resendVerification(@Body() body: ForgotPasswordDto): Promise<void> {
    await this.authService.resendVerificationEmail(body.email);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @CurrentUser() user: AuthenticatedUser,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    await this.authService.logout(user.userId);
    clearAuthCookies(res);
  }
}
