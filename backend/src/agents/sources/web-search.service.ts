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

    const sector = parsedIdea.sector?.[0] ?? '';
    const geo = parsedIdea.geography ?? '';
    const keywords = (parsedIdea.keywords ?? []).slice(0, 3).join(' ');

    const queries = [
      `${sector} ${parsedIdea.stage ?? ''} investor ${geo}`.trim(),
      `venture capital ${parsedIdea.sub_sector ?? sector} fund 2024 2025`,
      `angel investor ${keywords}`,
      `site:linkedin.com/in "${sector}" "venture capital" OR "angel investor" ${geo}`.trim(),
      `site:linkedin.com/in ${keywords} investor`,
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

  private isLinkedInProfile(url: string): boolean {
    try {
      const { hostname, pathname } = new URL(url);
      return hostname.includes('linkedin.com') && pathname.startsWith('/in/');
    } catch {
      return false;
    }
  }

  private mapResult(result: TavilyResult): SynthesisedInvestor {
    const name = result.title
      .split(/[|–\-]/)[0]
      .trim()
      .replace(/\s+/g, ' ') || 'Unknown';

    const isLinkedIn = this.isLinkedInProfile(result.url);

    return {
      canonical_name: name,
      fund_name: null,
      website: isLinkedIn ? null : result.url,
      sectors: [],
      stages: [],
      geo_focus: [],
      check_min: null,
      check_max: null,
      contact_email: null,
      linkedin_url: isLinkedIn ? result.url : null,
      sources: [isLinkedIn ? 'linkedin' : 'web'],
      source_urls: [result.url],
      conflicts: [],
      raw_text: result.content ?? undefined,
    };
  }

  private deduplicateByDomain(investors: SynthesisedInvestor[]): SynthesisedInvestor[] {
    const seen = new Set<string>();
    return investors.filter((inv) => {
      // LinkedIn profiles share a hostname — deduplicate by full profile URL instead
      const dedupeUrl = inv.linkedin_url ?? inv.website;
      if (!dedupeUrl) return true;
      try {
        const { hostname, pathname } = new URL(dedupeUrl);
        const key = hostname.includes('linkedin.com')
          ? `linkedin:${pathname.replace(/\/$/, '').toLowerCase()}`
          : hostname.replace(/^www\./, '');
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      } catch {
        return true;
      }
    });
  }
}
