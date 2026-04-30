import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { GamificationController } from './gamification.controller';
import { GamificationService } from './gamification.service';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [GamificationController],
  providers: [GamificationService],
})
export class GamificationModule {}

