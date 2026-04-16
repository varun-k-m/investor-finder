'use client';
import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAppStore, type AgentStage } from '@/store/app.store';
import { track } from '@/lib/posthog';

export function useAgentStream(searchId: string | null) {
  const setAgentProgress = useAppStore((s) => s.setAgentProgress);
  const resetAgentProgress = useAppStore((s) => s.resetAgentProgress);
  const queryClient = useQueryClient();
  // Track whether any real SSE event arrived for the current search.
  const hasReceivedEvent = useRef(false);

  useEffect(() => {
    if (!searchId) return;
    hasReceivedEvent.current = false;
    // Clear any stale stage/progress from a previous search before connecting
    resetAgentProgress();
    const es = new EventSource(`/api/v1/searches/${searchId}/stream`);

    es.addEventListener('agent_update', (e) => {
      hasReceivedEvent.current = true;
      const { stage, progress, message } = JSON.parse(e.data);
      setAgentProgress(stage as AgentStage, progress ?? 0, message);
    });

    es.addEventListener('complete', (e) => {
      hasReceivedEvent.current = true;
      let resultCount: number | undefined;
      try {
        const { result_count } = JSON.parse(e.data) as { result_count?: number };
        resultCount = result_count;
        track('search_completed', { search_id: searchId, result_count: result_count ?? 0 });
      } catch {
        track('search_completed', { search_id: searchId });
      }
      const completionMsg = resultCount != null
        ? `Search complete — ${resultCount} investors found`
        : 'Search complete — results ready';
      setAgentProgress('complete', 100, completionMsg);
      es.close();
      queryClient.invalidateQueries({ queryKey: ['search', searchId] });
    });

    es.onerror = () => es.close();

    // Fallback: if no SSE events arrive within 4s (e.g. multi-instance deployment
    // where in-memory progress store is not shared), synthesize the initial
    // searching stage so the progress bar animates instead of staying on
    // "Initializing search…" for the full duration.
    const fallbackTimer = setTimeout(() => {
      if (!hasReceivedEvent.current) {
        setAgentProgress('searching', 10, 'Searching investor networks…');
      }
    }, 4_000);

    return () => {
      es.close();
      clearTimeout(fallbackTimer);
    };
  }, [searchId, setAgentProgress, resetAgentProgress, queryClient]);
}
