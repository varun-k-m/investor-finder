'use client';

import type { InvestorStatus } from '@/types/saved-investor';

const STATUS_STYLES: Record<InvestorStatus, string> = {
  saved: 'bg-blue-100 text-blue-800',
  contacted: 'bg-purple-100 text-purple-800',
  replied: 'bg-green-100 text-green-800',
  passed: 'bg-gray-100 text-gray-600',
};

const STATUS_LABELS: Record<InvestorStatus, string> = {
  saved: 'Saved',
  contacted: 'Contacted',
  replied: 'Replied',
  passed: 'Passed',
};

export function InvestorStatusPill({ status }: { status: InvestorStatus }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
