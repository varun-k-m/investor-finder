# Story 8.2: AgentProgressBar activity log announces updates to screen readers

Status: done

## Story

As a founder with a screen reader waiting for search results,
I want the agent activity log updates to be announced as they appear,
so that I can follow search progress without watching the screen.

## Acceptance Criteria

1. **Given** an investor search is running **When** the AgentProgressBar activity log receives a new progress line **Then** the new line is announced by screen readers via `aria-live="polite"` on the log container.

2. **Given** the activity log container renders **When** a developer inspects the DOM **Then** the container element has `aria-live="polite"` and `aria-atomic="false"` attributes set.

3. **Given** multiple log lines arrive in quick succession **When** screen reader announces them **Then** each line is announced individually (`aria-atomic="false"` ensures individual item announcement).

4. **Given** the search completes **When** the completion event fires **Then** a final "Search complete — N investors found" message is appended to the live region.

## Tasks / Subtasks

- [x] Update `frontend/components/search/AgentProgressBar.tsx` — activity log container (AC: 1, 2, 3)
  - [x] Find the activity log outer `<motion.div>` that wraps `AnimatePresence` + log messages (lines ~360–387)
  - [x] Add `aria-live="polite"` and `aria-atomic="false"` to that container element

- [x] Update `frontend/hooks/useAgentStream.ts` OR the store — completion message (AC: 4)
  - [x] Check where `agentLog` is populated — likely in `frontend/store/app.store.ts` via `setAgentProgress`
  - [x] On `complete` event in `useAgentStream.ts`: append `"Search complete — N investors found"` to `agentLog` in the Zustand store
  - [x] The count `N` comes from the search query result — pass it if available, otherwise use a static message: `"Search complete — results ready"`

- [x] Run `npm run typecheck && npm run lint` — zero errors

## Dev Notes

### Primary change — activity log container
In `frontend/components/search/AgentProgressBar.tsx`, the activity log section (approximately lines 358–388):

```tsx
<AnimatePresence>
  {allMessages.length > 0 && (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      className="rounded-lg border border-border/40 bg-muted/30 px-4 py-3 space-y-2"
    >
```

Add `aria-live="polite"` and `aria-atomic="false"` to the `motion.div`:

```tsx
<motion.div
  initial={{ opacity: 0, height: 0 }}
  animate={{ opacity: 1, height: 'auto' }}
  aria-live="polite"
  aria-atomic="false"
  className="rounded-lg border border-border/40 bg-muted/30 px-4 py-3 space-y-2"
>
```

That's the minimal, correct change. The `aria-live` region is already present in the DOM — messages are rendered inside it dynamically, so screen readers will announce each new entry as it appears.

### Completion message — where to add it
Check `frontend/hooks/useAgentStream.ts`. On the `complete` SSE event handler:
```ts
es.addEventListener('complete', () => {
  setAgentProgress('complete', 100);
  es.close();
  queryClient.invalidateQueries({ queryKey: ['search', searchId] });
});
```

Update to also push a completion message into the log. Look at what `setAgentProgress` / `agentLog` update mechanism exists in `frontend/store/app.store.ts`. If the store has an `addAgentLog` or `setAgentMessage` action, use it:

```ts
es.addEventListener('complete', (e) => {
  // Try to get count from event data if the backend sends it
  let countMsg = 'results ready';
  try {
    const data = JSON.parse(e.data ?? '{}');
    if (data.count != null) countMsg = `${data.count} investors found`;
  } catch { /* ignore */ }

  // Append to log so aria-live region announces it
  addAgentLog?.(`Search complete — ${countMsg}`);
  setAgentProgress('complete', 100);
  es.close();
  queryClient.invalidateQueries({ queryKey: ['search', searchId] });
});
```

If there's no `addAgentLog` action in the store, use `setAgentMessage` or whichever action populates `agentLog`. Check `app.store.ts` first before modifying the store interface.

### Why `aria-atomic="false"` (not `true`)
- `aria-atomic="true"` would re-read the entire log container every time a new message appears — very noisy for users
- `aria-atomic="false"` announces only the newly added DOM node — correct behavior for an activity feed
- Combined with `aria-live="polite"`, announcements wait for the user to finish their current reading before interrupting

### Why `aria-live="polite"` (not `assertive`)
- `assertive` interrupts the user immediately — appropriate only for errors or critical alerts
- `polite` waits for a natural pause — correct for progress updates that are informational

### No visual change
This story adds only ARIA attributes. Zero visual change to the component. The animation, layout, and styling are untouched.

### Project Structure Notes
- Primary change: one attribute addition to `AgentProgressBar.tsx` activity log container
- Secondary change: one line in `useAgentStream.ts` for completion message
- No new components, no new dependencies

### References
- AgentProgressBar source: `frontend/components/search/AgentProgressBar.tsx`
- useAgentStream hook: `frontend/hooks/useAgentStream.ts`
- App store: `frontend/store/app.store.ts`
- Epics spec: `_bmad-output/planning-artifacts/epics.md` → Story 2.2, FR5

## Dev Agent Record

### Agent Model Used
claude-sonnet-4-6

### Debug Log References
None.

### Completion Notes List
- Added `aria-live="polite"` and `aria-atomic="false"` to activity log `motion.div` in AgentProgressBar
- No store changes needed — completion message passed via existing `setAgentProgress('complete', 100, msg)` which flows into `agentMessage` → `allMessages` → live region
- `result_count` parsed from SSE event data; fallback to "results ready" if unavailable

### File List
- `frontend/components/search/AgentProgressBar.tsx`
- `frontend/hooks/useAgentStream.ts`
