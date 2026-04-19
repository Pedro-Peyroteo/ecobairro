import { Module } from '@nestjs/common';
import { PartilhasController } from './partilhas.controller';
import { PartilhasService } from './partilhas.service';

@Module({
  controllers: [PartilhasController],
  providers: [PartilhasService],
})
export class PartilhasModule {}
