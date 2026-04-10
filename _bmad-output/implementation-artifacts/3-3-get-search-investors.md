# Story S3-003: GET /searches/:id/investors — Paginated Investor Results

## User Story
As an authenticated founder, I want to GET /searches/:id/investors to retrieve the ranked list of investors found for my search, with pagination.

## Acceptance Criteria

1. `GET /api/v1/searches/:id/investors?page=1&limit=20` returns paginated investor profiles
2. Response shape: `{ data: InvestorProfile[], total: number, page: number, limit: number }`
3. Results ordered by `rank_position ASC` (lowest rank = best fit first)
4. Returns 404 if search does not exist
5. Returns 403 if search belongs to a different user
6. `page` defaults to 1, `limit` defaults to 20, max `limit` = 50
7. Unit tests cover: paginated results, empty list, 404, 403

## Technical Context

**Architecture refs:** §5.3, §7.4

**What already exists:**
- `SearchesController` — add the new endpoint here (keeps search-scoped routes together)
- `InvestorProfile` entity — `backend/src/investors/entities/investor-profile.entity.ts`
- `SearchesModule` — already imports `TypeOrmModule.forFeature([Search])` — add `InvestorProfile` to it
- `SearchesService.findOne()` built in S3-002 (ownership check reuse)

**What to build:**

### `dto/investor-query.dto.ts`
```typescript
import { IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class InvestorQueryDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  page?: number = 1;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(50)
  limit?: number = 20;
}
```

### `SearchesService.findInvestors(searchId, clerkSub, query)`
```typescript
async findInvestors(searchId: string, clerkSub: string, query: InvestorQueryDto) {
  // Ownership check via findOne
  await this.findOne(searchId, clerkSub);

  const { page = 1, limit = 20 } = query;
  const [data, total] = await this.investorRepo.findAndCount({
    where: { search_id: searchId },
    order: { rank_position: 'ASC' },
    skip: (page - 1) * limit,
    take: limit,
  });

  return { data, total, page, limit };
}
```

### `SearchesController` — add endpoint
```typescript
@Get(':id/investors')
async findInvestors(
  @Param('id') id: string,
  @Query() query: InvestorQueryDto,
  @CurrentUser() user: { sub: string },
) {
  return this.searchesService.findInvestors(id, user.sub, query);
}
```

### Module changes
- Add `InvestorProfile` to `TypeOrmModule.forFeature([Search, InvestorProfile])` in `SearchesModule`
- Inject `@InjectRepository(InvestorProfile)` in `SearchesService`

## Tasks

- [ ] Create `dto/investor-query.dto.ts`
- [ ] Add `InvestorProfile` to `SearchesModule` TypeORM feature imports
- [ ] Inject `InvestorProfile` repository in `SearchesService`
- [ ] Add `findInvestors()` to `SearchesService`
- [ ] Add `@Get(':id/investors')` endpoint to `SearchesController`
- [ ] Write unit tests (AC: 7)
- [ ] Run `npm test` — all pass

## File List
- `backend/src/searches/dto/investor-query.dto.ts` (new)
- `backend/src/searches/searches.service.ts` (modified)
- `backend/src/searches/searches.controller.ts` (modified)
- `backend/src/searches/searches.module.ts` (modified)
- `backend/src/searches/searches.service.spec.ts` (modified)

## Dev Agent Record
_To be filled during implementation_
