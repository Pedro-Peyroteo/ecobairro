import assert from 'node:assert/strict';
import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import type { TestCase } from '../test/test-helpers';
import { runSuite } from '../test/test-helpers';

function buildContext(role: string | null, handlerRoles: string[] | undefined) {
  const reflector = {
    getAllAndOverride: () => handlerRoles,
  } as unknown as Reflector;

  const guard = new RolesGuard(reflector);

  const context = {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => ({
        authUser: role ? { userId: 'uid', role } : undefined,
      }),
    }),
  } as Parameters<typeof RolesGuard.prototype.canActivate>[0];

  return { guard, context };
}

const tests: TestCase[] = [
  {
    name: 'allows when no roles required',
    run() {
      const { guard, context } = buildContext('CIDADAO', undefined);
      assert.equal(guard.canActivate(context), true);
    },
  },
  {
    name: 'allows when user role matches',
    run() {
      const { guard, context } = buildContext('ADMIN', ['ADMIN', 'TECNICO_AUTARQUIA']);
      assert.equal(guard.canActivate(context), true);
    },
  },
  {
    name: 'throws ForbiddenException when role does not match',
    run() {
      const { guard, context } = buildContext('CIDADAO', ['ADMIN']);
      assert.throws(() => guard.canActivate(context), ForbiddenException);
    },
  },
  {
    name: 'throws ForbiddenException when no authenticated user',
    run() {
      const { guard, context } = buildContext(null, ['ADMIN']);
      assert.throws(() => guard.canActivate(context), ForbiddenException);
    },
  },
];

export async function runRolesGuardTests(): Promise<number> {
  return runSuite('RolesGuard', tests);
}
