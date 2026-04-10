# Story S4-006: PitchModal — Generate + Edit Pitch Draft

## User Story
As a founder, I want to generate a personalised pitch draft for a specific investor and edit it before sending so that I can tailor my outreach efficiently.

## Acceptance Criteria

1. `PitchModal` is a dialog/modal that opens when "Generate Pitch" is clicked on `InvestorCard`
2. On open, immediately calls `POST /api/v1/investors/{id}/pitch` via React Query mutation
3. While generating: shows a loading spinner with text "Generating your pitch..."
4. On success: displays the generated `content` string in an editable `<textarea>`
5. "Copy" button copies the textarea content to clipboard; button label changes to "Copied!" for 2 seconds
6. "Regenerate" button re-runs the mutation and replaces textarea content with new result
7. "Close" button / clicking backdrop closes the modal
8. On API error: shows an error message ("Failed to generate pitch. Please try again.")
9. `InvestorCard` replaces the `PitchModal stub` from S4-003 with the real `<PitchModal>` component
10. `npm run typecheck` and `npm run lint` pass with zero errors

## Technical Context

**Architecture refs:** §5.3, §8.2

**What already exists:**
- `frontend/lib/api.ts` — `apiFetch` from S4-001
- `frontend/components/ui/button.tsx` — shadcn Button
- `frontend/components/ui/textarea.tsx` — shadcn Textarea (from S4-001)
- `frontend/components/investors/InvestorCard.tsx` — `showPitch` state + stub

**Pitch endpoint:** `POST /api/v1/investors/{id}/pitch` — returns `{ id, user_id, investor_id, content, version, created_at }`. Use `content` field.

**Error case:** Backend throws `BadRequestException('No completed search found')` if user has no completed search — surface this as a user-friendly message.

**What to build:**

### Install shadcn/ui dialog component
Run: `npx shadcn@latest add dialog`

### `frontend/components/investors/PitchModal.tsx`
- `'use client'` component
- Props: `{ investorId: string; investorName: string; open: boolean; onClose: () => void }`
- Local state: `content: string`, `copied: boolean`
- `useMutation` for the POST — runs on modal open (`useEffect(() => { if (open) mutate(); }, [open])`)
- Render inside shadcn `Dialog` / `DialogContent`:
  - Header: "Pitch for {investorName}"
  - Loading state: `Loader2` spinner + "Generating your pitch..."
  - Success state: `<Textarea value={content} onChange={...} rows={12} />`
  - Footer buttons: Copy, Regenerate, Close
- Copy: `navigator.clipboard.writeText(content).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); })`
- Regenerate: call `mutate()` again; reset `content` to new result
- Error: `<p className="text-destructive text-sm">{error.message}</p>`

### Update `frontend/components/investors/InvestorCard.tsx`
- Import `PitchModal`
- Replace stub `<div>PitchModal stub</div>` with `<PitchModal investorId={investor.id} investorName={investor.canonical_name} open={showPitch} onClose={() => setShowPitch(false)} />`

## Tasks

- [x] Install shadcn/ui dialog: `npx shadcn@latest add dialog`
- [x] Create `frontend/components/investors/PitchModal.tsx` — modal with generation flow (AC: 1–8)
- [x] Update `frontend/components/investors/InvestorCard.tsx` — replace stub with real `PitchModal` (AC: 9)
- [x] Run `npm run typecheck && npm run lint` — zero errors

## File List
- `frontend/components/ui/dialog.tsx` (new — shadcn)
- `frontend/components/investors/PitchModal.tsx` (new)
- `frontend/components/investors/InvestorCard.tsx` (modified)

## Dev Agent Record

### Completion Notes
- Installed `@radix-ui/react-dialog` manually (shadcn CLI requires TTY); wrote `dialog.tsx` with same output as CLI
- `PitchModal`: triggers mutation on `open` via `useEffect`; editable textarea on success; Copy (2s flash) + Regenerate + Close buttons
- `InvestorCard`: replaced stub with real `<PitchModal>` with controlled open/close
- typecheck + lint: ✅ zero errors
