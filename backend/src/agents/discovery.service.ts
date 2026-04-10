import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ParsedIdea, RankedInvestor, SynthesisedInvestor } from '../common/types';
import { InvestorProfile } from '../investors/entities/investor-profile.entity';
import { Search } from '../searches/entities/search.entity';
import { CrunchbaseService } from './sources/crunchbase.service';
import { WebSearchService } from './sources/web-search.service';
import { NewsSignalService } from './sources/news-signal.service';
import { SynthesisService } from './synthesis.service';
import { RankingService } from './ranking.service';
import { AgentProgressStore } from '../searches/agent-progress.store';
import { EmailService } from '../email/email.service';

/** [Source: docs/architecture.md#Section 6.2] */
@Injectable()
export class DiscoveryService {
  private readonly logger = new Logger(DiscoveryService.name);

  constructor(
    private readonly crunchbase: CrunchbaseService,
    private readonly webSearch: WebSearchService,
    private readonly newsSignal: NewsSignalService,
    private readonly synthesis: SynthesisService,
    private readonly ranking: RankingService,
    private readonly progressStore: AgentProgressStore,
    private readonly emailService: EmailService,
    @InjectRepository(InvestorProfile)
    private readonly investorRepo: Repository<InvestorProfile>,
    @InjectRepository(Search)
    private readonly searchRepo: Repository<Search>,
  ) {}

  async run(searchId: string, parsedIdea: ParsedIdea): Promise<void> {
    try {
      await this.searchRepo.update({ id: searchId }, { status: 'running' });
      this.progressStore.emit(searchId, 'searching', 10);

      // Fan out to all sources in parallel
      const [cb, web, news] = await Promise.allSettled([
        this.crunchbase.search(parsedIdea),
        this.webSearch.search(parsedIdea),
        this.newsSignal.search(parsedIdea),
      ]);

      const allRaw = this.collectSuccessful([cb, web, news]);
      this.logger.log(`Discovery: collected ${allRaw.length} raw records for search ${searchId}`);
      this.progressStore.emit(searchId, 'synthesis', 60);

      const synthesised = await this.synthesis.synthesise(allRaw, parsedIdea);
      this.logger.log(`Discovery: synthesised ${synthesised.length} investors`);
      this.progressStore.emit(searchId, 'ranking', 80);

      const ranked = await this.ranking.rank(synthesised, parsedIdea);
      this.logger.log(`Discovery: ranked ${ranked.length} investors`);

      await this.persistInvestors(ranked, searchId);

      await this.searchRepo.update(
        { id: searchId },
        { status: 'complete', result_count: ranked.length, completed_at: new Date() },
      );
      this.progressStore.complete(searchId);

      // Fire-and-forget search complete email
      const search = await this.searchRepo.findOne({ where: { id: searchId }, relations: ['user'] });
      if (search?.user) {
        this.emailService
          .sendSearchCompleteEmail(
            search.user.email,
            search.user.name,
            searchId,
            ranked.length,
            search.raw_input,
          )
          .catch((err) => this.logger.error('Failed to send search complete email', err));
      }
    } catch (err) {
      this.logger.error(`Discovery failed for search ${searchId}`, err);
      this.progressStore.emit(searchId, 'failed', 0);
      this.progressStore.complete(searchId);
      await this.searchRepo.update({ id: searchId }, { status: 'failed' }).catch(() => undefined);
    }
  }

  private collectSuccessful(
    results: PromiseSettledResult<SynthesisedInvestor[]>[],
  ): SynthesisedInvestor[] {
    return results.flatMap((r) => {
      if (r.status === 'fulfilled') return r.value;
      this.logger.warn('Source agent failed', (r as PromiseRejectedResult).reason);
      return [];
    });
  }

  private async persistInvestors(ranked: RankedInvestor[], searchId: string): Promise<void> {
    if (ranked.length === 0) return;
    const entities = ranked.map((inv) =>
      this.investorRepo.create({
        search_id: searchId,
        canonical_name: inv.canonical_name,
        fund_name: inv.fund_name,
        website: inv.website,
        sectors: inv.sectors,
        stages: inv.stages,
        geo_focus: inv.geo_focus,
        check_min: inv.check_min,
        check_max: inv.check_max,
        contact_email: inv.contact_email,
        linkedin_url: inv.linkedin_url,
        sources: inv.sources,
        source_urls: inv.source_urls,
        fit_score: inv.overall,
        sector_fit: inv.sector_fit,
        stage_fit: inv.stage_fit,
        budget_fit: inv.budget_fit,
        geo_fit: inv.geo_fit,
        fit_reasoning: inv.fit_reasoning,
        rank_position: inv.rank_position,
      }),
    );
    await this.investorRepo.save(entities);
  }
}
