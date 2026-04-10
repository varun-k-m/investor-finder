# Story S4-002: AgentProgressBar — SSE-Connected Live Updates

## User Story
As a founder waiting for results, I want a real-time progress bar that reflects the agent pipeline stages so that I know the search is running and how far along it is.

## Acceptance Criteria

1. `useAgentStream(searchId)` hook opens an `EventSource` to `/api/v1/searches/{searchId}/stream`
2. On `agent_update` events: parse `{ stage, progress }` and call `setAgentProgress(stage, progress)` in Zustand
3. On `complete` event: close `EventSource`, invalidate React Query key `['search', searchId]`
4. Hook cleans up EventSource on unmount
5. `AgentProgressBar` reads `agentStage` and `agentProgress` from Zustand and renders:
   - A labelled progress bar (0–100%)
   - Current stage label (e.g., "Searching for investors...")
   - Spinner animation while stage is not `complete`
6. Component is shown on `app/(app)/search/[id]/page.tsx` while search status is `running` or `pending`
7. When `agentStage === 'complete'`, shows a "Done" state and hides progress bar
8. `npm run typecheck` and `npm run lint` pass with zero errors

## Technical Context

**Architecture refs:** §8.3, §8.4, §5.5

**What already exists:**
- `frontend/hooks/` — empty directory (`.gitkeep`)
- `frontend/store/app.store.ts` — created in S4-001 (`setAgentProgress`, `agentStage`, `agentProgress`)
- `frontend/components/search/` — `IdeaForm.tsx` added in S4-001
- `frontend/app/(app)/search/[id]/page.tsx` — stub
- SSE stream endpoint: `GET /api/v1/searches/:id/stream` — `@Public()`, no auth required
- Next.js rewrite `/api/v1/*` → backend added in S4-001

**SSE event shape from backend:**
```
event: agent_update
data: {"type":"agent_update","stage":"searching","progress":20}

event: complete
data: {"type":"complete","stage":"complete","progress":100}
```
Note: backend emits events with `type` field; listen for event type `agent_update` and `complete`.

**What to build:**

### `frontend/hooks/useAgentStream.ts`
```typescript
'use client';
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAppStore, AgentStage } from '@/store/app.store';

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
```

### `frontend/components/search/AgentProgressBar.tsx`
- `'use client'` component
- Read `agentStage` + `agentProgress` from `useAppStore`
- Stage label map: `{ parsing: 'Analysing your idea...', searching: 'Searching for investors...', synthesis: 'Synthesising profiles...', complete: 'Done!' }`
- Render a `<progress>` or styled div bar with `agentProgress` as width %
- Show spinner (Lucide `Loader2` with `animate-spin`) when not complete
- Install shadcn `progress` component if preferred, or use a simple Tailwind div

### `frontend/app/(app)/search/[id]/page.tsx`
- `'use client'` page
- `useQuery` from React Query: `GET /api/v1/searches/{id}` with key `['search', id]`
  - `refetchInterval: (query) => query.state.data?.status === 'complete' ? false : 2000`
- Call `useAgentStream(id)` — activates SSE connection
- While `status === 'pending' || status === 'running'`: render `<AgentProgressBar />`
- When `status === 'complete'`: render `<InvestorGrid searchId={id} />` (stub `<div>Results here</div>` until S4-004 implements InvestorGrid)
- Use `useAuth().getToken()` + `apiFetch` for the search query

### shadcn/ui components to install
Run: `npx shadcn@latest add progress` (optional — can use plain Tailwind div instead)

## Tasks

- [x] Create `frontend/hooks/useAgentStream.ts` — EventSource hook (AC: 1–4)
- [x] Create `frontend/components/search/AgentProgressBar.tsx` — progress display (AC: 5–7)
- [x] Update `frontend/app/(app)/search/[id]/page.tsx` — integrate hook + progress bar + stub results (AC: 6)
- [x] Run `npm run typecheck && npm run lint` — zero errors

## File List
- `frontend/hooks/useAgentStream.ts` (new)
- `frontend/components/search/AgentProgressBar.tsx` (new)
- `frontend/app/(app)/search/[id]/page.tsx` (modified)

## Dev Agent Record

### Completion Notes
- `useAgentStream`: EventSource on `/api/v1/searches/${searchId}/stream`; listens for `agent_update` + `complete` events; cleans up on unmount
- `AgentProgressBar`: reads from Zustand; Lucide `Loader2 animate-spin` while running; hides spinner and shows "✓ Done!" when `agentStage === 'complete'`
- `search/[id]/page.tsx`: React Query poll every 2s until complete/failed; `useAgentStream` only active while running; stub div for InvestorGrid (S4-004)
- typecheck + lint: ✅ zero errors
