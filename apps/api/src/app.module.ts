import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { DatabaseModule } from './database/database.module';
import { RedisModule } from './redis/redis.module';
import { AuthModule } from './auth/auth.module';
import { CidadaosModule } from './cidadaos/cidadaos.module';
import { ReportsModule } from './reports/reports.module';

@Module({
  imports: [DatabaseModule, RedisModule, AuthModule, CidadaosModule, ReportsModule],
  controllers: [HealthController],
  providers: [HealthService],
})
export class AppModule {}

