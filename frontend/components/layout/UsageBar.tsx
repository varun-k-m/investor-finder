interface UsageBarProps {
  used: number;
  limit: number;
}

export function UsageBar({ used, limit }: UsageBarProps) {
  const pct = Math.min((used / limit) * 100, 100);
  return (
    <div className="text-xs text-muted-foreground space-y-1">
      <div className="flex justify-between">
        <span>Searches used</span>
        <span className="font-medium">{used} / {limit}</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-500 rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
