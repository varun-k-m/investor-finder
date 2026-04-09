import { Injectable, Inject, Logger } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import { ParsedIdea, SynthesisedInvestor } from '../common/types';

const SYNTHESIS_SYSTEM_PROMPT = `You are a data synthesis expert. You will receive raw investor records from
multiple sources. Your job is to:

1. NORMALISE: Map every record to the canonical schema below.
2. DEDUPLICATE: Identify records referring to the same entity using:
   - Name similarity (fuzzy match — "Sequoia" and "Sequoia Capital" are the same)
   - Website/domain match (strongest signal — exact match = definite same entity)
   - Sector + geography overlap (tiebreaker for ambiguous names)
3. MERGE: For confirmed duplicates, merge into one record:
   - Use the most complete/formal name
   - Union all sector tags, deduplicate synonyms
   - Take the range for numeric fields (check size min/max)
   - Prefer the source with highest data quality for contact fields
4. FLAG conflicts: If two sources disagree on a critical field (investment stage,
   check size by >3x), set that field to null and add to "conflicts" array.

Canonical schema per investor:
{
  "canonical_name": string,
  "fund_name": string | null,
  "website": string | null,
  "sectors": string[],
  "stages": string[],
  "geo_focus": string[],
  "check_min": number | null,
  "check_max": number | null,
  "contact_email": string | null,
  "linkedin_url": string | null,
  "sources": string[],
  "source_urls": string[],
  "conflicts": string[]
}

Return ONLY a JSON array of canonical investor objects. No preamble.
Input records: {{RAW_RECORDS}}`;

/** [Source: docs/architecture.md#Section 6.4] */
@Injectable()
export class SynthesisService {
  private readonly logger = new Logger(SynthesisService.name);

  constructor(
    @Inject('ANTHROPIC_CLIENT')
    private readonly anthropic: Anthropic,
  ) {}

  async synthesise(rawRecords: SynthesisedInvestor[], _parsedIdea: ParsedIdea): Promise<SynthesisedInvestor[]> {
    if (rawRecords.length === 0) return [];

    // Trim to 50 most unique by domain to avoid context overflow
    const trimmed = this.trimByDomain(rawRecords, 50);

    const systemPrompt = SYNTHESIS_SYSTEM_PROMPT.replace(
      '{{RAW_RECORDS}}',
      JSON.stringify(trimmed),
    );

    const response = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      system: systemPrompt,
      messages: [{ role: 'user', content: 'Synthesise the investor records above.' }],
    });

    const text = (response.content[0] as { type: string; text: string }).text;
    const cleaned = text
      .replace(/^```json\n?/, '')
      .replace(/^```\n?/, '')
      .replace(/\n?```$/, '')
      .trim();

    try {
      const result = JSON.parse(cleaned) as SynthesisedInvestor[];
      return result.slice(0, 30);
    } catch (err) {
      this.logger.error('SynthesisService: failed to parse Claude response — returning raw records', err);
      return rawRecords;
    }
  }

  private trimByDomain(records: SynthesisedInvestor[], max: number): SynthesisedInvestor[] {
    const seen = new Set<string>();
    return records.filter((r) => {
      if (!r.website) return true;
      try {
        const domain = new URL(r.website).hostname.replace(/^www\./, '');
        if (seen.has(domain)) return false;
        seen.add(domain);
        return true;
      } catch {
        return true;
      }
    }).slice(0, max);
  }
}
