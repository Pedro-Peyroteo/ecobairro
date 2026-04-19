import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { IotService } from './iot.service';
import { TelemetriaDto } from './dto/telemetria.dto';

@Controller('iot')
export class IotController {
  constructor(private readonly iotService: IotService) {}

  /**
   * RF-04: Receive sensor telemetry and return 202 immediately.
   * IoT devices must not be blocked waiting for DB writes.
   */
  @Post('telemetria')
  @HttpCode(202)
  ingest(@Body() dto: TelemetriaDto) {
    return this.iotService.ingest(dto);
  }
}
