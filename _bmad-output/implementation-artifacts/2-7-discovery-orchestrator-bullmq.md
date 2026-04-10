# Story 2.7: Wire Discovery Orchestrator with BullMQ

Status: ready-for-dev

## Story

As a developer,
I want `DiscoveryService` to fan out to all source agents, run synthesis and ranking, and persist results to the database,
and `SearchProcessor` to invoke it from the BullMQ job handler,
so that a search job submitted to the queue runs the full agent pipeline end-to-end.

## Acceptance Criteria

1. `DiscoveryService.run(searchId: string, parsedIdea: ParsedIdea)` fans out to all four source agents in parallel via `Promise.allSettled`.
2. Successful results are collected; failed results are logged but do not abort the pipeline.
3. `SynthesisService.synthesise()` is called with all collected raw records.
4. `RankingService.rank()` is called with the synthesised results.
5. Ranked investors are persisted to `investor_profiles` table via `InvestorProfile` TypeORM entity — one row per investor.
6. The `searches` row is updated: `status: 'complete'`, `result_count: ranked.length`, `completed_at: new Date()`.
7. On any unrecoverable error, the `searches` row is updated to `status: 'failed'`.
8. `SearchProcessor.handleSearch()` extracts `searchId` and `parsedIdea` from `job.data` and calls `DiscoveryService.run()`.
9. `SearchesModule` imports `AgentsModule` so `DiscoveryService` is available in `SearchProcessor`.
10. Unit tests cover: full pipeline run, source failure is non-fatal, DB persist called with correct data.

## Tasks / Subtasks

- [ ] Implement DiscoveryService (AC: 1–7)
  - [ ] Create `backend/src/agents/discovery.service.ts`
  - [ ] Inject: `CrunchbaseService`, `WebSearchService`, `NewsSignalService`, `SynthesisService`, `RankingService`
  - [ ] Inject TypeORM repositories: `@InjectRepository(InvestorProfile)` and `@InjectRepository(Search)`
  - [ ] `run()` implementation:
    ```typescript
    async run(searchId: string, parsedIdea: ParsedIdea): Promise<void> {
      try {
        await this.searchRepo.update(searchId, { status: 'running' });
        const [cb, web, news] = await Promise.allSettled([
          this.crunchbase.search(parsedIdea),
          this.webSearch.search(parsedIdea),
          this.newsSignal.search(parsedIdea),
        ]);
        const allRaw = collectSuccessful([cb, web, news]);
        const synthesised = await this.synthesis.synthesise(allRaw, parsedIdea);
        const ranked = await this.ranking.rank(synthesised, parsedIdea);
        await this.investorRepo.save(ranked.map(r => ({ ...r, search_id: searchId })));
        await this.searchRepo.update(searchId, {
          status: 'complete',
          result_count: ranked.length,
          completed_at: new Date(),
        });
      } catch (err) {
        this.logger.error(`Discovery failed for search ${searchId}`, err);
        await this.searchRepo.update(searchId, { status: 'failed' });
      }
    }
    ```
  - [ ] Helper: `collectSuccessful(results: PromiseSettledResult<SynthesisedInvestor[]>[])` — filters fulfilled, flattens, logs rejected
- [ ] Update SearchProcessor (AC: 8)
  - [ ] Replace stub in `search.processor.ts` — inject `DiscoveryService`, call `discoveryService.run(job.data.searchId, job.data.parsedIdea)`
  - [ ] Job data type: `Job<{ searchId: string; parsedIdea: ParsedIdea }>`
- [ ] Update SearchesModule (AC: 9)
  - [ ] Add `AgentsModule` to `SearchesModule` imports
  - [ ] Add `TypeOrmModule.forFeature([Search, InvestorProfile])` if not already present
- [ ] Update AgentsModule (AC: 5)
  - [ ] Add `TypeOrmModule.forFeature([InvestorProfile, Search])` to `AgentsModule` imports
  - [ ] Export `DiscoveryService`
- [ ] Write unit tests (AC: 10)
  - [ ] Mock all injected services
  - [ ] Test: all sources resolve → synthesise + rank + save called
  - [ ] Test: one source rejects → pipeline continues with remaining results
  - [ ] Test: synthesis/ranking throws → search marked `failed`

## Dev Notes

- **`collectSuccessful` helper**: Use `PromiseSettledResult` type from TypeScript:
  ```typescript
  function collectSuccessful(results: PromiseSettledResult<SynthesisedInvestor[]>[]): SynthesisedInvestor[] {
    return results.flatMap(r => r.status === 'fulfilled' ? r.value : []);
  }
  ```
- **Saving investors**: `this.investorRepo.save(array)` — TypeORM will INSERT all in one call (batched). Each investor needs `search_id` set to link to the search row.
- **`searches` repo**: Use `@InjectRepository(Search)` — call `this.searchRepo.update({ id: searchId }, { status: 'running' })` at the start so the SSE stream (S2-008) can show progress.
- **DiscoveryService repository injection**: `DiscoveryService` lives in `AgentsModule` but needs TypeORM repos. Add `TypeOrmModule.forFeature([InvestorProfile, Search])` to `AgentsModule` imports — this is the correct pattern in NestJS.
- **Job data contract**: The BullMQ job queued in `SearchesService.create()` (S3-001) will pass `{ searchId, parsedIdea }`. The `SearchProcessor` just forwards these to `DiscoveryService.run()`.
- **Module circular dependency risk**: `SearchesModule` imports `AgentsModule`; `AgentsModule` should NOT import `SearchesModule`. Keep the dependency one-directional.

### References

- [Source: docs/architecture.md#Section 6.2] — Full orchestration pseudocode
- [Source: docs/architecture.md#Section 7.4] — SearchesModule wiring, SearchProcessor pattern
- [Source: docs/architecture.md#Section 7.5] — AgentsModule DI pattern
- [Source: backend/src/searches/search.processor.ts] — Existing stub to replace
- [Source: backend/src/common/types/index.ts] — `ParsedIdea`, `SynthesisedInvestor`, `RankedInvestor`

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List
