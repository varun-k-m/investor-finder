import { Injectable, Inject, Logger } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import { ParsedIdea } from '../common/types';

/** [Source: docs/architecture.md#Section 6.1] */
const IDEA_PARSER_SYSTEM_PROMPT = `You are an expert startup analyst. Extract structured metadata from a founder's
product description. Return ONLY valid JSON matching this exact schema —
no preamble, no explanation, no markdown fences.

Schema:
{
  "title": "short product name (max 6 words)",
  "sector": ["primary sector", "secondary sector if applicable"],
  "sub_sector": "specific niche (e.g. 'B2B payment reconciliation')",
  "stage": "idea | mvp | revenue | growth",
  "geography": "founder's country/region",
  "target_market": "B2B | B2C | B2B2C",
  "funding_ask": { "amount": number_in_usd, "currency_mentioned": "string" },
  "keywords": ["5-8 keywords for investor search"],
  "one_liner": "what this product does in one sentence"
}

If any field cannot be determined, set it to null. Never guess wildly.`;

@Injectable()
export class IdeaParserService {
  private readonly logger = new Logger(IdeaParserService.name);

  constructor(
    @Inject('ANTHROPIC_CLIENT')
    private readonly anthropic: Anthropic,
  ) {}

  async parse(
    rawInput: string,
    structured?: {
      sectors?: string[];
      stages?: string[];
      geo_focus?: string[];
      budget_min?: number;
      budget_max?: number;
    },
  ): Promise<ParsedIdea> {
    const hasOverrides = structured && Object.values(structured).some((v) => v !== undefined);
    const userMessage = hasOverrides
      ? `STRUCTURED_OVERRIDES: ${JSON.stringify(structured)}\n\nFOUNDER DESCRIPTION:\n${rawInput}`
      : rawInput;

    const response = await this.anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 800,
      system: IDEA_PARSER_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    });

    const text = (response.content[0] as { type: string; text: string }).text;
    const cleaned = text
      .replace(/^```json\n?/, '')
      .replace(/^```\n?/, '')
      .replace(/\n?```$/, '')
      .trim();

    try {
      return JSON.parse(cleaned) as ParsedIdea;
    } catch {
      this.logger.error('IdeaParser: invalid JSON from Claude', cleaned);
      throw new Error('IdeaParser: invalid JSON from Claude');
    }
  }
}
