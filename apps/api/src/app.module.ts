import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { DatabaseModule } from './database/database.module';
import { RedisModule } from './redis/redis.module';
import { AuthModule } from './auth/auth.module';
import { CidadaosModule } from './cidadaos/cidadaos.module';
import { ReportsModule } from './reports/reports.module';
import { HomeModule } from './home/home.module';
import { EcopontosModule } from './ecopontos/ecopontos.module';
import { GamificationModule } from './gamification/gamification.module';
import { PartilhasModule } from './partilhas/partilhas.module';
import { NoticiasModule } from './noticias/noticias.module';
import { UsersModule } from './users/users.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { FilaModule } from './fila/fila.module';
import { RecolhasModule } from './recolhas/recolhas.module';
import { CampanhasModule } from './campanhas/campanhas.module';
import { AuditModule } from './audit/audit.module';
import { RotasModule } from './rotas/rotas.module';
import { CookiesModule } from './cookies/cookies.module';

@Module({
  imports: [
    // Rate limiting: 10 tentativas / 15 min por IP em /auth/login e /auth/verify-2fa
    ThrottlerModule.forRoot({
      throttlers: [
        {
          name: 'login',
          ttl: 15 * 60 * 1000, // 15 min em ms
          limit: 10,
        },
      ],
    }),
    DatabaseModule,
    RedisModule,
    AuthModule,
    CidadaosModule,
    ReportsModule,
    HomeModule,
    EcopontosModule,
    GamificationModule,
    PartilhasModule,
    NoticiasModule,
    UsersModule,
    AnalyticsModule,
    FilaModule,
    RecolhasModule,
    CampanhasModule,
    AuditModule,
    RotasModule,
    CookiesModule,
  ],
  controllers: [HealthController],
  providers: [HealthService],
})
export class AppModule {}

