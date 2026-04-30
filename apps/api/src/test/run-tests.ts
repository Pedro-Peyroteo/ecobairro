import { authServiceTests } from '../auth/auth.service.test';
import { jwtAuthGuardTests } from '../auth/jwt-auth.guard.test';
import { optionalJwtAuthGuardTests } from '../auth/optional-jwt-auth.guard.test';
import { cidadaosServiceTests } from '../cidadaos/cidadaos.service.test';
import { homeServiceTests } from '../home/home.service.test';
import { reportsServiceTests } from '../reports/reports.service.test';
import { runSuite } from './test-helpers';

async function main(): Promise<void> {
  let failures = 0;

  failures += await runSuite('AuthService', authServiceTests);
  failures += await runSuite('JwtAuthGuard', jwtAuthGuardTests);
  failures += await runSuite('OptionalJwtAuthGuard', optionalJwtAuthGuardTests);
  failures += await runSuite('CidadaosService', cidadaosServiceTests);
  failures += await runSuite('HomeService', homeServiceTests);
  failures += await runSuite('ReportsService', reportsServiceTests);

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
