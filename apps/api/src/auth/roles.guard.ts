import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { UserRole } from '@ecobairro/contracts';
import type { AuthenticatedRequest } from './auth.types';
import { ROLES_KEY } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(@Inject(Reflector) private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!required || required.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.authUser;

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    if (!required.includes(user.role)) {
      throw new ForbiddenException(
        `Role '${user.role}' is not allowed. Required: ${required.join(', ')}`,
      );
    }

    return true;
  }
}
