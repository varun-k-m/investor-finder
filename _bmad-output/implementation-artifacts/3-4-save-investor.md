# Story S3-004: POST /investors/:id/save — Save Investor

## User Story
As an authenticated founder, I want to save an investor to my personal list so I can track my outreach.

## Acceptance Criteria

1. `POST /api/v1/investors/:id/save` creates a `SavedInvestor` record for the authenticated user
2. Returns the `SavedInvestor` record with HTTP 201
3. If already saved by this user, returns the existing record (idempotent — no duplicate)
4. Returns 404 if `InvestorProfile` with given `:id` does not exist
5. Returns 401 if unauthenticated
6. Unit tests cover: first save (201), duplicate save (returns existing), 404

## Technical Context

**Architecture refs:** §5.3

**What already exists:**
- `InvestorsModule` — `backend/src/investors/investors.module.ts` — currently just imports TypeORM entities
- `SavedInvestor` entity — `backend/src/investors/entities/saved-investor.entity.ts` — columns: `id, user_id, investor_id, status, notes, created_at`
- `InvestorProfile` entity
- `CurrentUser` decorator — returns `{ sub: string }`
- `UsersService.findByClerkId()` — in `UsersModule`

**What to build:**

### `InvestorsController` — new file
```typescript
@Controller('investors')
export class InvestorsController {
  constructor(private readonly investorsService: InvestorsService) {}

  @Post(':id/save')
  @HttpCode(201)
  async save(@Param('id') investorId: string, @CurrentUser() user: { sub: string }) {
    return this.investorsService.saveInvestor(investorId, user.sub);
  }
}
```

### `InvestorsService.saveInvestor(investorId, clerkSub)`
```typescript
async saveInvestor(investorId: string, clerkSub: string): Promise<SavedInvestor> {
  const user = await this.usersService.findByClerkId(clerkSub);
  if (!user) throw new UnauthorizedException();

  const investor = await this.investorRepo.findOne({ where: { id: investorId } });
  if (!investor) throw new NotFoundException('Investor not found');

  const existing = await this.savedRepo.findOne({
    where: { user_id: user.id, investor_id: investorId }
  });
  if (existing) return existing;

  return this.savedRepo.save(
    this.savedRepo.create({ user_id: user.id, investor_id: investorId, status: 'saved' })
  );
}
```

### Module updates
- Add `InvestorsController` and `InvestorsService` to `InvestorsModule`
- Import `UsersModule` in `InvestorsModule`
- Export `InvestorsService` from `InvestorsModule`

## Tasks

- [ ] Create `InvestorsService` with `saveInvestor()`
- [ ] Create `InvestorsController` with `@Post(':id/save')`
- [ ] Update `InvestorsModule` — add controller, service, import `UsersModule`
- [ ] Register `InvestorsModule` in `AppModule` (check if already there — it is)
- [ ] Write unit tests (AC: 6)
- [ ] Run `npm test` — all pass

## File List
- `backend/src/investors/investors.service.ts` (new)
- `backend/src/investors/investors.controller.ts` (new)
- `backend/src/investors/investors.module.ts` (modified)
- `backend/src/investors/investors.service.spec.ts` (new)

## Dev Agent Record
_To be filled during implementation_
