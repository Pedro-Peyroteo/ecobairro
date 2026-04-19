import { Module } from '@nestjs/common';
import { GamificacaoController } from './gamificacao.controller';
import { GamificacaoService } from './gamificacao.service';
import { BadgeWorkerService } from './badge-worker.service';
import { NotificacoesModule } from '../notificacoes/notificacoes.module';

@Module({
  imports: [NotificacoesModule],
  controllers: [GamificacaoController],
  providers: [GamificacaoService, BadgeWorkerService],
  exports: [GamificacaoService, BadgeWorkerService],
})
export class GamificacaoModule {}
