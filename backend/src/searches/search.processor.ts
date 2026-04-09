import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { DiscoveryService } from '../agents/discovery.service';
import { ParsedIdea } from '../common/types';

interface SearchJobData {
  searchId: string;
  parsedIdea: ParsedIdea;
}

/** [Source: docs/architecture.md#Section 7.4] */
@Processor('search')
export class SearchProcessor {
  private readonly logger = new Logger(SearchProcessor.name);

  constructor(private readonly discoveryService: DiscoveryService) {}

  // [Source: docs/architecture.md#Section 11] concurrency = 10 workers
  @Process({ concurrency: 10 })
  async handleSearch(job: Job<SearchJobData>): Promise<void> {
    this.logger.log(`[SearchProcessor] processing job ${job.id} for search ${job.data.searchId}`);
    await this.discoveryService.run(job.data.searchId, job.data.parsedIdea);
  }
}
