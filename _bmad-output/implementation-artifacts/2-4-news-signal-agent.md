# Story 2.4: Implement News Signal Agent (Agent 3c)

Status: ready-for-dev

## Story

As a developer,
I want a `NewsSignalService` that uses Tavily to find recent news about investors active in the startup's sector,
so that the Discovery Orchestrator surfaces investors with recent deal activity as a relevance signal.

## Acceptance Criteria

1. `NewsSignalService` is injectable with method `async search(parsedIdea: ParsedIdea): Promise<SynthesisedInvestor[]>`.
2. Queries target recent investor news: `"[sector] investor funding 2024 2025"` and `"venture capital [sub_sector] deal"`.
3. Tavily is called with `search_depth: 'basic'`, `topic: 'news'` (Tavily news mode), `max_results: 8`.
4. Results are mapped to `SynthesisedInvestor` with `sources: ['news']`.
5. If `TAVILY_API_KEY` is not set, log a warning and return `[]`.
6. Any API error returns `[]` — never throws.
7. Unit tests cover: successful mapping, error handling.

## Tasks / Subtasks

- [ ] Implement NewsSignalService (AC: 1–6)
  - [ ] Create `backend/src/agents/sources/news-signal.service.ts`
  - [ ] Build 2 news-focused queries:
    ```typescript
    const queries = [
      `${parsedIdea.sector?.[0] ?? ''} investor funding 2024 2025`,
      `venture capital ${parsedIdea.sub_sector ?? parsedIdea.sector?.[0] ?? ''} deal`,
    ];
    ```
  - [ ] Call Tavily with `topic: 'news'` parameter added to request body
  - [ ] Run both queries in parallel via `Promise.allSettled`
  - [ ] Map results to `SynthesisedInvestor` — same mapping pattern as `WebSearchService` but `sources: ['news']`
  - [ ] Return flat deduplicated array
- [ ] Write unit tests (AC: 7)

## Dev Notes

- **Tavily news mode**: Pass `"topic": "news"` in the request body alongside `search_depth: 'basic'`. This restricts results to news articles rather than general web pages.
- **Signal not source**: News results give weaker structured data (no check sizes, no sectors list). Their value is signalling investor activity recency — the synthesis agent will merge them with richer Crunchbase/Tavily web data.
- **Reuse Tavily call pattern from S2-003**: `WebSearchService` and `NewsSignalService` both call Tavily. Consider extracting a private `tavilySearch(query, options)` helper — but only if both services exist in the same file or a shared util. Don't over-abstract across services.
- **Null safety**: Same guards as S2-003 — `parsedIdea` fields can be null.

### References

- [Source: docs/architecture.md#Section 6.2] — News signal agent is one of 4 parallel sources
- [Source: docs/architecture.md#Section 6.3b] — Tavily API pattern
- [Source: backend/src/common/types/index.ts] — `SynthesisedInvestor`, `ParsedIdea`
- [Source: docs/architecture.md#Section 9] — `TAVILY_API_KEY`

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List
