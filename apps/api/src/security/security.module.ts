import { Module } from '@nestjs/common';
import { SecurityService } from './security.service';
import { SessionService } from './session.service';
import { SecurityController } from './security.controller';

@Module({
  controllers: [SecurityController],
  providers: [SecurityService, SessionService],
  exports: [SecurityService, SessionService],
})
export class SecurityModule {}
