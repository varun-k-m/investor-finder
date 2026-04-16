# Story 9.4: Skip navigation link for keyboard users

Status: done

## Story

As a keyboard-only or screen reader user,
I want to skip past the sidebar navigation directly to main content,
so that I don't have to tab through every nav link on every page.

## Acceptance Criteria

1. **Given** a keyboard user arrives on any page within the app layout **When** they press Tab as their first action **Then** a "Skip to main content" link becomes visible at the top of the page.

2. **Given** the skip link is focused and the user presses Enter **When** focus moves **Then** focus jumps to the element with `id="main-content"`.

3. **Given** the skip link is not focused **When** the page renders **Then** the link is visually hidden (`sr-only`) and does not affect page layout.

4. **Given** the skip link renders **When** a developer inspects AppLayout **Then** `<a href="#main-content">` appears as the first child of the layout wrapper, and the main content area has `id="main-content"`.

## Tasks / Subtasks

- [x] Update `frontend/app/(app)/layout.tsx` (AC: 1, 2, 3, 4)
  - [x] Added skip link as the very first element inside `<div className="flex min-h-screen">`
  - [x] Added `id="main-content"` to the `<main>` element
  - [x] Uses `sr-only focus:not-sr-only focus:z-[100]` pattern per spec

- [x] Run `npm run typecheck && npm run lint` — zero errors

## Dev Notes

### File to modify
`frontend/app/(app)/layout.tsx` only.

### Exact skip link markup

```tsx
{/* Skip navigation — must be first focusable element */}
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:rounded focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-foreground focus:shadow-md focus:ring-2 focus:ring-ring"
>
  Skip to main content
</a>
```

Place this **immediately after** `<div className="flex min-h-screen">` — before the mobile header, before the drawer, before the desktop sidebar. It must be the first DOM element so it receives focus on the first Tab press.

### Exact `<main>` change

**Before** (line ~193):
```tsx
<main className="flex-1 ml-0 md:ml-56 pt-14 md:pt-0">{children}</main>
```

**After:**
```tsx
<main id="main-content" className="flex-1 ml-0 md:ml-56 pt-14 md:pt-0">{children}</main>
```

### How `sr-only focus:not-sr-only` works
`sr-only` = `position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0,0,0,0)` — visually invisible but in the DOM.

`focus:not-sr-only` = when focused, reverse the sr-only clip/size, making the element visible. The `focus:absolute focus:top-2 focus:left-2` positions it in the top-left corner of the viewport on focus.

This pattern is already supported by Tailwind CSS and requires no new config.

### z-index consideration
The mobile header has `z-40`. Set the skip link to `focus:z-[100]` so it renders above all other elements when focused.

### The skip link is an `<a>` not a `<button>`
`<a href="#main-content">` navigates to the anchor on Enter, which moves both browser scroll position and keyboard focus to `#main-content`. This is the standard skip-link pattern — do NOT use `<button>` with `onClick` as that doesn't move focus correctly across all browsers.

### AppLayout is `'use client'`
The layout is already a client component. The `<a>` is a plain HTML anchor — no Next.js `<Link>` needed (same-page hash navigation doesn't require the router).

### Project Structure Notes
- Single file change: `frontend/app/(app)/layout.tsx`
- Two edits: insert skip link div, add `id` to main
- No new dependencies, no new components

### References
- AppLayout source: `frontend/app/(app)/layout.tsx`
- Epics spec: `_bmad-output/planning-artifacts/epics.md` → Story 3.4, UX-DR7, FR10

## Dev Agent Record

### Agent Model Used
claude-sonnet-4-6

### Debug Log References
None.

### Completion Notes List
- Inserted `<a href="#main-content">` as first child of outermost flex div
- Added `id="main-content"` to `<main>`
- Uses Tailwind `sr-only focus:not-sr-only focus:z-[100]` pattern exactly as specified
- typecheck: 0 errors; lint: 0 warnings/errors

### File List
- `frontend/app/(app)/layout.tsx`
