import { Injectable, Inject, Logger } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import { ParsedIdea, SynthesisedInvestor } from '../common/types';

const SYNTHESIS_SYSTEM_PROMPT = `You are an expert at extracting investor profiles from web search results.

You will receive an array of raw search result records. Each record has:
- canonical_name: the web page title (often an article headline or firm name)
- source_urls: where the content came from
- raw_text: a snippet of the page content
- sectors/stages/geo_focus: may be empty arrays — extract from raw_text if possible

IMPORTANT: Many records will be from articles like "Top 10 VC firms in fintech" or "Best angel investors for SaaS". These are VALUABLE — extract every investor name mentioned in them.

Your task:
1. Read every record's canonical_name and raw_text carefully
2. Identify every venture capital firm, angel investor, family office, or institutional investor MENTIONED anywhere in the content
3. For each investor found, create one canonical profile extracting all available details
4. Deduplicate: if the same firm appears in multiple records, merge into one entry

For each investor produce exactly this JSON shape:
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

Rules:
- Extract investor names even if only briefly mentioned ("Sequoia led the round" → include Sequoia Capital)
- For website: use the investor's own domain, not the article URL
- For stages: use lowercase strings like "pre-seed", "seed", "series-a", "series-b", "growth"
- If a field cannot be determined, use null or []
- Return ONLY a raw JSON array — no markdown, no explanation, no preamble`;

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

    // Trim to 25 most unique by domain — enough variety without bloating the prompt
    const trimmed = this.trimByDomain(rawRecords, 25);

    // 500 chars is plenty to identify investor names, stages, and check sizes from a snippet.
    // Keeping this tight is the single biggest lever on synthesis latency.
    const truncated = trimmed.map((r) => ({
      ...r,
      raw_text: r.raw_text ? r.raw_text.slice(0, 500) : undefined,
    }));

    // Records go in the user message so the system prompt stays static and cacheable.
    const response = await this.anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 6000,
      system: SYNTHESIS_SYSTEM_PROMPT,
      messages: [{
        role: 'user',
        content: `Synthesise these investor records:\n${JSON.stringify(truncated)}`,
      }],
    });

    const text = (response.content[0] as { type: string; text: string }).text;
    this.logger.log(`SynthesisService: Claude raw response (first 300 chars): ${text.slice(0, 300)}`);

    const cleaned = text
      .replace(/^```json\n?/, '')
      .replace(/^```\n?/, '')
      .replace(/\n?```$/, '')
      .trim();

    try {
      const result = JSON.parse(cleaned) as SynthesisedInvestor[];
      this.logger.log(`SynthesisService: parsed ${result.length} investors from Claude`);
      return result.slice(0, 30);
    } catch (err) {
      this.logger.error('SynthesisService: failed to parse Claude response — returning raw records', err);
      this.logger.error(`SynthesisService: cleaned text (first 500): ${cleaned.slice(0, 500)}`);
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
