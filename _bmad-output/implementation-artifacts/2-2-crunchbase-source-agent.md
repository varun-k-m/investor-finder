# Story 2.2: Implement Crunchbase Source Agent (Agent 3a)

Status: ready-for-dev

## Story

As a developer,
I want a `CrunchbaseService` that queries the Crunchbase Basic API for investors matching the parsed idea,
so that the Discovery Orchestrator has a real data source for investor discovery.

## Acceptance Criteria

1. `CrunchbaseService` is injectable and has method `async search(parsedIdea: ParsedIdea): Promise<SynthesisedInvestor[]>`.
2. The service calls `POST https://api.crunchbase.com/api/v4/searches/organizations` with `user_key` query param set from `CRUNCHBASE_API_KEY`.
3. The query body matches the structure in `docs/architecture.md#Section 6.3` — filters for `facet_ids: investor` and `investor_type: venture_capital | angel`, limit 25.
4. `sectors` and `keywords` from `parsedIdea` are used to build additional predicate filters (field `short_description` contains keyword).
5. The response is mapped to `SynthesisedInvestor[]` — only fields available from Crunchbase are populated; others are `null`.
6. If the API returns a non-200 response, log the error and return `[]` (never throw — the orchestrator uses `Promise.allSettled`).
7. If `CRUNCHBASE_API_KEY` is not set, log a warning and return `[]`.
8. Unit tests cover: successful mapping, API error returns `[]`, missing key returns `[]`.

## Tasks / Subtasks

- [ ] Implement CrunchbaseService (AC: 1–7)
  - [ ] Create `backend/src/agents/sources/crunchbase.service.ts`
  - [ ] Inject `ConfigService` and `HttpService` (from `@nestjs/axios`) or use `axios` directly
  - [ ] Build query body per arch §6.3 — add keyword predicates from `parsedIdea.keywords` and `parsedIdea.sector`
  - [ ] Map Crunchbase org response fields to `SynthesisedInvestor`:
    - `canonical_name` ← `properties.name`
    - `website` ← `properties.website_url`
    - `fund_name` ← null (not in Basic API)
    - `sectors` ← `parsedIdea.sector` (Crunchbase doesn't return sectors on Basic)
    - `stages` ← `properties.investor_stage` array if present
    - `sources` ← `['crunchbase']`
    - `source_urls` ← `['https://crunchbase.com/organization/' + properties.identifier.permalink]`
    - All other fields ← null
  - [ ] Return `[]` on any error (log with `Logger`)
- [ ] Write unit tests (AC: 8)
  - [ ] Mock `axios` — test success mapping, 4xx response, missing API key

## Dev Notes

- **Crunchbase Basic API** is free tier — rate-limited to 200 requests/minute. No auth header needed; `user_key` is a query param.
- **`SynthesisedInvestor` type** is defined in `backend/src/common/types/index.ts`. Use it directly.
- **axios vs HttpService**: Use `axios` directly (already installed in S2-001) — `@nestjs/axios` wraps in Observables which adds complexity for simple REST calls.
- **Keyword predicates**: Add one predicate per keyword (up to 3 to avoid overfiltering):
  ```typescript
  parsedIdea.keywords.slice(0, 3).map(kw => ({
    type: 'predicate',
    field_id: 'short_description',
    operator_id: 'contains',
    values: [kw],
  }))
  ```
- **Never throw**: Wrap the entire method body in try/catch. Log the error. Return `[]`. The orchestrator (`Promise.allSettled`) handles partial failures gracefully.
- **`CRUNCHBASE_API_KEY` guard**: Check at the top of the method — if falsy, `this.logger.warn('CRUNCHBASE_API_KEY not set')` and return `[]`.

### References

- [Source: docs/architecture.md#Section 6.3] — Crunchbase query structure
- [Source: docs/architecture.md#Section 6.2] — How the orchestrator calls this service
- [Source: backend/src/common/types/index.ts] — `SynthesisedInvestor`, `ParsedIdea` types
- [Source: docs/architecture.md#Section 9] — `CRUNCHBASE_API_KEY` env var

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List
