# Story 2.8: SSE Streaming Endpoint for Agent Progress

Status: ready-for-dev

## Story

As a developer,
I want a Server-Sent Events endpoint at `GET /searches/:id/stream` that emits real-time agent progress updates,
so that the frontend can show a live progress bar as the pipeline runs.

## Acceptance Criteria

1. `GET /api/v1/searches/:id/stream` returns an SSE stream (Content-Type: `text/event-stream`).
2. The endpoint uses NestJS `@Sse()` decorator and returns `Observable<MessageEvent>`.
3. An `AgentProgressStore` (in-memory, singleton) holds a `Subject<AgentUpdateEvent>` per `searchId`.
4. `DiscoveryService` calls `AgentProgressStore.emit(searchId, stage, progress)` at key pipeline milestones.
5. The SSE stream emits `agent_update` events with `{ stage, progress }` payload and a `complete` event when the search finishes.
6. The stream auto-closes 60 seconds after a `complete` event (or after the search `status` is `complete`/`failed`).
7. The stream sends a keepalive comment (`: keepalive`) every 15 seconds to prevent proxy timeout.
8. If no Subject exists for the given `searchId`, the stream checks the DB — if status is already `complete`/`failed`, it emits a `complete` event immediately and closes.
9. Unit tests cover: emit → stream receives event, already-complete search → immediate close.

## Tasks / Subtasks

- [ ] Create AgentProgressStore (AC: 3, 4)
  - [ ] Create `backend/src/searches/agent-progress.store.ts`
  - [ ] `@Injectable({ scope: Scope.DEFAULT })` — singleton
  - [ ] Internal: `Map<string, Subject<AgentUpdateEvent>>`
  - [ ] `getOrCreate(searchId: string): Subject<AgentUpdateEvent>` — returns existing or creates new
  - [ ] `emit(searchId: string, stage: AgentStage, progress: number): void`
  - [ ] `complete(searchId: string): void` — emits a complete event then calls `subject.complete()`
  - [ ] `cleanup(searchId: string): void` — deletes subject from map (call after complete)
- [ ] Create SSE stream endpoint (AC: 1, 2, 5, 6, 7, 8)
  - [ ] Add `@Sse(':id/stream')` method to `SearchesController` (create `searches.controller.ts` if it doesn't exist yet, or add to the stub)
  - [ ] In `SearchesService`, add `getProgressStream(searchId: string): Observable<MessageEvent>`:
    ```typescript
    getProgressStream(searchId: string): Observable<MessageEvent> {
      return new Observable(subscriber => {
        const subject = this.progressStore.getOrCreate(searchId);
        const sub = subject.subscribe({
          next: (event) => subscriber.next({ data: JSON.stringify(event), type: event.type }),
          complete: () => subscriber.complete(),
          error: (e) => subscriber.error(e),
        });
        // Keepalive
        const keepalive = setInterval(() => subscriber.next({ data: '', type: 'keepalive' }), 15000);
        // Timeout
        const timeout = setTimeout(() => { subscriber.complete(); }, 60000);
        return () => { sub.unsubscribe(); clearInterval(keepalive); clearTimeout(timeout); };
      });
    }
    ```
  - [ ] Handle already-complete case: query DB for search status before subscribing — if `complete`/`failed`, emit final event and close immediately
- [ ] Update DiscoveryService (AC: 4, 5)
  - [ ] Inject `AgentProgressStore`
  - [ ] Emit milestones:
    - After search starts: `emit(searchId, 'parsing', 10)`
    - After all sources return: `emit(searchId, 'synthesis', 60)`
    - After synthesis: `emit(searchId, 'ranking', 80)`
    - After ranking: `emit(searchId, 'saving', 95)`
    - After save: `complete(searchId)`
  - [ ] On failure: `emit(searchId, 'failed', 0)` then `complete(searchId)`
- [ ] Update SearchesModule (AC: 3)
  - [ ] Add `AgentProgressStore` to providers
- [ ] Write unit tests (AC: 9)
  - [ ] Test `AgentProgressStore`: emit → subject receives event
  - [ ] Test `getProgressStream`: emits MessageEvent on store emit

## Dev Notes

- **`AgentStage` type**: Already defined in `backend/src/common/types/index.ts` — `'parsing' | 'discovery' | 'synthesis' | 'ranking' | 'saving' | 'complete' | 'failed'`.
- **`AgentUpdateEvent` type**: Also in `common/types/index.ts` — `{ type: 'agent_update' | 'complete'; stage: AgentStage; progress: number }`.
- **NestJS SSE**: Use `@Sse()` from `@nestjs/common` + `Observable<MessageEvent>` from `rxjs`. `MessageEvent` is the built-in browser type — in NestJS it's `{ data: string; type?: string; id?: string }`.
- **rxjs `Subject`**: Import from `rxjs`. The `Subject` is both an Observable and Observer — `subject.next(value)` pushes to all subscribers.
- **Memory leak prevention**: Always call `cleanup(searchId)` after `complete()` in `AgentProgressStore` — otherwise completed searches accumulate in the Map. Use a 2-minute cleanup timeout after completion.
- **CORS + SSE**: The frontend EventSource will use the same Clerk JWT via `?token=` query param or cookies. SSE doesn't support Authorization headers from EventSource natively — the `SearchesController` should validate the token from the query param for this route. (Or skip auth for now and add in S3-007.)
- **Do NOT use `@nestjs/event-emitter`**: The architecture uses rxjs `Subject` directly — it's simpler and keeps the stream composable with rxjs operators.

### References

- [Source: docs/architecture.md#Section 5.3] — SSE event format: `agent_update`, `complete`
- [Source: docs/architecture.md#Section 7.4] — `@Sse(':id/stream')` in `SearchesController`
- [Source: docs/architecture.md#Section 8.4] — Frontend SSE consumption pattern
- [Source: backend/src/common/types/index.ts] — `AgentStage`, `AgentUpdateEvent`, `AgentCompleteEvent`

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List
