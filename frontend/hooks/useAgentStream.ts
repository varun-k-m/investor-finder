'use client';
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAppStore, type AgentStage } from '@/store/app.store';

export function useAgentStream(searchId: string | null) {
  const setAgentProgress = useAppStore((s) => s.setAgentProgress);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!searchId) return;
    const es = new EventSource(`/api/v1/searches/${searchId}/stream`);

    es.addEventListener('agent_update', (e) => {
      const { stage, progress } = JSON.parse(e.data);
      setAgentProgress(stage as AgentStage, progress ?? 0);
    });

    es.addEventListener('complete', () => {
      setAgentProgress('complete', 100);
      es.close();
      queryClient.invalidateQueries({ queryKey: ['search', searchId] });
    });

    es.onerror = () => es.close();

    return () => es.close();
  }, [searchId, setAgentProgress, queryClient]);
}
