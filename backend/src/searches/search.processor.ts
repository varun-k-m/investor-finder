import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';

/**
 * SearchProcessor — stub for the BullMQ search job handler.
 * Full agent pipeline logic wired in S2-007.
 * [Source: docs/architecture.md#Section 11] concurrency = 10 workers
 */
@Processor('search')
export class SearchProcessor {
  private readonly logger = new Logger(SearchProcessor.name);

  // [Source: docs/architecture.md#Section 11] concurrency = 10 workers
  @Process({ concurrency: 10 })
  async handleSearch(job: Job): Promise<void> {
    this.logger.log(`[SearchProcessor] processing job ${job.id} — stub, full logic in S2-007`);
  }
}
