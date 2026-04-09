import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { ParsedIdea, SynthesisedInvestor } from '../../common/types';

const TAVILY_URL = 'https://api.tavily.com/search';

interface TavilyResult {
  title: string;
  url: string;
  content: string;
}

/** [Source: docs/architecture.md#Section 6.3b] */
@Injectable()
export class WebSearchService {
  private readonly logger = new Logger(WebSearchService.name);

  constructor(private readonly config: ConfigService) {}

  async search(parsedIdea: ParsedIdea): Promise<SynthesisedInvestor[]> {
    const apiKey = this.config.get<string>('TAVILY_API_KEY');
    if (!apiKey) {
      this.logger.warn('TAVILY_API_KEY not set — skipping web search');
      return [];
    }

    const queries = [
      `${parsedIdea.sector?.[0] ?? ''} ${parsedIdea.stage ?? ''} investor ${parsedIdea.geography ?? ''}`.trim(),
      `venture capital ${parsedIdea.sub_sector ?? parsedIdea.sector?.[0] ?? ''} fund 2024 2025`,
      `angel investor ${(parsedIdea.keywords ?? []).slice(0, 3).join(' ')}`,
    ];

    try {
      const settled = await Promise.allSettled(
        queries.map((q) => this.tavilySearch(q, apiKey)),
      );

      const allResults: SynthesisedInvestor[] = settled.flatMap((r) =>
        r.status === 'fulfilled' ? r.value : [],
      );

      return this.deduplicateByDomain(allResults);
    } catch (err) {
      this.logger.error('WebSearchService.search failed', err);
      return [];
    }
  }

  private async tavilySearch(query: string, apiKey: string): Promise<SynthesisedInvestor[]> {
    const response = await axios.post<{ results: TavilyResult[] }>(TAVILY_URL, {
      api_key: apiKey,
      query,
      search_depth: 'basic',
      max_results: 10,
    });
    return (response.data.results ?? []).map((r) => this.mapResult(r));
  }

  private mapResult(result: TavilyResult): SynthesisedInvestor {
    const name = result.title
      .split(/[|–\-]/)[0]
      .trim()
      .replace(/\s+/g, ' ') || 'Unknown';

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
      sources: ['web'],
      source_urls: [result.url],
      conflicts: [],
    };
  }

  private deduplicateByDomain(investors: SynthesisedInvestor[]): SynthesisedInvestor[] {
    const seen = new Set<string>();
    return investors.filter((inv) => {
      if (!inv.website) return true;
      try {
        const domain = new URL(inv.website).hostname.replace(/^www\./, '');
        if (seen.has(domain)) return false;
        seen.add(domain);
        return true;
      } catch {
        return true;
      }
    });
  }
}
