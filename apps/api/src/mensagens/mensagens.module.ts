import { Module } from '@nestjs/common';
import { MensagensController } from './mensagens.controller';
import { MensagensService } from './mensagens.service';
import { NotificacoesModule } from '../notificacoes/notificacoes.module';

@Module({
  imports: [NotificacoesModule],
  controllers: [MensagensController],
  providers: [MensagensService],
})
export class MensagensModule {}
