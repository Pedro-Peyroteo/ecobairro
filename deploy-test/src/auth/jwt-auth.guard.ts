import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import type { AuthenticatedRequest, JwtPayload } from './auth.types';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly jwtService: JwtService;

  constructor(@Inject(JwtService) jwtService: JwtService) {
    this.jwtService = jwtService;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractBearerToken(request);

    if (!token) {
      throw new UnauthorizedException('Missing bearer token');
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);
      request.authUser = {
        userId: payload.sub,
        role: payload.role,
      };

      return true;
    } catch {
      throw new UnauthorizedException('Invalid bearer token');
    }
  }

  private extractBearerToken(request: Request): string | null {
    const header = request.header('authorization');

    if (!header) {
      return null;
    }

    const [scheme, token] = header.split(' ');

    if (scheme !== 'Bearer' || !token) {
      return null;
    }

    return token;
  }
}
