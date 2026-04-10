import { Injectable, Inject, Logger } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import { ParsedIdea, SynthesisedInvestor } from '../common/types';

const SYNTHESIS_SYSTEM_PROMPT = `You are an expert at identifying and extracting investor profiles from raw web data.

You will receive raw records from web searches. Each record has:
- canonical_name: the page title (may be an article title, not an investor name)
- website / source_urls: the source URL
- raw_text: the actual page content — THIS is where investor information lives
- sectors/stages/etc: may be empty — extract these from raw_text if available

Your job:
1. EXTRACT: From each record's raw_text (and canonical_name/URL), identify real investors mentioned (venture capital firms, angel investors, family offices, corporate VCs). Ignore list articles, news sites, and non-investor pages.
2. NORMALISE: For each real investor found, produce one canonical object.
3. DEDUPLICATE: Merge records referring to the same investor (same name, domain, or clearly the same entity).
4. EXTRACT FIELDS from raw_text where possible: sectors they invest in, stages (pre-seed/seed/series-a/etc), geography focus, check sizes, website.

Canonical schema per investor (output only these fields):
{
  "canonical_name": string,        // formal name e.g. "Sequoia Capital"
  "fund_name": string | null,      // fund name if different from firm name
  "website": string | null,        // investor's own website
  "sectors": string[],             // e.g. ["fintech", "saas"]
  "stages": string[],              // e.g. ["seed", "series-a"]
  "geo_focus": string[],           // e.g. ["US", "Southeast Asia"]
  "check_min": number | null,      // minimum check size in USD
  "check_max": number | null,      // maximum check size in USD
  "contact_email": string | null,
  "linkedin_url": string | null,
  "sources": string[],
  "source_urls": string[],
  "conflicts": string[]
}

Return ONLY a valid JSON array. No preamble, no markdown fences. Return [] only if zero real investors can be identified.
Input records:
{{RAW_RECORDS}}`;

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

    // Truncate raw_text per record to keep total prompt manageable
    const truncated = trimmed.map((r) => ({
      ...r,
      raw_text: r.raw_text ? r.raw_text.slice(0, 800) : undefined,
    }));

    const systemPrompt = SYNTHESIS_SYSTEM_PROMPT.replace(
      '{{RAW_RECORDS}}',
      JSON.stringify(truncated),
    );

    const response = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 8000,
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
