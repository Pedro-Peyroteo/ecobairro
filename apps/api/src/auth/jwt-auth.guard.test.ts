import assert from 'node:assert/strict';
import { UnauthorizedException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
import type { AuthenticatedRequest, JwtPayload } from './auth.types';
import type { TestCase } from '../test/test-helpers';

class FakeJwtService {
  constructor(private readonly payload: JwtPayload | null) {}

  async verifyAsync(token: string): Promise<JwtPayload> {
    if (!this.payload || token === 'invalid-token') {
      throw new Error('invalid');
    }

    return this.payload;
  }
}

export const jwtAuthGuardTests: TestCase[] = [
  {
    name: 'attaches the authenticated user when the bearer token is valid',
    run: async () => {
      const request = buildRequest('Bearer valid-token');
      const guard = new JwtAuthGuard(
        new FakeJwtService({
          sub: 'user-1',
          role: 'CIDADAO',
        }) as never,
      );

      const result = await guard.canActivate(buildExecutionContext(request));

      assert.equal(result, true);
      assert.deepEqual(request.authUser, {
        userId: 'user-1',
        role: 'CIDADAO',
      });
    },
  },
  {
    name: 'rejects requests without a bearer token',
    run: async () => {
      const guard = new JwtAuthGuard(new FakeJwtService(null) as never);

      await assert.rejects(
        () => guard.canActivate(buildExecutionContext(buildRequest(null))),
        (error: unknown) =>
          error instanceof UnauthorizedException &&
          error.message === 'Missing bearer token',
      );
    },
  },
  {
    name: 'rejects invalid bearer tokens',
    run: async () => {
      const guard = new JwtAuthGuard(
        new FakeJwtService({
          sub: 'user-1',
          role: 'CIDADAO',
        }) as never,
      );

      await assert.rejects(
        () => guard.canActivate(buildExecutionContext(buildRequest('Bearer invalid-token'))),
        (error: unknown) =>
          error instanceof UnauthorizedException &&
          error.message === 'Invalid bearer token',
      );
    },
  },
];

function buildRequest(authorizationHeader: string | null): AuthenticatedRequest {
  return {
    header(name: string) {
      if (name.toLowerCase() === 'authorization') {
        return authorizationHeader ?? undefined;
      }

      return undefined;
    },
  } as AuthenticatedRequest;
}

function buildExecutionContext(request: AuthenticatedRequest): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => undefined,
      getNext: () => undefined,
    }),
  } as ExecutionContext;
}
