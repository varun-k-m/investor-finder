import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { ParsedIdea, SynthesisedInvestor } from '../../common/types';

const CRUNCHBASE_API_URL = 'https://api.crunchbase.com/api/v4/searches/organizations';

interface CrunchbaseOrg {
  properties: {
    name?: string;
    website_url?: string;
    investor_stage?: string[];
    identifier?: { permalink?: string };
  };
}

/** [Source: docs/architecture.md#Section 6.3] */
@Injectable()
export class CrunchbaseService {
  private readonly logger = new Logger(CrunchbaseService.name);

  constructor(private readonly config: ConfigService) {}

  /** Called by the agentic loop — Claude supplies keywords directly. */
  async searchByKeywords(keywords: string[], parsedIdea: ParsedIdea): Promise<SynthesisedInvestor[]> {
    return this.search({ ...parsedIdea, keywords });
  }

  async search(parsedIdea: ParsedIdea): Promise<SynthesisedInvestor[]> {
    const apiKey = this.config.get<string>('CRUNCHBASE_API_KEY');
    if (!apiKey) {
      this.logger.warn('CRUNCHBASE_API_KEY not set — skipping Crunchbase search');
      return [];
    }

    try {
      const keywordPredicates = (parsedIdea.keywords ?? []).slice(0, 3).map((kw) => ({
        type: 'predicate',
        field_id: 'short_description',
        operator_id: 'contains',
        values: [kw],
      }));

      const body = {
        field_ids: ['name', 'short_description', 'website_url', 'investor_stage', 'identifier'],
        query: [
          {
            type: 'predicate',
            field_id: 'facet_ids',
            operator_id: 'includes',
            values: ['investor'],
          },
          {
            type: 'predicate',
            field_id: 'investor_type',
            operator_id: 'includes',
            values: ['venture_capital', 'angel'],
          },
          ...keywordPredicates,
        ],
        limit: 25,
      };

      const response = await axios.post<{ entities: CrunchbaseOrg[] }>(
        CRUNCHBASE_API_URL,
        body,
        { params: { user_key: apiKey }, timeout: 10_000 },
      );

      return (response.data.entities ?? []).map((org) => this.mapToInvestor(org, parsedIdea));
    } catch (err) {
      this.logger.error('CrunchbaseService.search failed', err);
      return [];
    }
  }

  private mapToInvestor(org: CrunchbaseOrg, parsedIdea: ParsedIdea): SynthesisedInvestor {
    const p = org.properties;
    const permalink = p.identifier?.permalink;
    return {
      canonical_name: p.name ?? 'Unknown',
      fund_name: null,
      website: p.website_url ?? null,
      sectors: parsedIdea.sector ?? [],
      stages: p.investor_stage ?? [],
      geo_focus: [],
      check_min: null,
      check_max: null,
      contact_email: null,
      linkedin_url: null,
      sources: ['crunchbase'],
      source_urls: permalink ? [`https://crunchbase.com/organization/${permalink}`] : [],
      conflicts: [],
    };
  }
}
