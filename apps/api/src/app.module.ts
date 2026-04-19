import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { DatabaseModule } from './database/database.module';
import { RedisModule } from './redis/redis.module';
import { AuditModule } from './audit/audit.module';
import { QueuesModule } from './queues/queues.module';
import { AuthModule } from './auth/auth.module';
import { CidadaosModule } from './cidadaos/cidadaos.module';
import { AdminModule } from './admin/admin.module';
import { ZonasModule } from './zonas/zonas.module';
import { EcopontosModule } from './ecopontos/ecopontos.module';
import { IotModule } from './iot/iot.module';
import { ReportsModule } from './reports/reports.module';
import { NotificacoesModule } from './notificacoes/notificacoes.module';
import { MensagensModule } from './mensagens/mensagens.module';
import { PedidosModule } from './pedidos/pedidos.module';
import { PartilhasModule } from './partilhas/partilhas.module';
import { GamificacaoModule } from './gamificacao/gamificacao.module';
import { RotasModule } from './rotas/rotas.module';

@Module({
  imports: [
    // Infrastructure (global)
    DatabaseModule,
    RedisModule,
    AuditModule,
    QueuesModule,
    // Auth
    AuthModule,
    // Identity & profiles
    CidadaosModule,
    AdminModule,
    // Geo domain
    ZonasModule,
    EcopontosModule,
    IotModule,
    // Citizen-facing
    ReportsModule,
    PedidosModule,
    PartilhasModule,
    // Communication
    NotificacoesModule,
    MensagensModule,
    // Gamification
    GamificacaoModule,
    // Operations
    RotasModule,
  ],
  controllers: [HealthController],
  providers: [HealthService],
})
export class AppModule {}
