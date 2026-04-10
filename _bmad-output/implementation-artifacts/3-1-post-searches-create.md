# Story S3-001: POST /searches — Create Search + Trigger Pipeline

## User Story
As an authenticated founder, I want to submit my startup idea via POST /searches so that the agent pipeline is triggered and I receive a search ID to poll for results.

## Acceptance Criteria

1. `POST /api/v1/searches` accepts `{ raw_input: string }` — minimum 20 characters
2. Returns HTTP 202 with `{ id: string, status: 'pending' }` within 300ms
3. Creates a `Search` row in DB with `status='pending'`, `raw_input`, `user_id` (from DB lookup of Clerk sub)
4. Calls `IdeaParserService.parse(raw_input)` synchronously; stores result in `parsed_idea` column and updates status to `'running'`
5. Enqueues a BullMQ job on the `'search'` queue with `{ searchId, parsedIdea }` payload
6. Route is protected — unauthenticated requests get 401
7. `QuotaGuard` is applied — free-tier users (plan='free') are blocked at 3 searches/month (HTTP 429). Implemented in S3-007 but the `@UseGuards(QuotaGuard)` decoration must be present here.
8. Unit tests cover: happy path, validation rejection (<20 chars), DB + queue interactions mocked

## Technical Context

**Architecture refs:** §5.2, §6.1, §7.4

**What already exists:**
- `SearchesController` — has only `@Sse(':id/stream')` today; add `@Post()` to it
- `SearchesService` — has only `getProgressStream()`; add `create()` to it
- `SearchesModule` — already imports `AgentsModule` (so `IdeaParserService` is available) and `BullModule.registerQueue({ name: 'search' })`
- `IdeaParserService` — exported from `AgentsModule`, `parse(raw_input: string): Promise<ParsedIdea>`
- `CurrentUser` decorator — `backend/src/auth/current-user.decorator.ts` — returns Clerk JWT payload `{ sub: string }`
- `UsersService.findByClerkId(clerkId)` — looks up full `User` record; `UsersModule` must be imported in `SearchesModule`
- `ClerkGuard` registered globally as `APP_GUARD` — no need to re-apply on controller
- `Search` entity — `backend/src/searches/entities/search.entity.ts`

**What to build:**

### `backend/src/searches/dto/create-search.dto.ts`
```typescript
import { IsString, MinLength } from 'class-validator';
export class CreateSearchDto {
  @IsString()
  @MinLength(20)
  raw_input: string;
}
```

### `SearchesService.create(dto, clerkSub)`
```typescript
async create(dto: CreateSearchDto, clerkSub: string): Promise<{ id: string; status: string }> {
  const user = await this.usersService.findByClerkId(clerkSub);
  if (!user) throw new UnauthorizedException();

  const search = await this.searchRepo.save(
    this.searchRepo.create({ user_id: user.id, raw_input: dto.raw_input, status: 'pending' })
  );

  const parsedIdea = await this.ideaParser.parse(dto.raw_input);
  await this.searchRepo.update({ id: search.id }, { parsed_idea: parsedIdea as any, status: 'running' });

  await this.searchQueue.add({ searchId: search.id, parsedIdea });

  return { id: search.id, status: 'pending' };
}
```

### `SearchesController` — add POST endpoint
```typescript
@Post()
@HttpCode(202)
@UseGuards(QuotaGuard)
async create(@Body() dto: CreateSearchDto, @CurrentUser() user: { sub: string }) {
  return this.searchesService.create(dto, user.sub);
}
```

### Module changes needed
- Inject `@InjectQueue('search')` in `SearchesService` constructor
- Import `UsersModule` in `SearchesModule` so `UsersService` is available
- Import `QuotaGuard` (from `common/guards`) — stub it as a passthrough guard initially (implemented fully in S3-007)

### `QuotaGuard` stub (full implementation in S3-007)
Create `backend/src/common/guards/quota.guard.ts` as a passthrough that always returns `true`. S3-007 replaces it with real quota logic.

## Tasks

- [ ] Create `dto/create-search.dto.ts` with `@IsString @MinLength(20) raw_input`
- [ ] Extend `SearchesService` — inject `IdeaParserService`, `@InjectQueue('search')`, `UsersService`; add `create()` method
- [ ] Add `@Post()` `@HttpCode(202)` `@UseGuards(QuotaGuard)` endpoint to `SearchesController`
- [ ] Create `QuotaGuard` stub in `common/guards/quota.guard.ts` (passthrough)
- [ ] Update `SearchesModule`: import `UsersModule`
- [ ] Write unit tests (AC: 8)
- [ ] Run `npm test` — all tests must pass

## File List
- `backend/src/searches/dto/create-search.dto.ts` (new)
- `backend/src/searches/searches.service.ts` (modified)
- `backend/src/searches/searches.controller.ts` (modified)
- `backend/src/searches/searches.module.ts` (modified)
- `backend/src/common/guards/quota.guard.ts` (new — stub)
- `backend/src/searches/searches.service.spec.ts` (modified — add create() tests)

## Dev Agent Record
_To be filled during implementation_
