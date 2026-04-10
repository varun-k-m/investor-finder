export interface SearchSummary {
  id: string;
  raw_input: string;
  status: 'pending' | 'running' | 'complete' | 'failed';
  result_count: number;
  created_at: string;
}
