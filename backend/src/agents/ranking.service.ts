import { Injectable, Inject, Logger } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import { ParsedIdea, RankedInvestor, SynthesisedInvestor } from '../common/types';

const RANKING_SYSTEM_PROMPT = `You are an expert startup fundraising advisor. Score each investor's fit
for this startup idea across four dimensions (0-100 each).

Startup idea:
{{PARSED_IDEA}}

Scoring dimensions:
- sector_fit: Does the investor's thesis and portfolio match the startup's sector?
  Reason semantically — "fintech infrastructure" matches "B2B payment tools".
  If the investor has no listed sectors, score 50 (unknown, not penalised).
- stage_fit: Does the startup's current stage match investor's preferred stage?
  Penalise heavily if more than one stage away.
  If the startup stage is null/unknown OR the investor has no listed stages, score 50.
- budget_fit: Does the funding ask fall within the investor's typical check size?
  Score 100 if within range, penalise proportionally outside range.
  If the funding ask is null/unknown OR the investor has no check size data, score 50.
- geo_fit: Does the investor invest in the founder's geography?
  Score 100 if explicit match, 70 if global/agnostic, 30 if different region.
  If geography is null/unknown for either side, score 60.

IMPORTANT: Never score a dimension 0 purely because data is missing. Reserve 0 for clear
mismatches (e.g. investor only does biotech but startup is SaaS).

overall = (sector_fit * 0.40) + (stage_fit * 0.25) +
          (budget_fit * 0.25) + (geo_fit * 0.10)

For each investor return:
{
  "canonical_name": string,
  "sector_fit": number,
  "stage_fit": number,
  "budget_fit": number,
  "geo_fit": number,
  "overall": number,
  "fit_reasoning": "2-3 sentence plain English explanation for the founder"
}

Sort output array by overall score descending.
Return ONLY the JSON array.

Investors to score: {{MERGED_INVESTORS}}`;

interface ScoreResult {
  canonical_name: string;
  sector_fit: number;
  stage_fit: number;
  budget_fit: number;
  geo_fit: number;
  overall: number;
  fit_reasoning: string;
}

/** [Source: docs/architecture.md#Section 6.5] */
@Injectable()
export class RankingService {
  private readonly logger = new Logger(RankingService.name);

  constructor(
    @Inject('ANTHROPIC_CLIENT')
    private readonly anthropic: Anthropic,
  ) {}

  async rank(investors: SynthesisedInvestor[], parsedIdea: ParsedIdea): Promise<RankedInvestor[]> {
    if (investors.length === 0) return [];

    const systemPrompt = RANKING_SYSTEM_PROMPT
      .replace('{{PARSED_IDEA}}', JSON.stringify(parsedIdea))
      .replace('{{MERGED_INVESTORS}}', JSON.stringify(investors));

    const response = await this.anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 3000,
      system: systemPrompt,
      messages: [{ role: 'user', content: 'Score and rank the investors above.' }],
    });

    const text = (response.content[0] as { type: string; text: string }).text;
    const cleaned = text
      .replace(/^```json\n?/, '')
      .replace(/^```\n?/, '')
      .replace(/\n?```$/, '')
      .trim();

    let scores: ScoreResult[];
    try {
      scores = JSON.parse(cleaned) as ScoreResult[];
    } catch (err) {
      this.logger.error('RankingService: failed to parse Claude response — returning unscored', err);
      return investors
        .map((inv, i) => ({
          ...inv,
          sector_fit: 0,
          stage_fit: 0,
          budget_fit: 0,
          geo_fit: 0,
          overall: 0,
          fit_reasoning: 'Scoring unavailable',
          rank_position: i + 1,
        }));
    }

    // Merge scores back onto full investor objects by canonical_name.
    // Claude may normalize names (e.g. "a16z" vs "Andreessen Horowitz"), so fall back
    // to a case-insensitive normalised lookup before defaulting to zero.
    const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
    const scoreMap = new Map(scores.map((s) => [s.canonical_name, s]));
    const normalizedScoreMap = new Map(scores.map((s) => [normalize(s.canonical_name), s]));

    const merged = investors.map((inv) => {
      const score =
        scoreMap.get(inv.canonical_name) ??
        normalizedScoreMap.get(normalize(inv.canonical_name)) ?? {
          sector_fit: 0, stage_fit: 0, budget_fit: 0, geo_fit: 0,
          overall: 0, fit_reasoning: 'Scoring unavailable',
        };
      return { ...inv, ...score };
    });

    // Sort by overall descending, assign rank_position
    return merged
      .sort((a, b) => b.overall - a.overall)
      .map((inv, i) => ({ ...inv, rank_position: i + 1 }));
  }
}
