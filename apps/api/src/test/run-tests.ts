import { authServiceTests } from '../auth/auth.service.test';
import { jwtAuthGuardTests } from '../auth/jwt-auth.guard.test';
import { cidadaosServiceTests } from '../cidadaos/cidadaos.service.test';
import { runSuite } from './test-helpers';

async function main(): Promise<void> {
  let failures = 0;

  failures += await runSuite('AuthService', authServiceTests);
  failures += await runSuite('JwtAuthGuard', jwtAuthGuardTests);
  failures += await runSuite('CidadaosService', cidadaosServiceTests);

  if (failures > 0) {
    console.error(`\n${failures} test(s) failed.`);
    process.exit(1);
  }

  console.log('\nAll tests passed.');
}

main().catch((error: unknown) => {
  console.error('Failed to run tests');
  console.error(error);
  process.exit(1);
});
