import { Injectable, Inject, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { IotService } from '../iot/iot.service';
import type { IotIngestJob } from './queues.types';
import { QUEUE_IOT_INGEST } from './queues.types';

/**
 * Lightweight Redis-list queue worker.
 * Polls queue:iot:ingest using BRPOP, processes jobs one at a time.
 *
 * Migration path to BullMQ (RF roadmap):
 *   1. pnpm --dir apps/api add bullmq @nestjs/bullmq
 *   2. Register BullModule.forRoot() with Redis connection in AppModule
 *   3. Replace this service with @Processor('iot:ingest') class
 */
@Injectable()
export class QueueWorkerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(QueueWorkerService.name);
  private running = true;
  private workerPromise?: Promise<void>;

  constructor(
    @Inject(RedisService) private readonly redis: RedisService,
    @Inject(IotService) private readonly iotService: IotService,
  ) {}

  onModuleInit(): void {
    this.workerPromise = this.startWorker();
  }

  async onModuleDestroy(): Promise<void> {
    this.running = false;
    await this.workerPromise;
  }

  private async startWorker(): Promise<void> {
    // Use a dedicated blocking client (BRPOP blocks the connection)
    const blockingClient = this.redis.getClient().duplicate();

    this.logger.log(`IoT ingest worker started — listening on queue:${QUEUE_IOT_INGEST}`);

    while (this.running) {
      try {
        // BRPOP blocks up to 2s, then loops — allows clean shutdown
        const result = await blockingClient.brpop(`queue:${QUEUE_IOT_INGEST}`, 2);
        if (!result) continue;

        const [, raw] = result;
        const job = JSON.parse(raw) as IotIngestJob;

        await this.iotService.processIngestJob(job);
      } catch (err) {
        this.logger.error('IoT ingest worker error', err);
        // Short backoff before retry
        await new Promise((r) => setTimeout(r, 1000));
      }
    }

    blockingClient.disconnect();
    this.logger.log('IoT ingest worker stopped');
  }
}
