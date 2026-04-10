# Story S4-001: IdeaForm — Multi-Step Input with Validation

## User Story
As a founder, I want a guided multi-step form where I can describe my startup idea so that the agent pipeline is triggered and I am redirected to the results page.

## Acceptance Criteria

1. `IdeaForm` renders a textarea for free-text idea input (placeholder: "Describe your startup idea, target market, and funding needs...")
2. Input is validated: minimum 20 characters; submit button disabled below threshold; inline error shown on attempt
3. Submitting calls `POST /api/v1/searches` with `{ raw_input }` via React Query mutation
4. On success (HTTP 202), stores `searchId` in Zustand (`currentSearchId`) and redirects to `/search/{id}`
5. Loading state shown on submit button while mutation is in flight
6. Unauthenticated users are redirected to sign-in by Clerk middleware (no extra handling needed in component)
7. `npm run typecheck` and `npm run lint` pass with zero errors

## Technical Context

**Architecture refs:** §8.1, §8.2, §8.3, §5.2

**What already exists:**
- `frontend/app/(app)/search/page.tsx` — stub with placeholder comment
- `frontend/middleware.ts` — Clerk auth guard protects `/search/*`
- `frontend/components/search/` — empty directory (`.gitkeep`)
- `frontend/lib/utils.ts` — `cn()` helper from shadcn
- `frontend/components.json` — shadcn/ui configured (style: default, baseColor: slate)
- `@clerk/nextjs` v7 installed — use `useAuth().getToken()` to get Bearer token
- `@tanstack/react-query` v5 installed — needs `QueryClientProvider` wrapper
- `zustand` v4 installed — store not yet created

**What to build:**

### `frontend/next.config.mjs` — Add API proxy rewrite
```js
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'}/api/v1/:path*`,
      },
    ];
  },
};
export default nextConfig;
```

### `frontend/lib/api.ts` — Authenticated fetch utility
```typescript
export async function apiFetch<T>(
  path: string,
  getToken: () => Promise<string | null>,
  options: RequestInit = {},
): Promise<T> {
  const token = await getToken();
  const res = await fetch(`/api/v1${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw Object.assign(new Error(body.message ?? res.statusText), { status: res.status });
  }
  return res.json();
}
```

### `frontend/store/app.store.ts` — Zustand store
```typescript
import { create } from 'zustand';

export type AgentStage = 'parsing' | 'searching' | 'synthesis' | 'complete';

interface AppStore {
  currentSearchId: string | null;
  agentStage: AgentStage | null;
  agentProgress: number;
  setCurrentSearchId: (id: string | null) => void;
  setAgentProgress: (stage: AgentStage, pct: number) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  currentSearchId: null,
  agentStage: null,
  agentProgress: 0,
  setCurrentSearchId: (id) => set({ currentSearchId: id }),
  setAgentProgress: (stage, pct) => set({ agentStage: stage, agentProgress: pct }),
}));
```

### `frontend/app/providers.tsx` — React Query provider
```typescript
'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
```

### `frontend/app/layout.tsx` — Wrap with Providers
Import `Providers` and wrap `{children}` inside the existing `ClerkProvider` root layout. The existing root layout is from the scaffold — read it first.

### `frontend/components/search/IdeaForm.tsx`
- `'use client'` component
- `useAuth().getToken()` for auth token
- `useMutation` from React Query for POST
- `useRouter()` for redirect after success
- `useAppStore` to set `currentSearchId`
- Textarea with `value`/`onChange`, character count display
- Submit button: disabled if `< 20 chars || isPending`
- On error: display `error.message`

### `frontend/app/(app)/search/page.tsx`
Replace stub with:
```typescript
import { IdeaForm } from '@/components/search/IdeaForm';
export default function SearchPage() {
  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-2xl font-semibold mb-6">Find Investors</h1>
      <IdeaForm />
    </div>
  );
}
```

### shadcn/ui components to install
Run: `npx shadcn@latest add button textarea` (needed for IdeaForm)

## Tasks

- [x] Add `/api/v1/*` rewrite to `next.config.mjs`
- [x] Create `frontend/lib/api.ts` — `apiFetch` utility
- [x] Create `frontend/store/app.store.ts` — Zustand store with `currentSearchId`, `agentStage`, `agentProgress`
- [x] Create `frontend/app/providers.tsx` — React Query `QueryClientProvider`
- [x] Modify `frontend/app/layout.tsx` — wrap with `<Providers>`
- [x] Install shadcn/ui components: `button`, `textarea`
- [x] Create `frontend/components/search/IdeaForm.tsx` — multi-step form (AC: 1–5)
- [x] Replace `frontend/app/(app)/search/page.tsx` with IdeaForm integration
- [x] Run `npm run typecheck && npm run lint` — zero errors

## File List
- `frontend/next.config.mjs` (modified)
- `frontend/lib/api.ts` (new)
- `frontend/store/app.store.ts` (new)
- `frontend/app/providers.tsx` (new)
- `frontend/app/layout.tsx` (modified)
- `frontend/components/ui/button.tsx` (new — shadcn)
- `frontend/components/ui/textarea.tsx` (new — shadcn)
- `frontend/components/search/IdeaForm.tsx` (new)
- `frontend/app/(app)/search/page.tsx` (modified)

## Dev Agent Record

### Completion Notes
- Added `/api/v1/*` Next.js rewrite proxy to backend (env: `NEXT_PUBLIC_API_URL`, default `http://localhost:3001`)
- Updated `globals.css` with shadcn/ui HSL CSS variable palette (slate base); updated `tailwind.config.ts` to use `hsl(var(--x))` pattern
- Wrote shadcn `Button` + `Textarea` components manually (same output as CLI, avoiding interactive prompt)
- `IdeaForm`: 20-char min validation with inline error on blur/submit; loading state on submit; Zustand `setCurrentSearchId` + `router.push` on success
- Fixed ESLint `@typescript-eslint/no-empty-object-type` in `textarea.tsx` — changed `interface TextareaProps extends ... {}` to `type TextareaProps = ...`
- typecheck + lint: ✅ zero errors
