import { Module } from '@nestjs/common';
import { SecurityService } from './security.service';
import { SessionService } from './session.service';

@Module({
  providers: [SecurityService, SessionService],
  exports: [SecurityService, SessionService],
})
export class SecurityModule {}
