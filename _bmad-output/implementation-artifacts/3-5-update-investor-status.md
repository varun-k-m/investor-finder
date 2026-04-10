# Story S3-005: PUT /investors/:id/status — Update CRM Status

## User Story
As an authenticated founder, I want to update the status of a saved investor (contacted, replied, passed) to track my fundraising pipeline.

## Acceptance Criteria

1. `PUT /api/v1/investors/:id/status` updates `saved_investors.status` for the authenticated user
2. `UpdateStatusDto` — `status` must be one of: `'saved' | 'contacted' | 'replied' | 'passed'`
3. Returns the updated `SavedInvestor` record
4. Returns 404 if the `SavedInvestor` row does not exist for this user + investor combo
5. Returns 400 if `status` is invalid
6. Returns 401 if unauthenticated
7. Unit tests cover: valid update, 404 (not saved by this user), invalid status (400)

## Technical Context

**Architecture refs:** §5.3

**What already exists after S3-004:**
- `InvestorsController`, `InvestorsService`, `InvestorsModule` with `UsersModule` imported
- `SavedInvestor` entity with `status: 'saved' | 'contacted' | 'replied' | 'passed'`

**What to build:**

### `dto/update-status.dto.ts`
```typescript
import { IsIn } from 'class-validator';

export class UpdateStatusDto {
  @IsIn(['saved', 'contacted', 'replied', 'passed'])
  status: 'saved' | 'contacted' | 'replied' | 'passed';
}
```

### `InvestorsService.updateStatus(investorId, clerkSub, dto)`
```typescript
async updateStatus(investorId: string, clerkSub: string, dto: UpdateStatusDto): Promise<SavedInvestor> {
  const user = await this.usersService.findByClerkId(clerkSub);
  if (!user) throw new UnauthorizedException();

  const saved = await this.savedRepo.findOne({
    where: { user_id: user.id, investor_id: investorId }
  });
  if (!saved) throw new NotFoundException('Investor not saved by this user');

  saved.status = dto.status;
  return this.savedRepo.save(saved);
}
```

### `InvestorsController` — add PUT endpoint
```typescript
@Put(':id/status')
async updateStatus(
  @Param('id') investorId: string,
  @Body() dto: UpdateStatusDto,
  @CurrentUser() user: { sub: string },
) {
  return this.investorsService.updateStatus(investorId, user.sub, dto);
}
```

## Tasks

- [ ] Create `dto/update-status.dto.ts`
- [ ] Add `updateStatus()` to `InvestorsService`
- [ ] Add `@Put(':id/status')` to `InvestorsController`
- [ ] Write unit tests (AC: 7)
- [ ] Run `npm test` — all pass

## File List
- `backend/src/investors/dto/update-status.dto.ts` (new)
- `backend/src/investors/investors.service.ts` (modified)
- `backend/src/investors/investors.controller.ts` (modified)
- `backend/src/investors/investors.service.spec.ts` (modified)

## Dev Agent Record
_To be filled during implementation_
