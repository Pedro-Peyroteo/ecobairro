import { Module } from '@nestjs/common';
import { CampanhasController } from './campanhas.controller';
import { CampanhasService } from './campanhas.service';
import { NotificacoesModule } from '../notificacoes/notificacoes.module';

@Module({
  imports: [NotificacoesModule],
  controllers: [CampanhasController],
  providers: [CampanhasService],
  exports: [CampanhasService],
})
export class CampanhasModule {}
