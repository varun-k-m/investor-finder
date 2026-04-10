# Story 2.6: Implement Ranking + Scoring Agent (Agent 5)

Status: ready-for-dev

## Story

As a developer,
I want a `RankingService` that calls Claude Sonnet to score each investor across four fit dimensions and sort them by overall score,
so that founders see the most relevant investors first.

## Acceptance Criteria

1. `RankingService` is injectable with method `async rank(investors: SynthesisedInvestor[], parsedIdea: ParsedIdea): Promise<RankedInvestor[]>`.
2. If `investors` is empty, return `[]` immediately without calling Claude.
3. The Claude call uses model `claude-sonnet-4-6`, max_tokens 3000, and the exact system prompt from `docs/architecture.md#Section 6.5`.
4. `{{PARSED_IDEA}}` is replaced with `JSON.stringify(parsedIdea)` and `{{MERGED_INVESTORS}}` with `JSON.stringify(investors)`.
5. The response is a JSON array parsed into `RankedInvestor[]` — each item has `canonical_name`, `sector_fit`, `stage_fit`, `budget_fit`, `geo_fit`, `overall`, `fit_reasoning`.
6. If JSON parsing fails, log the error and return investors with all scores set to 0 and `fit_reasoning: 'Scoring unavailable'`.
7. The final array is sorted by `overall` descending and each investor is assigned `rank_position` (1-based index).
8. Unit tests cover: empty input, successful ranking with correct sort order, JSON parse failure.

## Tasks / Subtasks

- [ ] Implement RankingService (AC: 1–7)
  - [ ] Create `backend/src/agents/ranking.service.ts`
  - [ ] Inject `ANTHROPIC_CLIENT`
  - [ ] Guard: if `investors.length === 0`, return `[]`
  - [ ] Build prompt: replace `{{PARSED_IDEA}}` and `{{MERGED_INVESTORS}}` in arch §6.5 system prompt
  - [ ] Call Claude: `model: 'claude-sonnet-4-6'`, `max_tokens: 3000`
  - [ ] Strip markdown fences, parse JSON array
  - [ ] On parse failure: return fallback array (all scores 0, `fit_reasoning: 'Scoring unavailable'`)
  - [ ] Sort by `overall` desc, assign `rank_position` starting at 1
  - [ ] Return `RankedInvestor[]`
- [ ] Write unit tests (AC: 8)
  - [ ] Mock `ANTHROPIC_CLIENT`
  - [ ] Test sort order is correct (highest `overall` is rank 1)
  - [ ] Test fallback on bad JSON

## Dev Notes

- **`RankedInvestor` type**: Defined in `backend/src/common/types/index.ts`. It extends `SynthesisedInvestor` with the score fields and `rank_position`. Do not redefine.
- **Score formula validation**: Claude is instructed to compute `overall = (sector_fit * 0.40) + (stage_fit * 0.25) + (budget_fit * 0.25) + (geo_fit * 0.10)`. Do NOT re-compute on the server — trust Claude's `overall` field. Only use server-side sort on `overall`.
- **Merging ranked scores back**: Claude returns an array with `canonical_name` + scores but NOT the full investor profile. You need to merge the scores back onto the full `SynthesisedInvestor` objects by matching on `canonical_name`. Use `Map` for O(n) lookup:
  ```typescript
  const scoreMap = new Map(ranked.map(r => [r.canonical_name, r]));
  return investors.map((inv, i) => ({
    ...inv,
    ...(scoreMap.get(inv.canonical_name) ?? { overall: 0, ... }),
    rank_position: i + 1,
  })).sort((a, b) => b.overall - a.overall)
    .map((inv, i) => ({ ...inv, rank_position: i + 1 }));
  ```
- **Token budget**: 3000 max tokens for 30 investors × ~5 score fields + reasoning = ~100 tokens/investor. This fits comfortably.
- **Fallback on parse failure**: Rather than throwing, return all investors with `overall: 0` — they'll still be persisted and the founder sees results, just unranked.

### References

- [Source: docs/architecture.md#Section 6.5] — Exact system prompt, scoring formula
- [Source: docs/architecture.md#Section 6.2] — Ranking is the final pipeline step before DB persist
- [Source: backend/src/common/types/index.ts] — `RankedInvestor`, `SynthesisedInvestor`, `ParsedIdea`

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List
