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

    const primarySector = parsedIdea.sector?.[0] ?? '';
    const secondarySector = parsedIdea.sector?.[1] ?? '';
    const subSector = parsedIdea.sub_sector ?? primarySector;
    const geo = parsedIdea.geography ?? '';
    const stage = parsedIdea.stage ?? '';
    const keywords = (parsedIdea.keywords ?? []).slice(0, 3).join(' ');

    // Queries ordered by how much structured data they tend to surface.
    // Q1: Multi-sector + stage discovery — broader net than single-sector.
    // Q2: Explicit check-size / thesis signal — raw_content needed for parser to extract these fields.
    // Q3: Curated list pages — synthesis extracts every investor name mentioned in them.
    // Q4: Keyword + stage + geo angle — catches niche/specialist angels.
    // Note: LinkedIn site: search removed — slow/blocked by Tavily; LinkedIn URLs are still
    // captured via isLinkedInProfile() whenever other queries surface linkedin.com/in links.
    const queries: Array<{ q: string; rawContent: boolean }> = [
      { q: `${[primarySector, secondarySector].filter(Boolean).join(' ')} ${stage} venture capital investor ${geo}`.trim(), rawContent: false },
      { q: `"${subSector}" VC fund "check size" OR "ticket size" investment thesis ${stage} 2025`.trim(), rawContent: true },
      { q: `top ${primarySector} investors ${geo} ${stage} startup funding 2024 2025`.trim(), rawContent: false },
      { q: `angel investor ${keywords} ${geo} investment thesis ${stage}`.trim(), rawContent: false },
    ];

    try {
      const settled = await Promise.allSettled(
        queries.map(({ q, rawContent }) => this.tavilySearch(q, apiKey, rawContent)),
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

  private async tavilySearch(query: string, apiKey: string, includeRawContent = false): Promise<SynthesisedInvestor[]> {
    const response = await axios.post<{ results: TavilyResult[] }>(TAVILY_URL, {
      api_key: apiKey,
      query,
      search_depth: 'basic',
      max_results: 10,
      include_raw_content: includeRawContent,
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
      raw_text: result.raw_content ?? result.content ?? undefined,
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
