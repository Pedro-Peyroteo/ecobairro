import type { Request } from 'express';
import type { UserRole } from '@ecobairro/contracts';

export interface JwtPayload {
  sub: string;
  role: UserRole;
}

export interface AuthenticatedUser {
  userId: string;
  role: UserRole;
}

export interface AuthenticatedRequest extends Request {
  authUser?: AuthenticatedUser;
}
