# Story S3-007: Rate Limiting + Usage Quota Enforcement

## User Story
As the platform operator, I want free-tier users to be limited to 3 searches per month so that the service is sustainable, while pro users have unlimited searches.

## Acceptance Criteria

1. `QuotaGuard` (stub created in S3-001) replaced with real implementation
2. Free-tier users (`plan='free'`) are blocked after 3 searches in the current calendar month — returns HTTP 429 with `{ message: 'Monthly search limit reached. Upgrade to Pro for unlimited searches.' }`
3. Pro/enterprise users pass through unconditionally
4. Guard reads `searches_used` from the `User` row in DB and compares against month rollover by counting `Search` rows with `created_at >= start_of_current_month`
5. After a search is successfully created (S3-001), `users.searches_used` is incremented by 1
6. `UserThrottlerGuard` (already wired as `APP_GUARD`) enforces 30 req/60s per `user_id` — no changes needed here
7. Unit tests cover: free user under limit (pass), free user at limit (429), pro user (pass)

## Technical Context

**Architecture refs:** §12 (Security), §11 (NFR — quota)

**What already exists:**
- `QuotaGuard` stub at `backend/src/common/guards/quota.guard.ts` — always returns `true`
- `UserThrottlerGuard` already wired globally in `AppModule`
- `User` entity — `searches_used: number`, `plan: 'free' | 'pro' | 'enterprise'`
- `Search` entity — `user_id`, `created_at`
- `UsersService.findByClerkId(clerkSub)` — resolves DB user
- `ClerkGuard` attaches `req.user = { sub: string }` before guards run

**What to build:**

### Real `QuotaGuard`
```typescript
@Injectable()
export class QuotaGuard implements CanActivate {
  private readonly FREE_LIMIT = 3;

  constructor(
    private readonly usersService: UsersService,
    @InjectRepository(Search) private readonly searchRepo: Repository<Search>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const clerkSub = request.user?.sub;
    if (!clerkSub) throw new UnauthorizedException();

    const user = await this.usersService.findByClerkId(clerkSub);
    if (!user) throw new UnauthorizedException();

    if (user.plan !== 'free') return true;

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const count = await this.searchRepo.count({
      where: {
        user_id: user.id,
        created_at: MoreThanOrEqual(startOfMonth),
      },
    });

    if (count >= this.FREE_LIMIT) {
      throw new HttpException(
        { message: 'Monthly search limit reached. Upgrade to Pro for unlimited searches.' },
        429,
      );
    }

    return true;
  }
}
```

### Increment `searches_used` after successful create
In `SearchesService.create()` (from S3-001), after the BullMQ job is enqueued:
```typescript
await this.usersRepository.increment({ id: user.id }, 'searches_used', 1);
```
(Use TypeORM `Repository.increment()` — atomic, no race condition)

### Module wiring
`QuotaGuard` uses `UsersService` and `Search` repository — both must be available in whatever module provides it. Since it's used in `SearchesController`, wire it as a provider in `SearchesModule`:
- `SearchesModule` already imports `UsersModule` (from S3-001) and `TypeOrmModule.forFeature([Search])`
- Add `QuotaGuard` to `SearchesModule.providers`

## Tasks

- [ ] Replace `QuotaGuard` stub with real implementation (monthly count, plan check, 429)
- [ ] Add `QuotaGuard` to `SearchesModule` providers
- [ ] Add `searches_used` increment to `SearchesService.create()` after job enqueue
- [ ] Write unit tests (AC: 7)
- [ ] Run full `npm test` — all 70+ tests pass

## File List
- `backend/src/common/guards/quota.guard.ts` (modified — real implementation)
- `backend/src/searches/searches.module.ts` (modified — add QuotaGuard provider)
- `backend/src/searches/searches.service.ts` (modified — increment searches_used)
- `backend/src/common/guards/quota.guard.spec.ts` (new)
- `backend/src/searches/searches.service.spec.ts` (modified)

## Dev Agent Record
_To be filled during implementation_
