/**
 * Shared TypeScript interfaces for InvestorMatch.
 * Derived from architecture.md — Sections 4 (DB schema) and 6 (agent I/O).
 * These are the canonical types shared across backend services.
 */

// ─── Agent Pipeline Types ────────────────────────────────────────────────────

/** Structured output from Idea Parser agent (Agent 1). [Source: arch §6.1] */
export interface ParsedIdea {
  title: string | null;
  sector: string[];
  sub_sector: string | null;
  stage: 'idea' | 'mvp' | 'revenue' | 'growth' | null;
  geography: string | null;
  target_market: 'B2B' | 'B2C' | 'B2B2C' | null;
  funding_ask: {
    amount: number;
    currency_mentioned: string;
  } | null;
  keywords: string[];
  one_liner: string | null;
}

/** SSE agent pipeline stages. [Source: arch §5.5] */
export type AgentStage =
  | 'parsing'
  | 'searching'
  | 'synthesis'
  | 'ranking'
  | 'complete'
  | 'failed';

/** Canonical investor object produced by Synthesis agent. [Source: arch §6.4] */
export interface SynthesisedInvestor {
  canonical_name: string;
  fund_name: string | null;
  website: string | null;
  sectors: string[];
  stages: string[];
  geo_focus: string[];
  check_min: number | null;
  check_max: number | null;
  contact_email: string | null;
  linkedin_url: string | null;
  sources: string[];
  source_urls: string[];
  conflicts: string[];
  /** Raw page text from web/news sources — used by SynthesisService; stripped before persistence */
  raw_text?: string;
}

/** Scored investor from Ranking agent. [Source: arch §6.5] */
export interface RankedInvestor extends SynthesisedInvestor {
  sector_fit: number;
  stage_fit: number;
  budget_fit: number;
  geo_fit: number;
  overall: number;
  fit_reasoning: string;
  rank_position: number;
}

// ─── Database Entity Types ────────────────────────────────────────────────────

/** User entity shape. [Source: arch §4.1 users table] */
export interface IUser {
  id: string;
  clerk_id: string;
  email: string;
  name: string | null;
  plan: 'free' | 'pro' | 'enterprise';
  searches_used: number;
  created_at: Date;
}

/** Search entity shape. [Source: arch §4.1 searches table] */
export interface ISearch {
  id: string;
  user_id: string;
  raw_input: string;
  parsed_idea: ParsedIdea | null;
  status: 'pending' | 'running' | 'complete' | 'failed';
  result_count: number;
  created_at: Date;
  completed_at: Date | null;
}

/** Investor profile entity shape. [Source: arch §4.1 investor_profiles table] */
export interface IInvestorProfile {
  id: string;
  search_id: string;
  canonical_name: string;
  fund_name: string | null;
  website: string | null;
  sectors: string[];
  stages: string[];
  geo_focus: string[];
  check_min: number | null;
  check_max: number | null;
  contact_email: string | null;
  linkedin_url: string | null;
  twitter_url: string | null;
  sources: string[];
  source_urls: string[];
  raw_data: Record<string, unknown> | null;
  fit_score: number | null;
  sector_fit: number | null;
  stage_fit: number | null;
  budget_fit: number | null;
  geo_fit: number | null;
  fit_reasoning: string | null;
  rank_position: number | null;
  created_at: Date;
}

/** Saved investor entity shape. [Source: arch §4.1 saved_investors table] */
export interface ISavedInvestor {
  id: string;
  user_id: string;
  investor_id: string;
  status: 'saved' | 'contacted' | 'replied' | 'passed';
  notes: string | null;
  created_at: Date;
}

/** Pitch draft entity shape. [Source: arch §4.1 pitch_drafts table] */
export interface IPitchDraft {
  id: string;
  user_id: string;
  investor_id: string;
  content: string;
  version: number;
  created_at: Date;
}

// ─── SSE Event Types ─────────────────────────────────────────────────────────

/** SSE agent_update event payload. [Source: arch §5.5] */
export interface AgentUpdateEvent {
  stage: AgentStage;
  message: string;
  progress?: number;
}

/** SSE complete event payload. [Source: arch §5.5] */
export interface AgentCompleteEvent {
  search_id: string;
  result_count: number;
}
