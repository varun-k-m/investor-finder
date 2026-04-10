# Story 2.5: Implement Synthesis + Deduplication Agent (Agent 4)

Status: ready-for-dev

## Story

As a developer,
I want a `SynthesisService` that calls Claude Sonnet to normalise, deduplicate, and merge raw investor records from all sources into canonical investor objects,
so that the ranking agent receives clean, non-duplicate data.

## Acceptance Criteria

1. `SynthesisService` is injectable with method `async synthesise(rawRecords: SynthesisedInvestor[], parsedIdea: ParsedIdea): Promise<SynthesisedInvestor[]>`.
2. If `rawRecords` is empty, return `[]` immediately without calling Claude.
3. The Claude call uses model `claude-sonnet-4-6`, max_tokens 4000, and the exact system prompt from `docs/architecture.md#Section 6.4`.
4. `{{RAW_RECORDS}}` in the system prompt is replaced with `JSON.stringify(rawRecords)`.
5. The response is parsed as a JSON array. If parsing fails, log the error and return the input `rawRecords` unchanged (graceful degradation).
6. The returned array contains at most 30 investors (slice if Claude returns more).
7. Unit tests cover: empty input returns `[]`, successful synthesis, JSON parse failure returns input unchanged.

## Tasks / Subtasks

- [ ] Implement SynthesisService (AC: 1–6)
  - [ ] Create `backend/src/agents/synthesis.service.ts`
  - [ ] Inject `ANTHROPIC_CLIENT` via `@Inject('ANTHROPIC_CLIENT')`
  - [ ] Guard: if `rawRecords.length === 0`, return `[]`
  - [ ] Build system prompt: replace `{{RAW_RECORDS}}` in the arch §6.4 prompt with `JSON.stringify(rawRecords)`
  - [ ] Call Claude: `model: 'claude-sonnet-4-6'`, `max_tokens: 4000`
  - [ ] Strip markdown fences from response before JSON.parse
  - [ ] On JSON parse error: `this.logger.error(...)` and return `rawRecords` (graceful degradation)
  - [ ] Slice result to max 30: `return result.slice(0, 30)`
- [ ] Write unit tests (AC: 7)
  - [ ] Mock `ANTHROPIC_CLIENT`
  - [ ] Test: empty array → `[]` (no Claude call)
  - [ ] Test: valid JSON response → returns parsed array
  - [ ] Test: invalid JSON → returns original `rawRecords`

## Dev Notes

- **System prompt template**: The arch §6.4 prompt has `{{RAW_RECORDS}}` as a placeholder at the END of the system prompt. Replace it with the serialised records. Do NOT put raw records in the `messages` user turn — they belong in the system prompt for this agent.
- **Token budget**: 4000 max tokens allows ~30 merged investors with full fields. If you have 80+ raw records, trim to the 50 most unique by website domain before sending to Claude — this prevents context overflow.
- **Graceful degradation**: If Claude's synthesis fails (bad JSON, timeout), the system should still persist the raw records as-is and let the ranking agent handle imperfect data. Never fail the whole pipeline for a synthesis error.
- **`SynthesisedInvestor` type**: Defined in `backend/src/common/types/index.ts` — the output type is the same as the input type. The synthesis just cleans and deduplicates.
- **Markdown fence stripping**: Before JSON.parse, run:
  ```typescript
  const cleaned = text.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
  ```

### References

- [Source: docs/architecture.md#Section 6.4] — Exact system prompt for synthesis agent
- [Source: docs/architecture.md#Section 6.2] — Where synthesis fits in the pipeline
- [Source: backend/src/common/types/index.ts] — `SynthesisedInvestor`, `ParsedIdea`

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List
