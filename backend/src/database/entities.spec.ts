import 'reflect-metadata';
import { getMetadataArgsStorage } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Search } from '../searches/entities/search.entity';
import { InvestorProfile } from '../investors/entities/investor-profile.entity';
import { SavedInvestor } from '../investors/entities/saved-investor.entity';
import { PitchDraft } from '../investors/entities/pitch-draft.entity';

// Trigger decorator registration
void User;
void Search;
void InvestorProfile;
void SavedInvestor;
void PitchDraft;

function getTableName(target: Function): string | undefined {
  const storage = getMetadataArgsStorage();
  return storage.tables.find((t) => t.target === target)?.name;
}

function getColumns(target: Function): string[] {
  return getMetadataArgsStorage()
    .columns.filter((c) => c.target === target)
    .map((c) => c.propertyName as string);
}

function getRelations(target: Function): string[] {
  return getMetadataArgsStorage()
    .relations.filter((r) => r.target === target)
    .map((r) => r.propertyName as string);
}

describe('User entity', () => {
  it('maps to users table', () => {
    expect(getTableName(User)).toBe('users');
  });

  it('has all required columns', () => {
    const cols = getColumns(User);
    expect(cols).toEqual(
      expect.arrayContaining(['id', 'clerk_id', 'email', 'name', 'plan', 'searches_used', 'created_at']),
    );
  });
});

describe('Search entity', () => {
  it('maps to searches table', () => {
    expect(getTableName(Search)).toBe('searches');
  });

  it('has all required columns', () => {
    const cols = getColumns(Search);
    expect(cols).toEqual(
      expect.arrayContaining(['id', 'user_id', 'raw_input', 'parsed_idea', 'status', 'result_count', 'created_at', 'completed_at']),
    );
  });

  it('has ManyToOne relation to User', () => {
    expect(getRelations(Search)).toContain('user');
  });
});

describe('InvestorProfile entity', () => {
  it('maps to investor_profiles table', () => {
    expect(getTableName(InvestorProfile)).toBe('investor_profiles');
  });

  it('has all required columns', () => {
    const cols = getColumns(InvestorProfile);
    expect(cols).toEqual(
      expect.arrayContaining([
        'id', 'search_id', 'canonical_name', 'fund_name', 'website',
        'sectors', 'stages', 'geo_focus',
        'check_min', 'check_max',
        'contact_email', 'linkedin_url', 'twitter_url',
        'sources', 'source_urls', 'raw_data',
        'fit_score', 'sector_fit', 'stage_fit', 'budget_fit', 'geo_fit',
        'fit_reasoning', 'rank_position', 'created_at',
      ]),
    );
  });

  it('has ManyToOne relation to Search', () => {
    expect(getRelations(InvestorProfile)).toContain('search');
  });
});

describe('SavedInvestor entity', () => {
  it('maps to saved_investors table', () => {
    expect(getTableName(SavedInvestor)).toBe('saved_investors');
  });

  it('has all required columns', () => {
    const cols = getColumns(SavedInvestor);
    expect(cols).toEqual(
      expect.arrayContaining(['id', 'user_id', 'investor_id', 'status', 'notes', 'created_at']),
    );
  });

  it('has ManyToOne relations to User and InvestorProfile', () => {
    const rels = getRelations(SavedInvestor);
    expect(rels).toContain('user');
    expect(rels).toContain('investor');
  });
});

describe('PitchDraft entity', () => {
  it('maps to pitch_drafts table', () => {
    expect(getTableName(PitchDraft)).toBe('pitch_drafts');
  });

  it('has all required columns', () => {
    const cols = getColumns(PitchDraft);
    expect(cols).toEqual(
      expect.arrayContaining(['id', 'user_id', 'investor_id', 'content', 'version', 'created_at']),
    );
  });

  it('has ManyToOne relations to User and InvestorProfile', () => {
    const rels = getRelations(PitchDraft);
    expect(rels).toContain('user');
    expect(rels).toContain('investor');
  });
});
