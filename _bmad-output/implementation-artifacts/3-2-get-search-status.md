# Story S3-002: GET /searches/:id — Search Status + Results

## User Story
As an authenticated founder, I want to GET /searches/:id to check the status of my search and retrieve results when complete.

## Acceptance Criteria

1. `GET /api/v1/searches/:id` returns the search record for the authenticated user
2. Response shape: `{ id, status, result_count, raw_input, parsed_idea, created_at, completed_at }`
3. Returns 404 if search does not exist
4. Returns 403 if search belongs to a different user
5. Returns 401 if unauthenticated (handled globally by ClerkGuard)
6. Unit tests cover: found+owned, 404, 403

## Technical Context

**Architecture refs:** §5.2, §7.4

**What already exists:**
- `SearchesController`, `SearchesService` — extend both
- `Search` entity with all needed columns
- `CurrentUser` decorator returns `{ sub: string }` (Clerk JWT payload)
- `UsersService.findByClerkId(clerkSub)` to resolve DB user

**What to build:**

### `SearchesService.findOne(id, clerkSub)`
```typescript
async findOne(id: string, clerkSub: string): Promise<Search> {
  const user = await this.usersService.findByClerkId(clerkSub);
  if (!user) throw new UnauthorizedException();

  const search = await this.searchRepo.findOne({ where: { id } });
  if (!search) throw new NotFoundException('Search not found');
  if (search.user_id !== user.id) throw new ForbiddenException();

  return search;
}
```

### `SearchesController` — add GET endpoint
```typescript
@Get(':id')
async findOne(@Param('id') id: string, @CurrentUser() user: { sub: string }) {
  return this.searchesService.findOne(id, user.sub);
}
```

Note: `@Sse(':id/stream')` already uses `':id'` prefix — NestJS distinguishes by method, no conflict.

## Tasks

- [ ] Add `findOne()` to `SearchesService`
- [ ] Add `@Get(':id')` endpoint to `SearchesController`
- [ ] Write unit tests (AC: 6)
- [ ] Run `npm test` — all pass

## File List
- `backend/src/searches/searches.service.ts` (modified)
- `backend/src/searches/searches.controller.ts` (modified)
- `backend/src/searches/searches.service.spec.ts` (modified)

## Dev Agent Record
_To be filled during implementation_
