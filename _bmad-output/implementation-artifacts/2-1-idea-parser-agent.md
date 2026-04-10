# Story 2.1: Implement Idea Parser Agent (Agent 1)

Status: ready-for-dev

## Story

As a developer,
I want an `IdeaParserService` that calls Claude Sonnet to extract structured metadata from a founder's free-text idea,
so that downstream agents have a typed `ParsedIdea` object to work with.

## Acceptance Criteria

1. `@anthropic-ai/sdk` and `axios` are installed in `backend/`.
2. `AgentsModule` registers an `ANTHROPIC_CLIENT` provider using a factory that reads `ANTHROPIC_API_KEY` from `ConfigService`.
3. `IdeaParserService` is injectable and accepts raw text input, returning a `ParsedIdea` object matching the type in `common/types/index.ts`.
4. The Claude call uses model `claude-sonnet-4-6`, max_tokens 800, and the exact system prompt from `docs/architecture.md#Section 6.1`.
5. The response is parsed as JSON — if parsing fails, an error is thrown with message `"IdeaParser: invalid JSON from Claude"`.
6. `AgentsModule` exports `IdeaParserService`.
7. Unit tests cover: successful parse, JSON parse failure, Claude API error.

## Tasks / Subtasks

- [ ] Install dependencies (AC: 1)
  - [ ] `npm install --cache /tmp/npm-cache @anthropic-ai/sdk axios` in `backend/`
- [ ] Wire AgentsModule (AC: 2, 6)
  - [ ] Create `backend/src/agents/agents.module.ts`:
    - `ANTHROPIC_CLIENT` factory: `new Anthropic({ apiKey: config.get('ANTHROPIC_API_KEY') })`
    - Providers: `IdeaParserService`, `DiscoveryService` (stub), all source services (stubs), `SynthesisService` (stub), `RankingService` (stub), `PitchService` (stub)
    - Exports: `IdeaParserService`, `DiscoveryService`, `PitchService`
    - Imports: `ConfigModule`
- [ ] Implement IdeaParserService (AC: 3, 4, 5)
  - [ ] Create `backend/src/agents/idea-parser.service.ts`
  - [ ] `@Inject('ANTHROPIC_CLIENT')` to receive the Anthropic client
  - [ ] `async parse(rawInput: string): Promise<ParsedIdea>` method
  - [ ] System prompt verbatim from arch §6.1
  - [ ] Call `anthropic.messages.create({ model: 'claude-sonnet-4-6', max_tokens: 800, system: PROMPT, messages: [{ role: 'user', content: rawInput }] })`
  - [ ] Parse `response.content[0].text` as JSON, throw on failure
- [ ] Add stub services (unblocks S2-002 through S2-007)
  - [ ] `backend/src/agents/discovery.service.ts` — stub with `async run(searchId, parsedIdea)` logs and returns
  - [ ] `backend/src/agents/sources/crunchbase.service.ts` — stub
  - [ ] `backend/src/agents/sources/web-search.service.ts` — stub
  - [ ] `backend/src/agents/sources/news-signal.service.ts` — stub
  - [ ] `backend/src/agents/synthesis.service.ts` — stub
  - [ ] `backend/src/agents/ranking.service.ts` — stub
  - [ ] `backend/src/agents/pitch.service.ts` — stub
- [ ] Write unit tests (AC: 7)
  - [ ] `backend/src/agents/idea-parser.service.spec.ts`
  - [ ] Mock `ANTHROPIC_CLIENT` — inject via `{ provide: 'ANTHROPIC_CLIENT', useValue: mockClient }`

## Dev Notes

- **`ParsedIdea` type is already defined** in `backend/src/common/types/index.ts`. Do not redefine.
- **ANTHROPIC_CLIENT factory**: Use `ConfigService` not `process.env` directly — keeps it testable.
  ```typescript
  {
    provide: 'ANTHROPIC_CLIENT',
    inject: [ConfigService],
    useFactory: (config: ConfigService) =>
      new Anthropic({ apiKey: config.get<string>('ANTHROPIC_API_KEY') }),
  }
  ```
- **System prompt as constant**: Define `IDEA_PARSER_SYSTEM_PROMPT` as a module-level `const` string in the service file. This keeps it readable and testable.
- **JSON response stripping**: Claude may occasionally wrap JSON in markdown fences despite instructions. Strip ` ```json ` and ` ``` ` before parsing as a safety measure.
- **Null fields**: The prompt says `"If any field cannot be determined, set it to null"`. The `ParsedIdea` type allows nullable fields — do not throw if some fields are null.
- **Stub services**: All other agent services should be `@Injectable()` classes with stub methods that log and return empty arrays or `null`. This lets `AgentsModule` compile cleanly while individual stories fill in the real logic.

### Project Structure Notes

```
backend/src/agents/
├── agents.module.ts              ← Wire ANTHROPIC_CLIENT + all services
├── idea-parser.service.ts        ← NEW — Agent 1
├── idea-parser.service.spec.ts   ← NEW
├── discovery.service.ts          ← STUB — filled in S2-007
├── synthesis.service.ts          ← STUB — filled in S2-005
├── ranking.service.ts            ← STUB — filled in S2-006
├── pitch.service.ts              ← STUB
└── sources/
    ├── crunchbase.service.ts     ← STUB — filled in S2-002
    ├── web-search.service.ts     ← STUB — filled in S2-003
    └── news-signal.service.ts    ← STUB — filled in S2-004
```

### References

- [Source: docs/architecture.md#Section 6.1] — Exact system prompt, model, max_tokens
- [Source: docs/architecture.md#Section 7.5] — AgentsModule DI pattern, ANTHROPIC_CLIENT factory
- [Source: docs/architecture.md#Section 7.6] — `npm install @anthropic-ai/sdk axios`
- [Source: docs/architecture.md#Section 9] — `ANTHROPIC_API_KEY` env var
- [Source: backend/src/common/types/index.ts] — `ParsedIdea` type definition

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List
