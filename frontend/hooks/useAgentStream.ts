'use client';
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAppStore, type AgentStage } from '@/store/app.store';
import { track } from '@/lib/posthog';

export function useAgentStream(searchId: string | null) {
  const setAgentProgress = useAppStore((s) => s.setAgentProgress);
  const resetAgentProgress = useAppStore((s) => s.resetAgentProgress);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!searchId) return;
    // Clear any stale stage/progress from a previous search before connecting
    resetAgentProgress();
    const es = new EventSource(`/api/v1/searches/${searchId}/stream`);

    es.addEventListener('agent_update', (e) => {
      const { stage, progress, message } = JSON.parse(e.data);
      setAgentProgress(stage as AgentStage, progress ?? 0, message);
    });

    es.addEventListener('complete', (e) => {
      setAgentProgress('complete', 100);
      es.close();
      try {
        const { result_count } = JSON.parse(e.data) as { result_count?: number };
        track('search_completed', { search_id: searchId, result_count: result_count ?? 0 });
      } catch {
        track('search_completed', { search_id: searchId });
      }
      queryClient.invalidateQueries({ queryKey: ['search', searchId] });
    });

    es.onerror = () => es.close();

    return () => es.close();
  }, [searchId, setAgentProgress, resetAgentProgress, queryClient]);
}
