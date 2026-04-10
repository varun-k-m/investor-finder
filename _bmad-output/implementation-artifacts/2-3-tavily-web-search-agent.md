# Story 2.3: Implement Tavily Web Search Agent (Agent 3b)

Status: ready-for-dev

## Story

As a developer,
I want a `WebSearchService` that runs targeted Tavily searches to discover investors from the open web,
so that the Discovery Orchestrator has a broader, non-database source of investor data.

## Acceptance Criteria

1. `WebSearchService` is injectable with method `async search(parsedIdea: ParsedIdea): Promise<SynthesisedInvestor[]>`.
2. Three search queries are constructed from `parsedIdea` per the patterns in `docs/architecture.md#Section 6.3b`.
3. All three queries run in parallel via `Promise.allSettled`.
4. Each Tavily result is mapped to `SynthesisedInvestor` — extracting `canonical_name`, `website`, `source_urls` from the page content/URL where possible.
5. If `TAVILY_API_KEY` is not set, log a warning and return `[]`.
6. Any API error returns `[]` — never throws.
7. Unit tests cover: successful mapping, API error returns `[]`, missing key returns `[]`.

## Tasks / Subtasks

- [ ] Implement WebSearchService (AC: 1–6)
  - [ ] Create `backend/src/agents/sources/web-search.service.ts`
  - [ ] Build 3 queries per arch §6.3b:
    ```typescript
    const queries = [
      `${parsedIdea.sector[0]} ${parsedIdea.stage} investor ${parsedIdea.geography}`,
      `venture capital ${parsedIdea.sub_sector} fund 2024 2025`,
      `angel investor ${parsedIdea.keywords.slice(0, 3).join(' ')}`,
    ];
    ```
  - [ ] Call Tavily API: `POST https://api.tavily.com/search` with `{ api_key, query, search_depth: 'basic', max_results: 10 }`
  - [ ] Run all 3 queries in parallel: `Promise.allSettled(queries.map(q => tavilySearch(q)))`
  - [ ] Map each Tavily result (`title`, `url`, `content`) to `SynthesisedInvestor`:
    - `canonical_name` ← extract from `title` (strip "| Crunchbase", "- LinkedIn" suffixes)
    - `website` ← `url`
    - `sources` ← `['web']`
    - `source_urls` ← `[url]`
    - All other fields ← null
  - [ ] Deduplicate by `website` domain before returning
  - [ ] Guard: if `TAVILY_API_KEY` falsy → warn + return `[]`
- [ ] Write unit tests (AC: 7)
  - [ ] Mock axios for Tavily API calls

## Dev Notes

- **Tavily API**: REST endpoint, `api_key` in request body (not a header). Returns `{ results: [{ title, url, content, score }] }`.
- **Title cleaning**: Investor pages often have titles like `"Sequoia Capital | Venture Capital Firm"` or `"a16z - Andreessen Horowitz"`. Strip everything after `|` or `-` and trim.
- **Domain dedup**: Two results with `sequoiacap.com` and `www.sequoiacap.com` are the same investor. Normalise by stripping `www.` before dedup.
- **Null-safe query building**: Guard against null fields in `parsedIdea` — use `parsedIdea.sector?.[0] ?? ''`, etc. Some ideas may have Claude return null for geography.
- **Max results per query**: Keep at 10 (`max_results: 10`) — 3 queries × 10 results = 30 raw candidates before dedup. Synthesis agent handles further merging.

### References

- [Source: docs/architecture.md#Section 6.3b] — Query patterns, Tavily usage
- [Source: docs/architecture.md#Section 6.2] — Orchestrator calls this in `Promise.allSettled`
- [Source: backend/src/common/types/index.ts] — `SynthesisedInvestor`, `ParsedIdea`
- [Source: docs/architecture.md#Section 9] — `TAVILY_API_KEY` env var

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List
