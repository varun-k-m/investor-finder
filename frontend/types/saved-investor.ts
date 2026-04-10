import type { InvestorProfile } from './investor';

export interface SavedInvestor {
  id: string;
  user_id: string;
  investor_id: string;
  status: 'saved' | 'contacted' | 'replied' | 'passed';
  notes: string | null;
  created_at: string;
  investor: InvestorProfile;
}

export type InvestorStatus = SavedInvestor['status'];

export const INVESTOR_STATUSES: InvestorStatus[] = ['saved', 'contacted', 'replied', 'passed'];
