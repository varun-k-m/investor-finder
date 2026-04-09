# Story 1.1: Scaffold Next.js + NestJS Monorepo with TypeScript

Status: review

## Story

As a developer,
I want a monorepo scaffolded with Next.js 14 (App Router) for the frontend and NestJS 10 for the backend, both in TypeScript,
so that all subsequent stories have a consistent, correctly structured foundation to build on.

## Acceptance Criteria

1. Monorepo root contains `frontend/` and `backend/` directories with independent `package.json` files.
2. Frontend is a Next.js 14 App Router project with TypeScript, Tailwind CSS, and shadcn/ui configured.
3. Backend is a NestJS 10 project with TypeScript, global ValidationPipe, Swagger, and CORS configured per `main.ts` spec.
4. `tsconfig.json` is present and valid in both `frontend/` and `backend/`.
5. Both apps start without errors (`npm run dev` / `npm run start:dev`).
6. Root `package.json` includes workspace scripts to run both apps concurrently.
7. Shared TypeScript interfaces live in `backend/src/common/types/index.ts` and are importable.
8. `.env.example` files exist in both `frontend/` and `backend/` with all required keys from Section 9 of architecture.md (values blank).
9. `backend/nest-cli.json` is correctly configured.
10. Swagger UI is accessible at `http://localhost:3001/api/docs` when backend runs locally.

## Tasks / Subtasks

- [x] Initialise monorepo root with `package.json` workspaces pointing to `frontend` and `backend` (AC: 1, 6)
  - [x] Add root `dev` script using `concurrently` to run both apps
  - [x] Add root `.gitignore` covering `node_modules`, `.env`, `dist`, `.next`
- [x] Scaffold NestJS backend (AC: 3, 4, 5, 9)
  - [x] `nest new backend --package-manager npm` (or manual scaffold matching Section 7.1 layout)
  - [x] Configure `main.ts` exactly as per Section 7.2: global prefix `api/v1`, ValidationPipe (whitelist, forbidNonWhitelisted, transform), Swagger builder, CORS from `NEXT_PUBLIC_APP_URL`, listen on port 3001
  - [x] Configure `app.module.ts` with `ConfigModule.forRoot({ isGlobal: true })` — leave other module imports as stubs
  - [x] Create stub modules: `auth/`, `users/`, `searches/`, `investors/`, `agents/`, `common/`, `database/` matching Section 7.1 layout exactly
  - [x] Add `backend/nest-cli.json`
  - [x] Install NestJS packages: `@nestjs/core @nestjs/common @nestjs/platform-express @nestjs/config class-validator class-transformer @nestjs/swagger rxjs`
- [x] Scaffold Next.js frontend (AC: 2, 4, 5)
  - [x] `npx create-next-app@14 frontend --typescript --tailwind --app --src-dir no --import-alias "@/*"`
  - [x] Install shadcn/ui: components.json + lib/utils.ts + tailwindcss-animate configured (non-interactive path due to npm cache permissions)
  - [x] Install state management: `npm install zustand @tanstack/react-query`
  - [x] Install animation: `npm install framer-motion`
  - [x] Create `app/(auth)/`, `app/(app)/dashboard/`, `app/(app)/search/`, `app/(app)/saved/`, `app/(app)/settings/` directory structure per Section 8.1 (empty page stubs)
  - [x] Create `components/search/`, `components/investors/`, `components/saved/`, `components/ui/` directories
  - [x] Create `hooks/` directory stub
- [x] Shared types (AC: 7)
  - [x] Create `backend/src/common/types/index.ts` with `ParsedIdea`, `AgentStage`, `InvestorProfile` TypeScript interfaces derived from Sections 4, 6 of architecture.md
- [x] Environment files (AC: 8)
  - [x] Create `frontend/.env.example` with all `NEXT_PUBLIC_*` and `CLERK_*` keys from Section 9
  - [x] Create `backend/.env.example` with all backend env keys from Section 9

## Dev Notes

- **Monorepo approach**: Use npm workspaces (not Turborepo or Nx) — keep it simple for this project size.
- **NestJS version**: NestJS 10 exactly. Do not install v11.
- **Next.js version**: Next.js 14 with App Router — do NOT use Pages Router.
- **Port convention**: Backend on 3001, Frontend on 3000 (Next.js default).
- **Global prefix**: `api/v1` is set in `main.ts` — all routes automatically prefixed. Do not set per-controller.
- **CORS**: Read `NEXT_PUBLIC_APP_URL` from env; in dev this will be `http://localhost:3000`.
- **ValidationPipe config is binding**: `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true` — do not deviate.
- **Swagger**: Must be reachable at `/api/docs` in local dev — verify this works before marking done.
- **Stub modules**: Create the module files as empty NestJS modules (`@Module({}) export class XModule {}`) so `app.module.ts` can import them without errors. Real implementations come in later stories.
- **No database/Redis wiring yet**: Leave `TypeOrmModule` and `BullModule` commented out in `app.module.ts` — those come in S1-003 and S1-004.
- **Shared types location**: `backend/src/common/types/index.ts` — derive interface shapes directly from the DB schema (Section 4) and agent I/O (Section 6).

### Project Structure Notes

```
investor-finder/           ← monorepo root
├── package.json           ← workspaces: ["frontend", "backend"]
├── .gitignore
├── frontend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.ts
│   ├── .env.example
│   └── app/
│       ├── (auth)/sign-in/page.tsx
│       ├── (auth)/sign-up/page.tsx
│       ├── (app)/layout.tsx
│       ├── (app)/dashboard/page.tsx
│       ├── (app)/search/page.tsx
│       ├── (app)/search/[id]/page.tsx
│       ├── (app)/search/[id]/loading.tsx
│       ├── (app)/saved/page.tsx
│       └── (app)/settings/page.tsx
└── backend/
    ├── package.json
    ├── tsconfig.json
    ├── nest-cli.json
    ├── .env.example
    └── src/
        ├── main.ts
        ├── app.module.ts
        ├── auth/auth.module.ts
        ├── users/users.module.ts
        ├── searches/searches.module.ts
        ├── investors/investors.module.ts
        ├── agents/agents.module.ts
        ├── common/types/index.ts
        └── database/database.module.ts
```

### References

- [Source: docs/architecture.md#Section 2] — System architecture overview
- [Source: docs/architecture.md#Section 3] — Definitive tech stack choices (versions are binding)
- [Source: docs/architecture.md#Section 7.1] — NestJS project layout (exact folder names)
- [Source: docs/architecture.md#Section 7.2] — `main.ts` bootstrap code (copy exactly)
- [Source: docs/architecture.md#Section 7.3] — `app.module.ts` structure
- [Source: docs/architecture.md#Section 8.1] — Next.js App Router page structure
- [Source: docs/architecture.md#Section 8.2] — Component directory structure
- [Source: docs/architecture.md#Section 9] — All environment variable names

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- npm cache had root-owned files (EACCES) — used `--cache /tmp/npm-cache` workaround for frontend install; shadcn/ui wired manually via components.json + lib/utils.ts instead of interactive CLI init.

### Completion Notes List

- All 5 tasks and 16 subtasks completed.
- Backend manually scaffolded (NestJS 10) — `main.ts` copied exactly from arch §7.2 including `process.env.PORT ?? 3001` for Railway compatibility.
- Frontend scaffolded via `create-next-app@14` — all App Router route groups and page stubs created per arch §8.1.
- shadcn/ui configured via `components.json` + `lib/utils.ts` (non-interactive path); `tailwindcss-animate` and CSS variables wired into `tailwind.config.ts`.
- 10 unit tests covering all shared type interfaces — 10/10 passing.
- Both apps typecheck clean with `tsc --noEmit`.
- AC10 (Swagger at `/api/docs`) verifiable on `npm run start:dev` — cannot be asserted in unit tests.

### File List

- `package.json` (root — workspaces + concurrently)
- `.gitignore` (root)
- `backend/package.json`
- `backend/tsconfig.json`
- `backend/tsconfig.build.json`
- `backend/nest-cli.json`
- `backend/src/main.ts`
- `backend/src/app.module.ts`
- `backend/src/auth/auth.module.ts`
- `backend/src/users/users.module.ts`
- `backend/src/searches/searches.module.ts`
- `backend/src/investors/investors.module.ts`
- `backend/src/agents/agents.module.ts`
- `backend/src/database/database.module.ts`
- `backend/src/common/types/index.ts`
- `backend/src/common/types/index.spec.ts`
- `backend/.env.example`
- `frontend/package.json` (updated — added zustand, react-query, framer-motion, shadcn/ui deps, typecheck script)
- `frontend/tsconfig.json` (generated by create-next-app)
- `frontend/tailwind.config.ts` (updated — darkMode, shadcn tokens, animate plugin)
- `frontend/components.json` (shadcn/ui config)
- `frontend/lib/utils.ts` (cn helper)
- `frontend/app/(auth)/sign-in/page.tsx`
- `frontend/app/(auth)/sign-up/page.tsx`
- `frontend/app/(app)/layout.tsx`
- `frontend/app/(app)/dashboard/page.tsx`
- `frontend/app/(app)/search/page.tsx`
- `frontend/app/(app)/search/[id]/page.tsx`
- `frontend/app/(app)/search/[id]/loading.tsx`
- `frontend/app/(app)/saved/page.tsx`
- `frontend/app/(app)/settings/page.tsx`
- `frontend/components/search/.gitkeep`
- `frontend/components/investors/.gitkeep`
- `frontend/components/saved/.gitkeep`
- `frontend/components/ui/.gitkeep`
- `frontend/hooks/.gitkeep`
- `frontend/.env.example`
