import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import Anthropic from '@anthropic-ai/sdk';
import { IdeaParserService } from './idea-parser.service';
import { DiscoveryService } from './discovery.service';
import { SynthesisService } from './synthesis.service';
import { RankingService } from './ranking.service';
import { PitchService } from './pitch.service';
import { CrunchbaseService } from './sources/crunchbase.service';
import { WebSearchService } from './sources/web-search.service';
import { NewsSignalService } from './sources/news-signal.service';
import { InvestorProfile } from '../investors/entities/investor-profile.entity';
import { Search } from '../searches/entities/search.entity';
import { AgentProgressStore } from '../searches/agent-progress.store';
import { EmailModule } from '../email/email.module';

/** [Source: docs/architecture.md#Section 7.5] */
@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([InvestorProfile, Search]),
    EmailModule,
  ],
  providers: [
    {
      provide: 'ANTHROPIC_CLIENT',
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        new Anthropic({ apiKey: config.get<string>('ANTHROPIC_API_KEY') }),
    },
    AgentProgressStore,
    IdeaParserService,
    DiscoveryService,
    SynthesisService,
    RankingService,
    PitchService,
    CrunchbaseService,
    WebSearchService,
    NewsSignalService,
  ],
  exports: [IdeaParserService, DiscoveryService, PitchService],
})
export class AgentsModule {}
