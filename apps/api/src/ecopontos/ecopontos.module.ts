import { Module } from '@nestjs/common';
import { EcopontosController } from './ecopontos.controller';
import { EcopontosService } from './ecopontos.service';

@Module({
  controllers: [EcopontosController],
  providers: [EcopontosService],
  exports: [EcopontosService],
})
export class EcopontosModule {}
