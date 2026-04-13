import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { ParsedIdea, SynthesisedInvestor } from '../../common/types';

const TAVILY_URL = 'https://api.tavily.com/search';

interface TavilyResult {
  title: string;
  url: string;
  content: string;
  raw_content?: string;
}

/** [Source: docs/architecture.md#Section 6.2 — news signal source agent] */
@Injectable()
export class NewsSignalService {
  private readonly logger = new Logger(NewsSignalService.name);

  constructor(private readonly config: ConfigService) {}

  async search(parsedIdea: ParsedIdea): Promise<SynthesisedInvestor[]> {
    const apiKey = this.config.get<string>('TAVILY_API_KEY');
    if (!apiKey) {
      this.logger.warn('TAVILY_API_KEY not set — skipping news signal search');
      return [];
    }

    const sector = parsedIdea.sector?.[0] ?? '';
    const subSector = parsedIdea.sub_sector ?? sector;
    const geo = parsedIdea.geography ?? '';
    const stage = parsedIdea.stage ?? '';

    // Q1: Deal news — names the lead investor alongside stage + geo context.
    // Q2: Fund news — closings and raises reveal which funds are actively deploying.
    const queries = [
      `${sector} startup funding round ${stage} ${geo} lead investor 2024 2025`.trim(),
      `venture capital ${subSector} ${geo} fund raised closed 2024 2025`.trim(),
    ];

    try {
      const settled = await Promise.allSettled(
        queries.map((q) => this.tavilyNewsSearch(q, apiKey)),
      );

      const allResults: SynthesisedInvestor[] = settled.flatMap((r) =>
        r.status === 'fulfilled' ? r.value : [],
      );

      // Deduplicate by URL
      const seen = new Set<string>();
      return allResults.filter((inv) => {
        const url = inv.source_urls[0];
        if (!url || seen.has(url)) return false;
        seen.add(url);
        return true;
      });
    } catch (err) {
      this.logger.error('NewsSignalService.search failed', err);
      return [];
    }
  }

  private async tavilyNewsSearch(query: string, apiKey: string): Promise<SynthesisedInvestor[]> {
    const response = await axios.post<{ results: TavilyResult[] }>(TAVILY_URL, {
      api_key: apiKey,
      query,
      search_depth: 'basic',
      topic: 'news',
      max_results: 8,
      include_raw_content: true,
    });
    return (response.data.results ?? []).map((r) => this.mapResult(r));
  }

  private mapResult(result: TavilyResult): SynthesisedInvestor {
    const name = result.title.split(/[|–\-]/)[0].trim().replace(/\s+/g, ' ') || 'Unknown';
    return {
      canonical_name: name,
      fund_name: null,
      website: result.url,
      sectors: [],
      stages: [],
      geo_focus: [],
      check_min: null,
      check_max: null,
      contact_email: null,
      linkedin_url: null,
      sources: ['news'],
      source_urls: [result.url],
      conflicts: [],
      raw_text: result.raw_content ?? result.content ?? undefined,
    };
  }
}
