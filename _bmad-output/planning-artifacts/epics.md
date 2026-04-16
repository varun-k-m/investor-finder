---
stepsCompleted: [1, 2, 3, 4]
workflowStatus: complete
inputDocuments:
  - docs/architecture.md
  - _bmad-output/planning-artifacts/ux-design-specification.md
scope: Sprint 7+
---

# InvestorMatch - Epic Breakdown (Sprint 7+)

## Overview

This document provides the epic and story breakdown for InvestorMatch Sprint 7+, decomposing UX design requirements from the completed UX Design Specification into implementable frontend stories. All work is purely frontend (Next.js 14 App Router). No backend changes are required — the backend already stores `fit_reasoning`, quota data, and all fields needed by these features.

---

## Requirements Inventory

### Functional Requirements

FR1: InvestorCard must display `fit_reasoning` text above the "Show Fit Details" toggle, always visible when `fit_reasoning` is non-null.
FR2: IdeaForm must hide the 4 optional filter fields (sectors, stages, geo, budget) by default, with a "Refine search" toggle button to reveal them on demand.
FR3: When a free-tier user reaches their monthly search quota, the system must display a MilestoneCard component (blue, with progress bar and upgrade CTA) in place of the current amber warning banner.
FR4: Saving an investor must trigger a visual scale animation on the Save button, and the button must use status-specific colors in its saved state (green=saved, blue=contacted, purple=replied, gray=passed).
FR5: The AgentProgressBar activity log must announce updates to screen readers via `aria-live="polite"`.
FR6: The SavedBoard must animate cards into their column using Framer Motion when their status changes (Kanban pop-in).
FR7: The FitScoreRing SVG must have an accessible text label readable by screen readers.
FR8: The MultiSelect component must indicate multi-select capability to assistive technologies.
FR9: All interactive elements must have visible focus indicators using the `focus-visible:ring` Tailwind pattern.
FR10: AppLayout must include a skip navigation link for keyboard and screen reader users.
FR11: Mobile touch targets must meet the minimum 44×44px size for all InvestorCard action buttons on mobile viewports.
FR12: SavedBoard must support smooth horizontal scroll on iOS with momentum scrolling.

### NonFunctional Requirements

NFR1: All new animations must respect the `prefers-reduced-motion` OS setting via Framer Motion's `useReducedMotion()` hook — no exceptions.
NFR2: All modified and new components must target WCAG 2.1 Level AA compliance.
NFR3: All color values must use CSS variable tokens (e.g., `text-primary`, `bg-primary/5`, `border-primary/30`) — no hardcoded hex or rgb values — for automatic dark mode compatibility.
NFR4: New components must be written in TypeScript with explicit exported prop interfaces.
NFR5: `--muted-foreground` text on `--background` must achieve a 4.5:1 contrast ratio (audit required before Sprint 7 ships).
NFR6: Badge `text-xs` (12px) text must achieve 4.5:1 contrast ratio per WCAG small text standard.

### Additional Requirements

- All changes are in the Next.js 14 App Router frontend project at `frontend/`
- Tailwind CSS + shadcn/ui (copy-owned Radix primitives in `components/ui/`) — no new UI library dependencies to be introduced
- Framer Motion is already installed — use the existing dependency for all animation work
- No backend changes required for Sprint 7 or Sprint 8 — the backend already exposes `fit_reasoning`, `searches_used`, and all quota data via `GET /api/v1/users/me`

### UX Design Requirements

UX-DR1: FitReasoningBlock — render Claude's `fit_reasoning` string with: "Why this match" label (10px, uppercase, `text-primary`), reasoning text (italic, 13px, `text-muted-foreground`), left-border accent (2px solid, `border-primary/30`), background tint (`bg-primary/5`). Must not render if `fit_reasoning` is null. Props: `{ reasoning: string; className?: string }`.
UX-DR2: IdeaForm progressive disclosure — add `showFilters: boolean` state defaulting to `false`. Wrap the 4 optional filter fields in a conditional render. Add a "Refine search" toggle button using `Button variant="outline"` with `SlidersHorizontal` icon from lucide-react, placed between the textarea and the submit button.
UX-DR3: MilestoneCard — new component at `components/search/MilestoneCard.tsx`. Anatomy: icon circle + title ("3 searches completed this month") + motivating body copy + progress track (`used/limit`) + "Upgrade to Pro ✨" primary CTA button + pricing anchor text. Props: `{ used: number; limit: number; onUpgrade?: () => void }`. ARIA: `role="status"` on container, `role="progressbar"` with `aria-valuenow`/`aria-valuemax` on progress track.
UX-DR4: Save button animation — wrap existing Save `Button` in Framer Motion `motion.button` with scale animation triggered on `onSuccess`. Status badge color map: saved → green, contacted → blue, replied → purple, passed → gray (muted). Guard entire animation block with `useReducedMotion()`.
UX-DR5: Kanban pop-in animation — wrap each SavedBoard card in `AnimatePresence` + `motion.div` with spring entry (`type: "spring"`, `stiffness: 300`, `damping: 24`). Guard with `useReducedMotion()`.
UX-DR6: FitScoreRing accessibility — add `<title id="fit-ring-{investor.id}">Fit score: {score} out of 100</title>` inside the `<svg>`, and `aria-labelledby="fit-ring-{investor.id}"` on the `<svg>` element.
UX-DR7: Skip link — add `<a href="#main-content">Skip to main content</a>` using `sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-2` Tailwind classes at the top of AppLayout, before the sidebar. Add `id="main-content"` to the main content area.
UX-DR8: Mobile touch targets — audit InvestorCard action row on mobile viewport. `Button size="sm"` (36px height) must be increased to minimum 44px on mobile — apply conditional `py-2` or switch to `size="default"` at the `sm:` breakpoint.
UX-DR9: SavedBoard iOS scroll — add `overflow-x-auto` on the Kanban columns wrapper with `-webkit-overflow-scrolling: touch` in `globals.css` or as an inline style for iOS momentum scrolling support.
UX-DR10: Color contrast audit — verify `--muted-foreground` on `--background` achieves 4.5:1; verify `text-xs` badge text achieves 4.5:1. Document passing/failing tokens before Sprint 7 ships. Fix any failing tokens in `globals.css`.

### FR Coverage Map

| FR | Epic | Story |
|---|---|---|
| FR1 | Epic 1 | Story 1.1 |
| FR2 | Epic 1 | Story 1.2 |
| FR3 | Epic 1 | Story 1.3 |
| FR4 | Epic 2 | Story 2.1 |
| FR5 | Epic 2 | Story 2.2 |
| FR6 | Epic 2 | Story 2.3 |
| FR7 | Epic 3 | Story 3.1 |
| FR8 | Epic 3 | Story 3.2 |
| FR9 | Epic 3 | Story 3.3 |
| FR10 | Epic 3 | Story 3.4 |
| FR11 | Epic 3 | Story 3.5 |
| FR12 | Epic 3 | Story 3.6 |
| UX-DR1 | Epic 1 | Story 1.1 |
| UX-DR2 | Epic 1 | Story 1.2 |
| UX-DR3 | Epic 1 | Story 1.3 |
| UX-DR4 | Epic 2 | Story 2.1 |
| UX-DR5 | Epic 2 | Story 2.3 |
| UX-DR6 | Epic 3 | Story 3.1 |
| UX-DR7 | Epic 3 | Story 3.4 |
| UX-DR8 | Epic 3 | Story 3.5 |
| UX-DR9 | Epic 3 | Story 3.6 |
| UX-DR10 | Epic 3 | Story 3.3 |

## Epic List

- **Epic 1**: Sprint 7 — UX Signal & Engagement Improvements
- **Epic 2**: Sprint 8 — Animation & Micro-interactions
- **Epic 3**: Accessibility & Responsive Polish

---

## Epic 1: Sprint 7 — UX Signal & Engagement Improvements

Surface AI-generated fit reasoning to founders, reduce form cognitive load with progressive disclosure, and reframe the quota limit as a motivating milestone — three high-signal, low-risk UX improvements targeting first-impression quality and conversion.

### Story 1.1: Surface fit_reasoning above the fold on InvestorCard

As a founder reviewing investor results,
I want to see Claude's plain-language explanation of why each investor matches my startup,
So that I can quickly assess fit without expanding additional panels.

**Acceptance Criteria:**

**Given** an InvestorCard renders with a non-null `fit_reasoning` value
**When** the card mounts
**Then** a FitReasoningBlock is displayed between the check range/geo row and the "Show Fit Details" toggle

**Given** the FitReasoningBlock is rendered
**When** a user views it
**Then** it shows a "WHY THIS MATCH" label in 10px uppercase `text-primary`, the reasoning text in italic 13px `text-muted-foreground`, a 2px left border in `border-primary/30`, and a `bg-primary/5` background tint

**Given** an InvestorCard renders with a null `fit_reasoning` value
**When** the card mounts
**Then** no FitReasoningBlock is rendered and no empty space appears in its place

**Given** dark mode is active
**When** a FitReasoningBlock is displayed
**Then** all colors resolve correctly from CSS variable tokens — no hardcoded values produce contrast failures

**Given** a developer imports FitReasoningBlock
**When** they inspect the component's TypeScript interface
**Then** the props are typed as `{ reasoning: string; className?: string }` with the interface exported

---

### Story 1.2: Progressive disclosure of optional filters in IdeaForm

As a founder starting a new search,
I want the form to show only the description field by default,
So that I can start a search quickly without being overwhelmed by optional filters.

**Acceptance Criteria:**

**Given** a founder navigates to the new search page
**When** IdeaForm mounts
**Then** only the description textarea and a "Refine search" toggle button are visible — the 4 optional filter fields (Sectors, Stage, Geography, Check size range) are hidden

**Given** the form is in collapsed state
**When** the founder clicks "Refine search"
**Then** the 4 optional filter fields animate into view and the button label changes to indicate collapse (e.g., "Hide filters" or chevron direction reversal)

**Given** filters are visible
**When** the founder clicks the toggle again
**Then** the filter fields collapse and any values set inside them are preserved in component state (not reset)

**Given** the toggle button renders
**When** a user inspects it
**Then** it uses `Button variant="outline"` with the `SlidersHorizontal` icon from lucide-react, placed directly below the textarea

**Given** a founder submits the form with filters hidden
**When** the mutation fires
**Then** the payload includes only the fields that have values — whether filters are visible or hidden does not affect what gets submitted

---

### Story 1.3: Milestone quota card replaces amber warning banner

As a founder who has used all 3 free searches,
I want the quota limit state to feel like an achievement rather than a hard stop,
So that I'm motivated to upgrade rather than feel blocked.

**Acceptance Criteria:**

**Given** a free-tier founder triggers the search quota limit (HTTP 429 or `limit reached` error)
**When** the error is received by IdeaForm
**Then** the MilestoneCard component renders in place of the current amber `quotaError` banner

**Given** MilestoneCard renders
**When** a user views it
**Then** it shows: an icon circle, a title of "3 searches completed this month", motivating body copy, a progress bar filled to 100% (3/3), an "Upgrade to Pro ✨" primary CTA button, and a pricing anchor link

**Given** MilestoneCard renders
**When** a screen reader user focuses on it
**Then** the container has `role="status"`, and the progress bar has `role="progressbar"` with `aria-valuenow="3"` and `aria-valuemax="3"`

**Given** dark mode is active
**When** MilestoneCard renders
**Then** all colors use CSS variable tokens — the blue accent and progress bar render correctly in dark mode

**Given** the MilestoneCard's "Upgrade to Pro" CTA is clicked
**When** the click fires
**Then** the `onUpgrade` prop callback is invoked (if provided) and the user is navigated to `/pricing`

**Given** a developer creates MilestoneCard
**When** they inspect the TypeScript interface
**Then** props are typed as `{ used: number; limit: number; onUpgrade?: () => void }` with the interface exported from `components/search/MilestoneCard.tsx`

---

## Epic 2: Sprint 8 — Animation & Micro-interactions

Upgrade interactive feedback with purposeful Framer Motion animations: save confirmation with status-colored states, live activity log accessibility, and Kanban card entry animation — all gated behind `useReducedMotion()`.

### Story 2.1: Save button animation and status-specific colors

As a founder saving an investor,
I want the Save button to animate and change color to reflect the saved state,
So that I have clear, satisfying confirmation that the action registered.

**Acceptance Criteria:**

**Given** a founder clicks the Save button on an InvestorCard
**When** the save mutation succeeds
**Then** the Save button plays a scale animation (briefly scales up then settles) and transitions to green background with white text

**Given** the user's OS has `prefers-reduced-motion: reduce` enabled
**When** the save mutation succeeds
**Then** the button state updates immediately with no scale animation — `useReducedMotion()` returns true and the animation is skipped

**Given** an investor has been previously saved and status is updated to "contacted"
**When** the InvestorCard renders with `initialStatus="contacted"`
**Then** the button renders in blue (contacted), not the default green

**Given** the status is "replied"
**When** InvestorCard renders with `initialStatus="replied"`
**Then** the button renders in purple

**Given** the status is "passed"
**When** InvestorCard renders with `initialStatus="passed"`
**Then** the button renders in gray/muted

**Given** an animation is applied to the Save button
**When** the DOM is inspected
**Then** the button is wrapped in `motion.button` from framer-motion, and all color values use Tailwind token classes — no hardcoded hex values

---

### Story 2.2: AgentProgressBar activity log announces updates to screen readers

As a founder with a screen reader waiting for search results,
I want the agent activity log updates to be announced as they appear,
So that I can follow search progress without watching the screen.

**Acceptance Criteria:**

**Given** an investor search is running
**When** the AgentProgressBar activity log receives a new progress line
**Then** the new line is announced by screen readers via `aria-live="polite"` on the log container

**Given** the activity log container renders
**When** a developer inspects the DOM
**Then** the container element has `aria-live="polite"` and `aria-atomic="false"` attributes set

**Given** multiple log lines arrive in quick succession
**When** screen reader announces them
**Then** each line is announced individually — `aria-atomic="false"` ensures individual item announcement rather than re-reading the entire log

**Given** the search completes
**When** the completion event fires
**Then** a final "Search complete — N investors found" message is appended to the live region

---

### Story 2.3: Kanban card pop-in animation on SavedBoard

As a founder moving investors through the pipeline,
I want cards to animate into their column when status changes,
So that the Kanban board feels responsive and confirms the action clearly.

**Acceptance Criteria:**

**Given** an investor's status is updated (e.g., saved → contacted)
**When** the card appears in the new column
**Then** it animates in with a spring entry (opacity 0→1, y: 12→0, spring stiffness 300, damping 24)

**Given** the user's OS has `prefers-reduced-motion: reduce` enabled
**When** a card moves to a new column
**Then** the card appears immediately with no animation

**Given** the SavedBoard renders with existing cards on mount
**When** the component first loads
**Then** pre-existing cards do not animate — only newly arriving cards animate in (use `AnimatePresence` with `initial={false}` on the parent)

**Given** a card animation plays
**When** the DOM is inspected
**Then** each card is wrapped in `motion.div` from framer-motion, and the parent column uses `AnimatePresence`

---

## Epic 3: Accessibility & Responsive Polish

Address all WCAG 2.1 Level AA gaps identified in the UX Design Specification: SVG labels, ARIA roles, focus indicators, skip navigation, color contrast audit, and mobile touch target/scroll fixes.

### Story 3.1: FitScoreRing SVG accessible label

As a screen reader user viewing investor results,
I want the fit score ring to announce the score value,
So that I can understand fit quality without relying on the visual ring graphic.

**Acceptance Criteria:**

**Given** a FitScoreRing renders for an investor with score 78
**When** a screen reader focuses on it
**Then** it announces "Fit score: 78 out of 100"

**Given** the FitScoreRing SVG renders
**When** the DOM is inspected
**Then** the `<svg>` element has a `<title>` child element containing "Fit score: {score} out of 100", an `id` of `fit-ring-{investorId}`, and `aria-labelledby` pointing to that id

**Given** a null fit score
**When** FitScoreRing does not render (existing null guard)
**Then** no accessible label work is required — component is not in DOM

---

### Story 3.2: MultiSelect announces multi-select capability to assistive technologies

As a screen reader user selecting sectors or geographies,
I want the multi-select dropdowns to be correctly identified as multi-selectable,
So that I understand I can pick more than one option.

**Acceptance Criteria:**

**Given** a MultiSelect component renders (Sectors, Stage, or Geography field)
**When** a screen reader focuses on the trigger
**Then** it announces the element as a combobox that supports multiple selection

**Given** the MultiSelect trigger renders
**When** the DOM is inspected
**Then** `aria-multiselectable="true"` is present on the Radix Command trigger wrapper

**Given** items are selected
**When** a screen reader inspects the selected options
**Then** each selected item has `aria-selected="true"` (Radix Command handles this for individual items — verify it is not being suppressed)

---

### Story 3.3: Color contrast audit and token fixes

As a founder using InvestorMatch in any lighting condition,
I want all text to meet WCAG AA contrast requirements,
So that the interface is readable regardless of vision ability.

**Acceptance Criteria:**

**Given** the audit runs against the production light mode stylesheet
**When** `--muted-foreground` color is tested against `--background`
**Then** the contrast ratio is measured and documented — if below 4.5:1, the HSL value in `globals.css` is adjusted until it passes

**Given** the audit runs against Badge component text (`text-xs`, ~12px)
**When** badge foreground color is tested against badge background
**Then** the contrast ratio meets 4.5:1 (small text standard at AA)

**Given** the audit runs against dark mode stylesheet
**When** the same tokens are tested in dark mode
**Then** all tokens pass 4.5:1 or corrected values are applied to the `.dark` block in `globals.css`

**Given** the audit is complete
**When** results are documented
**Then** a comment in `globals.css` above each audited token records the contrast ratio and pass/fail status

---

### Story 3.4: Skip navigation link for keyboard users

As a keyboard-only or screen reader user,
I want to skip past the sidebar navigation directly to main content,
So that I don't have to tab through every nav link on every page.

**Acceptance Criteria:**

**Given** a keyboard user arrives on any page within the app layout
**When** they press Tab as their first action
**Then** a "Skip to main content" link becomes visible at the top of the page

**Given** the skip link is focused and the user presses Enter
**When** focus moves
**Then** focus jumps directly to the element with `id="main-content"` (the main content area)

**Given** the skip link is not focused
**When** the page renders
**Then** the link is visually hidden (uses `sr-only` Tailwind class) and does not affect page layout

**Given** the skip link renders
**When** a developer inspects AppLayout
**Then** `<a href="#main-content" className="sr-only focus:not-sr-only ...">Skip to main content</a>` appears as the first child of the layout wrapper, and the main content area has `id="main-content"`

---

### Story 3.5: Mobile touch target size compliance

As a founder using InvestorMatch on a phone,
I want action buttons to be easy to tap accurately,
So that I don't mis-tap or have to zoom in to use the app.

**Acceptance Criteria:**

**Given** an InvestorCard renders on a mobile viewport (< 640px)
**When** the Save and "Generate Pitch" buttons are inspected
**Then** each button has a minimum tap target height of 44px (either via `size="default"` at the `sm:` breakpoint or `py-2` padding addition)

**Given** a mobile user taps the Save button
**When** they tap anywhere within the button's visible bounds
**Then** the tap registers correctly — no need to tap precisely on the label text

**Given** the fix is implemented
**When** the desktop layout renders at `lg:` breakpoint
**Then** button sizes are unchanged from current design — fix applies only on mobile breakpoints

---

### Story 3.6: SavedBoard horizontal scroll with iOS momentum

As a founder reviewing their pipeline on an iPhone,
I want the Kanban board to scroll smoothly between columns,
So that I can navigate all 4 status columns without friction.

**Acceptance Criteria:**

**Given** a founder opens the SavedBoard on an iOS device (Safari Mobile)
**When** they swipe horizontally across the Kanban columns
**Then** the scroll has iOS momentum — it continues to decelerate after the finger lifts (rubber-band feel)

**Given** the SavedBoard Kanban wrapper renders
**When** a developer inspects the DOM
**Then** the columns wrapper has `overflow-x-auto` and `-webkit-overflow-scrolling: touch` applied (either via Tailwind or globals.css)

**Given** the fix is applied
**When** the layout renders on desktop (>= 1024px)
**Then** all 4 columns display side by side without horizontal scroll — the overflow behavior does not affect desktop layout
