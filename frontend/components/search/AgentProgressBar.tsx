'use client';

import { Loader2 } from 'lucide-react';
import { useAppStore, type AgentStage } from '@/store/app.store';

const STAGE_LABELS: Record<AgentStage, string> = {
  parsing: 'Analysing your idea...',
  searching: 'Searching for investors...',
  synthesis: 'Synthesising profiles...',
  complete: 'Done!',
};

export function AgentProgressBar() {
  const agentStage = useAppStore((s) => s.agentStage);
  const agentProgress = useAppStore((s) => s.agentProgress);

  if (agentStage === 'complete') {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="text-green-600 font-medium">✓ Done!</span>
      </div>
    );
  }

  const label = agentStage ? STAGE_LABELS[agentStage] : 'Starting...';
  const progress = agentProgress ?? 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>{label}</span>
        <span className="ml-auto">{Math.round(progress)}%</span>
      </div>
      <div className="w-full bg-muted rounded-full h-2">
        <div
          className="h-2 rounded-full bg-primary transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
