'use client';

export function FitScoreBadge({ score }: { score: number | null }) {
  if (score === null) return null;
  const rounded = Math.round(score);
  const cls =
    score >= 80
      ? 'bg-green-100 text-green-800'
      : score >= 60
        ? 'bg-yellow-100 text-yellow-800'
        : 'bg-red-100 text-red-800';
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cls}`}
    >
      {rounded}% fit
    </span>
  );
}
