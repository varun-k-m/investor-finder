import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Anthropic from '@anthropic-ai/sdk';
import { Search } from '../searches/entities/search.entity';
import { InvestorProfile } from '../investors/entities/investor-profile.entity';

/** [Source: docs/architecture.md#Section 7.5] */
@Injectable()
export class PitchService {
  constructor(
    @Inject('ANTHROPIC_CLIENT') private readonly anthropic: Anthropic,
    @InjectRepository(Search) private readonly searchRepo: Repository<Search>,
  ) {}

  /** AC: S3-006 — 6,7 */
  async generate(investor: InvestorProfile, userId: string): Promise<string> {
    const latestSearch = await this.searchRepo.findOne({
      where: { user_id: userId, status: 'complete' },
      order: { completed_at: 'DESC' },
    });

    if (!latestSearch || !latestSearch.parsed_idea) {
      throw new BadRequestException('No completed search found');
    }

    const prompt = `You are a startup fundraising coach. Write a concise, personalised cold outreach email from a founder to this investor.

Investor profile:
- Name: ${investor.canonical_name}
- Sectors: ${investor.sectors?.join(', ') ?? 'unknown'}
- Stages: ${investor.stages?.join(', ') ?? 'unknown'}
- Fit reasoning: ${investor.fit_reasoning ?? 'N/A'}

Startup idea:
${JSON.stringify(latestSearch.parsed_idea, null, 2)}

Write a 150-200 word email. Be specific about why this investor is a great fit. No generic platitudes. Sign off as "The Founder".`;

    const response = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 600,
      messages: [{ role: 'user', content: prompt }],
    });

    return (response.content[0] as { text: string }).text;
  }
}
