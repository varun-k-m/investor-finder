import {
  ParsedIdea,
  AgentStage,
  IUser,
  ISearch,
  IInvestorProfile,
  ISavedInvestor,
  IPitchDraft,
  SynthesisedInvestor,
  RankedInvestor,
  AgentUpdateEvent,
  AgentCompleteEvent,
} from './index';

describe('Shared Types', () => {
  it('ParsedIdea has all required fields', () => {
    const idea: ParsedIdea = {
      title: 'InvestorMatch',
      sector: ['fintech'],
      sub_sector: 'investor discovery',
      stage: 'mvp',
      geography: 'US',
      target_market: 'B2B',
      funding_ask: { amount: 500000, currency_mentioned: 'USD' },
      keywords: ['investor', 'fintech'],
      one_liner: 'Find investors fast',
    };
    expect(idea.sector).toContain('fintech');
  });

  it('AgentStage covers all pipeline stages', () => {
    const stages: AgentStage[] = [
      'parsing',
      'searching',
      'synthesis',
      'ranking',
      'complete',
      'failed',
    ];
    expect(stages).toHaveLength(6);
  });

  it('IUser has plan defaulting to free', () => {
    const user: IUser = {
      id: 'uuid',
      clerk_id: 'clerk_123',
      email: 'user@test.com',
      name: null,
      plan: 'free',
      searches_used: 0,
      created_at: new Date(),
    };
    expect(user.plan).toBe('free');
  });

  it('ISearch status covers all pipeline states', () => {
    const validStatuses: ISearch['status'][] = [
      'pending',
      'running',
      'complete',
      'failed',
    ];
    expect(validStatuses).toHaveLength(4);
  });

  it('IInvestorProfile has all fit score fields', () => {
    const profile: Partial<IInvestorProfile> = {
      fit_score: 85.5,
      sector_fit: 90.0,
      stage_fit: 80.0,
      budget_fit: 75.0,
      geo_fit: 100.0,
    };
    expect(profile.fit_score).toBeGreaterThan(0);
  });

  it('ISavedInvestor status covers all CRM states', () => {
    const statuses: ISavedInvestor['status'][] = [
      'saved',
      'contacted',
      'replied',
      'passed',
    ];
    expect(statuses).toHaveLength(4);
  });

  it('RankedInvestor extends SynthesisedInvestor with scores', () => {
    const ranked: RankedInvestor = {
      canonical_name: 'Sequoia Capital',
      fund_name: 'Sequoia',
      website: 'https://sequoiacap.com',
      sectors: ['fintech'],
      stages: ['seed'],
      geo_focus: ['US'],
      check_min: 500000,
      check_max: 2000000,
      contact_email: null,
      linkedin_url: null,
      sources: ['crunchbase'],
      source_urls: ['https://crunchbase.com/...'],
      conflicts: [],
      sector_fit: 92,
      stage_fit: 85,
      budget_fit: 78,
      geo_fit: 100,
      overall: 89.2,
      fit_reasoning: 'Strong match across all dimensions.',
    };
    expect(ranked.overall).toBeGreaterThan(0);
  });

  it('AgentUpdateEvent has stage and message', () => {
    const event: AgentUpdateEvent = {
      stage: 'searching',
      message: 'Searching Crunchbase...',
      progress: 20,
    };
    expect(event.progress).toBe(20);
  });

  it('AgentCompleteEvent has search_id and result_count', () => {
    const event: AgentCompleteEvent = {
      search_id: 'abc123',
      result_count: 18,
    };
    expect(event.result_count).toBe(18);
  });

  it('IPitchDraft has version field', () => {
    const draft: IPitchDraft = {
      id: 'uuid',
      user_id: 'user-uuid',
      investor_id: 'investor-uuid',
      content: 'Dear Sequoia...',
      version: 1,
      created_at: new Date(),
    };
    expect(draft.version).toBe(1);
  });
});
