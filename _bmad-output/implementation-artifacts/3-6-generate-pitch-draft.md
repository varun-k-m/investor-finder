# Story S3-006: POST /investors/:id/pitch — Generate Pitch Draft

## User Story
As an authenticated founder, I want to generate a personalised pitch draft for a specific investor so I can reach out with a tailored message.

## Acceptance Criteria

1. `POST /api/v1/investors/:id/pitch` calls `PitchService.generate()` and returns the draft text
2. Response shape: `{ id: string, content: string, version: number, created_at: Date }`
3. Each call creates a new `PitchDraft` row (version increments per investor per user)
4. Returns 404 if `InvestorProfile` with given `:id` does not exist
5. Returns 401 if unauthenticated
6. `PitchService` calls Claude `claude-sonnet-4-6` with a prompt combining the investor's profile and the user's most recent completed search's `parsed_idea`
7. If no completed search exists for the user, throws `BadRequestException('No completed search found')`
8. Unit tests cover: successful generation, 404 investor, no completed search

## Technical Context

**Architecture refs:** §5.3, §7.5

**What already exists:**
- `PitchService` stub at `backend/src/agents/pitch.service.ts` — `generate(_investorId, _userId)` returns `''`
- `PitchDraft` entity — `backend/src/investors/entities/pitch-draft.entity.ts` — columns: `id, user_id, investor_id, content, version, created_at`
- `InvestorProfile` entity
- `AgentsModule` exports `PitchService`
- `InvestorsController` + `InvestorsService` from S3-004/S3-005

**What to build:**

### Replace `PitchService.generate()` with real implementation
```typescript
@Injectable()
export class PitchService {
  constructor(
    @Inject('ANTHROPIC_CLIENT') private readonly anthropic: Anthropic,
    @InjectRepository(Search) private readonly searchRepo: Repository<Search>,
  ) {}

  async generate(investor: InvestorProfile, userId: string): Promise<string> {
    const latestSearch = await this.searchRepo.findOne({
      where: { user_id: userId, status: 'complete' },
      order: { completed_at: 'DESC' },
    });
    if (!latestSearch || !latestSearch.parsed_idea) {
      throw new BadRequestException('No completed search found');
    }

    const prompt = `You are a startup fundraising coach. Write a concise, personalised cold outreach email from a founder to this investor.

Investor profile:
- Name: ${investor.canonical_name}
- Sectors: ${investor.sectors?.join(', ')}
- Stages: ${investor.stages?.join(', ')}
- Fit reasoning: ${investor.fit_reasoning}

Startup idea:
${JSON.stringify(latestSearch.parsed_idea, null, 2)}

Write a 150-200 word email. Be specific about why this investor is a great fit. No generic platitudes. Sign off as "The Founder".`;

    const response = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 600,
      messages: [{ role: 'user', content: prompt }],
    });

    return (response.content[0] as { text: string }).text;
  }
}
```

Note: `AgentsModule` must import `TypeOrmModule.forFeature([Search])` to give `PitchService` access.

### `InvestorsService.generatePitch(investorId, clerkSub)`
```typescript
async generatePitch(investorId: string, clerkSub: string): Promise<PitchDraft> {
  const user = await this.usersService.findByClerkId(clerkSub);
  if (!user) throw new UnauthorizedException();

  const investor = await this.investorRepo.findOne({ where: { id: investorId } });
  if (!investor) throw new NotFoundException('Investor not found');

  const content = await this.pitchService.generate(investor, user.id);

  // Increment version
  const lastDraft = await this.pitchDraftRepo.findOne({
    where: { user_id: user.id, investor_id: investorId },
    order: { version: 'DESC' },
  });
  const version = (lastDraft?.version ?? 0) + 1;

  return this.pitchDraftRepo.save(
    this.pitchDraftRepo.create({ user_id: user.id, investor_id: investorId, content, version })
  );
}
```

### `InvestorsController` — add endpoint
```typescript
@Post(':id/pitch')
@HttpCode(201)
async generatePitch(
  @Param('id') investorId: string,
  @CurrentUser() user: { sub: string },
) {
  return this.investorsService.generatePitch(investorId, user.sub);
}
```

### Module updates
- `InvestorsModule` — inject `PitchDraft` repo, import `AgentsModule`
- `AgentsModule` — add `TypeOrmModule.forFeature([Search])` import so `PitchService` can access `searchRepo`

## Tasks

- [ ] Replace `PitchService.generate()` stub with real Claude implementation
- [ ] Update `AgentsModule` — add `TypeOrmModule.forFeature([Search])`
- [ ] Add `pitchDraftRepo` injection to `InvestorsService`; add `generatePitch()` method
- [ ] Add `@Post(':id/pitch')` to `InvestorsController`
- [ ] Update `InvestorsModule` — import `AgentsModule`, add `PitchDraft` to TypeORM features
- [ ] Write unit tests (AC: 8)
- [ ] Run `npm test` — all pass

## File List
- `backend/src/agents/pitch.service.ts` (modified — real implementation)
- `backend/src/agents/agents.module.ts` (modified — add Search TypeORM feature)
- `backend/src/investors/investors.service.ts` (modified)
- `backend/src/investors/investors.controller.ts` (modified)
- `backend/src/investors/investors.module.ts` (modified)
- `backend/src/agents/pitch.service.spec.ts` (new)
- `backend/src/investors/investors.service.spec.ts` (modified)

## Dev Agent Record
_To be filled during implementation_
