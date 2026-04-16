# Story 9.3: Color contrast audit and token fixes

Status: ready-for-dev

## Story

As a founder using InvestorMatch in any lighting condition,
I want all text to meet WCAG AA contrast requirements,
so that the interface is readable regardless of vision ability.

## Acceptance Criteria

1. **Given** the audit runs against light mode **When** `--muted-foreground` is tested against `--background` **Then** contrast ratio is measured and documented; if below 4.5:1, the HSL value in `globals.css` is adjusted until it passes.

2. **Given** the audit runs against Badge component text (`text-xs`, 12px) **When** badge foreground is tested against badge background **Then** contrast ratio meets 4.5:1.

3. **Given** the audit runs against dark mode **When** the same tokens are tested **Then** all tokens pass 4.5:1 or corrected values are applied to the `.dark` block.

4. **Given** the audit is complete **When** results are documented **Then** a comment in `globals.css` above each audited token records the contrast ratio and pass/fail status.

## Tasks / Subtasks

- [ ] Audit `--muted-foreground` on `--background` — light mode (AC: 1)
  - [ ] Current values: `--muted-foreground: 215.4 16.3% 46.9%` on `--background: 0 0% 100%` (white)
  - [ ] Calculate or measure contrast ratio (see Dev Notes for pre-calculated result)
  - [ ] If failing, adjust `--muted-foreground` lightness downward until 4.5:1 is reached
  - [ ] Add comment above token with result

- [ ] Audit Badge `text-xs` — light mode (AC: 2)
  - [ ] `secondary` badge: `--secondary-foreground` on `--secondary` background
  - [ ] `outline` badge: `--foreground` on `--background` (outline has transparent bg)
  - [ ] Document result; fix any failing token

- [ ] Audit dark mode equivalents (AC: 3)
  - [ ] `--muted-foreground` dark: `215 20.2% 65.1%` on `--background` dark: `222.2 84% 4.9%`
  - [ ] Badge tokens in dark mode
  - [ ] Fix any failing `.dark` block values

- [ ] Add pass/fail comments to `frontend/app/globals.css` (AC: 4)

- [ ] Run `npm run typecheck && npm run lint` — zero errors (CSS change only, no TS impact)

## Dev Notes

### File to modify
`frontend/app/globals.css` only.

### Pre-calculated contrast ratios

**Light mode — `--muted-foreground` on `--background`:**
- `--muted-foreground: 215.4 16.3% 46.9%` → approximately rgb(100, 116, 139)
- `--background: 0 0% 100%` → white, luminance = 1.0
- Muted-foreground luminance ≈ 0.173
- Contrast ratio: (1.0 + 0.05) / (0.173 + 0.05) ≈ **4.71:1** → **PASSES** WCAG AA ✅

**Dark mode — `--muted-foreground` on `--background`:**
- `--muted-foreground` dark: `215 20.2% 65.1%` → approximately rgb(148, 163, 184)
- `--background` dark: `222.2 84% 4.9%` → approximately rgb(9, 11, 21), luminance ≈ 0.002
- Muted-foreground dark luminance ≈ 0.382
- Contrast ratio: (0.382 + 0.05) / (0.002 + 0.05) ≈ **8.3:1** → **PASSES** ✅

**Light mode — secondary badge (`--secondary-foreground` on `--secondary`):**
- `--secondary-foreground: 222.2 47.4% 11.2%` (very dark navy) on `--secondary: 210 40% 96.1%` (near-white)
- Very high contrast — estimated **>14:1** → **PASSES** ✅

**Light mode — `text-muted-foreground` on white (used in badge outline variant and many body text instances):**
- Same as muted-foreground audit above: 4.71:1 → **PASSES** ✅

### Expected result: likely no token changes needed
Based on these calculations, the existing tokens likely pass. The story's value is in **documenting** the audit result with comments, providing evidence of compliance, and confirming no silent failures exist.

### If a token needs fixing
Decrease lightness of `--muted-foreground` to increase contrast. For 4.5:1 minimum against white:
- Current: `215.4 16.3% 46.9%` → ~4.71:1 (passing)
- If it were failing at L=50%, reducing to ~L=45% would push to ~5.0:1
- Make the smallest change that achieves compliance to minimize visual disruption

### Comment format to add in globals.css
```css
/* contrast audit 2025: --muted-foreground on --background = 4.71:1 (PASS, WCAG AA 4.5:1) */
--muted-foreground: 215.4 16.3% 46.9%;
```

```css
/* contrast audit 2025 dark: --muted-foreground on --background = 8.3:1 (PASS) */
--muted-foreground: 215 20.2% 65.1%;
```

### Tools for verification
Use a browser devtools contrast checker, or the [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/) to verify with HSL values directly. Alternatively, use the Colour Contrast Analyser desktop app. Verify BOTH light and dark mode.

### WCAG AA thresholds
- Normal text (< 18pt / < 14pt bold): **4.5:1** minimum
- Large text (≥ 18pt / ≥ 14pt bold): **3:1** minimum
- `text-xs` (12px) is normal text → 4.5:1 required
- `text-sm` (14px) is normal text → 4.5:1 required (not large text unless bold at 14pt ≥ ~18.67px)

### Project Structure Notes
- Only `frontend/app/globals.css` is modified
- No TypeScript changes — this is a pure CSS audit/fix story
- No new dependencies

### References
- globals.css: `frontend/app/globals.css`
- Tailwind config (token definitions): `frontend/tailwind.config.ts`
- Epics spec: `_bmad-output/planning-artifacts/epics.md` → Story 3.3, UX-DR10, NFR5, NFR6

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
