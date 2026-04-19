import { Module } from '@nestjs/common';
import { QueueWorkerService } from './queue-worker.service';
import { IotModule } from '../iot/iot.module';

/**
 * QueueModule hosts lightweight Redis-list workers.
 * When BullMQ is introduced (next iteration), replace QueueWorkerService
 * with BullMQ Queue + Processor registrations from @nestjs/bullmq.
 *
 * Current approach: each worker polls a Redis list (BRPOP) so IoT telemetry
 * is processed asynchronously without blocking the HTTP layer.
 */
@Module({
  imports: [IotModule],
  providers: [QueueWorkerService],
  exports: [QueueWorkerService],
})
export class QueuesModule {}
