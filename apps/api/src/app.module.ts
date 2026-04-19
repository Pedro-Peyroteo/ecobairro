import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { DatabaseModule } from './database/database.module';
import { RedisModule } from './redis/redis.module';
import { AuthModule } from './auth/auth.module';
import { CidadaosModule } from './cidadaos/cidadaos.module';
import { ZonasModule } from './zonas/zonas.module';
import { EcopontosModule } from './ecopontos/ecopontos.module';
import { IotModule } from './iot/iot.module';
import { ReportsModule } from './reports/reports.module';
import { NotificacoesModule } from './notificacoes/notificacoes.module';
import { AuditModule } from './audit/audit.module';
import { QueuesModule } from './queues/queues.module';

@Module({
  imports: [
    // Infrastructure
    DatabaseModule,
    RedisModule,
    AuditModule,
    QueuesModule,
    // Auth
    AuthModule,
    // Domain
    CidadaosModule,
    ZonasModule,
    EcopontosModule,
    IotModule,
    ReportsModule,
    NotificacoesModule,
  ],
  controllers: [HealthController],
  providers: [HealthService],
})
export class AppModule {}
