export interface InvestorProfile {
  id: string;
  search_id: string;
  canonical_name: string;
  fund_name: string | null;
  website: string | null;
  sectors: string[] | null;
  stages: string[] | null;
  geo_focus: string[] | null;
  check_min: number | null;
  check_max: number | null;
  contact_email: string | null;
  linkedin_url: string | null;
  twitter_url: string | null;
  fit_score: number | null;
  sector_fit: number | null;
  stage_fit: number | null;
  budget_fit: number | null;
  geo_fit: number | null;
  fit_reasoning: string | null;
  rank_position: number | null;
}
