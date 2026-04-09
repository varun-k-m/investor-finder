# Architecture Document

## InvestorMatch — AI-Powered Investor Discovery Platform

**Version:** 1.1  
**Status:** Approved for Development  
**BMAD Phase:** 3 — Solutioning  
**Prepared for:** Claude Code Agent Team  
**Changelog:** v1.1 — Backend framework changed from Express to NestJS. Sections 2, 3, 6, 7 (new), 9 updated accordingly.

---

## 1. Project Overview

InvestorMatch is a web platform where a founder enters their product idea and target funding amount, and an AI agent searches the global investor network in real time to surface ranked, relevant investor profiles the founder can directly connect with and pitch.

This document serves as the authoritative reference for all Claude Code development agents (Frontend Dev, Backend Dev, QA, Scrum Master). Every architectural decision made here is binding unless a change request is approved and this document is updated.

---

## 2. System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                          CLIENT LAYER                           │
│   Next.js 14 (App Router) · TypeScript · Tailwind CSS          │
│   React Query · Zustand · Framer Motion                        │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTPS / REST + SSE
┌────────────────────────▼────────────────────────────────────────┐
│                   API LAYER — NestJS Backend                    │
│   Node.js 20 LTS · NestJS 10 · TypeScript · class-validator    │
│   Clerk Guard · Throttler · BullMQ · @nestjs/event-emitter     │
│                                                                 │
│   ┌─────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│   │ SearchModule│  │InvestorModule│  │    AgentModule       │  │
│   │             │  │              │  │  (orchestrates all   │  │
│   │ controller  │  │ controller   │  │   Claude API calls)  │  │
│   │ service     │  │ service      │  │                      │  │
│   │ bull queue  │  │ repository   │  │  IdeaParserService   │  │
│   └─────────────┘  └──────────────┘  │  DiscoveryService    │  │
│   ┌─────────────┐  ┌──────────────┐  │  SynthesisService    │  │
│   │  UserModule │  │  AuthModule  │  │  RankingService      │  │
│   │             │  │  (Clerk)     │  └──────────────────────┘  │
│   └─────────────┘  └──────────────┘                            │
└──────┬──────────────────┬───────────────────┬───────────────────┘
       │                  │                   │
┌──────▼──────┐   ┌───────▼──────┐   ┌───────▼──────┐
│  BullMQ     │   │  PostgreSQL  │   │  Clerk Auth  │
│  (Redis)    │   │  (Supabase)  │   │  (managed)   │
└──────┬──────┘   └──────────────┘   └──────────────┘
       │
┌──────▼──────────────────────────────────────────────┐
│               AGENT PIPELINE (Claude API)           │
│                                                     │
│  [1] Idea Parser  →  [2] Discovery Orchestrator    │
│         ↓                    ↓                     │
│  [3] Source Agents (parallel fan-out)              │
│      · Crunchbase API agent                        │
│      · AngelList API agent                         │
│      · Web search agent (Tavily)                   │
│      · News signal agent                           │
│  [4] Synthesis Agent  →  [5] Ranking Agent         │
└─────────────────────────────────────────────────────┘
```

---

## 3. Tech Stack — Definitive Choices

| Layer              | Technology                          | Rationale                                                               |
| ------------------ | ----------------------------------- | ----------------------------------------------------------------------- |
| Frontend framework | Next.js 14 (App Router)             | SSR, streaming, file-based routing                                      |
| Frontend language  | TypeScript                          | Type safety across FE + BE                                              |
| Styling            | Tailwind CSS + shadcn/ui            | Rapid UI, accessible components                                         |
| State management   | Zustand + React Query               | Local state + server state separation                                   |
| Backend framework  | NestJS 10                           | Opinionated modules, DI, decorators — ideal for complex agent pipelines |
| Backend runtime    | Node.js 20 LTS                      | LTS stability, async performance                                        |
| Backend language   | TypeScript                          | Shared types with frontend via monorepo                                 |
| Validation         | class-validator + class-transformer | NestJS-native DTO validation                                            |
| AI model           | claude-sonnet-4-6 (Anthropic)       | Best reasoning-to-cost ratio for agents                                 |
| Auth               | Clerk + @clerk/nestjs               | Managed auth, NestJS guard integration                                  |
| Primary database   | PostgreSQL 16 (Supabase)            | Relational + pgvector extension                                         |
| ORM                | TypeORM                             | First-class NestJS integration, migration support                       |
| Cache              | Redis (Upstash)                     | Session cache, rate limiting, job queue                                 |
| Job queue          | BullMQ + @nestjs/bull               | NestJS-native async agent pipeline execution                            |
| Rate limiting      | @nestjs/throttler                   | Built-in NestJS rate limiting per route/guard                           |
| Search API         | Tavily API                          | Ethical web search for agent use                                        |
| Investor data      | Crunchbase Basic API + AngelList    | Structured investor profiles                                            |
| Contact enrichment | Apollo.io API                       | Email/LinkedIn enrichment (ToS-compliant)                               |
| Email              | Resend                              | Transactional email                                                     |
| Payments           | Stripe                              | Subscription billing                                                    |
| Deployment         | Vercel (FE) + Railway (BE)          | Zero-config deployment                                                  |
| CI/CD              | GitHub Actions                      | Automated test + deploy pipeline                                        |
| Monitoring         | Sentry + Posthog                    | Error tracking + product analytics                                      |

---

## 4. Database Schema

### 4.1 Core Tables

```sql
-- Users (managed by Clerk, mirrored here for relational joins)
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id      TEXT UNIQUE NOT NULL,
  email         TEXT UNIQUE NOT NULL,
  name          TEXT,
  plan          TEXT DEFAULT 'free',  -- free | pro | enterprise
  searches_used INT DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Searches (each time a founder runs a discovery)
CREATE TABLE searches (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
  raw_input       TEXT NOT NULL,           -- founder's original text
  parsed_idea     JSONB,                   -- Claude's structured extraction
  status          TEXT DEFAULT 'pending',  -- pending | running | complete | failed
  result_count    INT DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  completed_at    TIMESTAMPTZ
);

-- Investor profiles (discovered + synthesised, cached per search)
CREATE TABLE investor_profiles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  search_id       UUID REFERENCES searches(id) ON DELETE CASCADE,
  canonical_name  TEXT NOT NULL,
  fund_name       TEXT,
  website         TEXT,
  sectors         TEXT[],
  stages          TEXT[],
  geo_focus       TEXT[],
  check_min       BIGINT,
  check_max       BIGINT,
  contact_email   TEXT,
  linkedin_url    TEXT,
  twitter_url     TEXT,
  sources         TEXT[],                  -- which sources found this investor
  source_urls     TEXT[],
  raw_data        JSONB,                   -- original merged records
  fit_score       NUMERIC(5,2),           -- 0-100 overall
  sector_fit      NUMERIC(5,2),
  stage_fit       NUMERIC(5,2),
  budget_fit      NUMERIC(5,2),
  geo_fit         NUMERIC(5,2),
  fit_reasoning   TEXT,                   -- Claude's plain-language explanation
  rank_position   INT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Saved investors (founder's CRM-lite)
CREATE TABLE saved_investors (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
  investor_id     UUID REFERENCES investor_profiles(id),
  status          TEXT DEFAULT 'saved',  -- saved | contacted | replied | passed
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Pitch drafts (Claude-generated per investor)
CREATE TABLE pitch_drafts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id),
  investor_id     UUID REFERENCES investor_profiles(id),
  content         TEXT NOT NULL,
  version         INT DEFAULT 1,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### 4.2 Indexes

```sql
CREATE INDEX idx_searches_user_id ON searches(user_id);
CREATE INDEX idx_searches_status ON searches(status);
CREATE INDEX idx_investor_profiles_search_id ON investor_profiles(search_id);
CREATE INDEX idx_investor_profiles_fit_score ON investor_profiles(fit_score DESC);
CREATE INDEX idx_saved_investors_user_id ON saved_investors(user_id);
```

---

## 5. API Routes

All routes are prefixed `/api/v1`. Authentication required on all routes except `/auth/*`.

### 5.1 Auth Routes (Clerk webhooks)

```
POST   /api/v1/auth/webhook          Clerk webhook → sync user to DB
```

### 5.2 Search Routes

```
POST   /api/v1/searches              Start a new investor search
GET    /api/v1/searches/:id          Get search status + results
GET    /api/v1/searches              List user's past searches
DELETE /api/v1/searches/:id          Delete a search
```

### 5.3 Investor Routes

```
GET    /api/v1/searches/:id/investors          Paginated investor list for a search
GET    /api/v1/investors/:id                   Single investor detail
POST   /api/v1/investors/:id/save             Save to user's list
PUT    /api/v1/investors/:id/status           Update saved status (contacted etc.)
POST   /api/v1/investors/:id/pitch            Generate pitch draft for this investor
```

### 5.4 User Routes

```
GET    /api/v1/users/me              Current user profile + usage stats
PUT    /api/v1/users/me              Update preferences
GET    /api/v1/users/me/saved        All saved investors with status
```

### 5.5 Streaming Route

```
GET    /api/v1/searches/:id/stream   SSE stream — real-time agent progress updates
```

The SSE stream emits events as the agent pipeline progresses:

```
event: agent_update
data: { "stage": "parsing", "message": "Analysing your idea..." }

event: agent_update
data: { "stage": "searching", "message": "Searching Crunchbase...", "progress": 20 }

event: agent_update
data: { "stage": "synthesis", "message": "Synthesising 47 profiles...", "progress": 80 }

event: complete
data: { "search_id": "abc123", "result_count": 18 }
```

---

## 6. Agent Pipeline — Detailed Specification

### 6.1 Agent 1: Idea Parser

**Trigger:** Called synchronously when `POST /api/v1/searches` is received.  
**Model:** `claude-sonnet-4-6`  
**Max tokens:** 800  
**Purpose:** Extract structured metadata from the founder's free-text idea.

**System prompt:**

```
You are an expert startup analyst. Extract structured metadata from a founder's
product description. Return ONLY valid JSON matching this exact schema —
no preamble, no explanation, no markdown fences.

Schema:
{
  "title": "short product name (max 6 words)",
  "sector": ["primary sector", "secondary sector if applicable"],
  "sub_sector": "specific niche (e.g. 'B2B payment reconciliation')",
  "stage": "idea | mvp | revenue | growth",
  "geography": "founder's country/region",
  "target_market": "B2B | B2C | B2B2C",
  "funding_ask": { "amount": number_in_usd, "currency_mentioned": "string" },
  "keywords": ["5-8 keywords for investor search"],
  "one_liner": "what this product does in one sentence"
}

If any field cannot be determined, set it to null. Never guess wildly.
```

### 6.2 Agent 2: Discovery Orchestrator

**Trigger:** Runs as a BullMQ job after idea parsing completes.  
**Purpose:** Fans out parallel search tasks to source agents, collects results.

**Orchestration logic (pseudocode):**

```typescript
async function runDiscovery(parsedIdea: ParsedIdea, searchId: string) {
  // Fan out in parallel
  const [crunchbaseResults, angellistResults, webResults, newsResults] =
    await Promise.allSettled([
      crunchbaseAgent(parsedIdea),
      angellistAgent(parsedIdea),
      webSearchAgent(parsedIdea),
      newsSignalAgent(parsedIdea),
    ]);

  // Collect successful results, log failures
  const allRaw = collectSuccessful([
    crunchbaseResults,
    angellistResults,
    webResults,
    newsResults,
  ]);

  // Emit SSE progress
  await emitProgress(searchId, "synthesis", 60);

  // Pass to synthesis agent
  const synthesised = await synthesisAgent(allRaw, parsedIdea);

  // Pass to ranking agent
  const ranked = await rankingAgent(synthesised, parsedIdea);

  // Persist to DB
  await saveInvestorProfiles(ranked, searchId);
  await markSearchComplete(searchId, ranked.length);
}
```

### 6.3 Agent 3a: Crunchbase Source Agent

**API:** Crunchbase Basic API (`/searches/organizations`)  
**Query construction:** Uses `sectors` and `keywords` from parsed idea to build filter queries.

```typescript
const query = {
  field_ids: [
    "short_description",
    "website_url",
    "investor_stage",
    "funding_stage",
  ],
  query: [
    {
      type: "predicate",
      field_id: "facet_ids",
      operator_id: "includes",
      values: ["investor"],
    },
    {
      type: "predicate",
      field_id: "investor_type",
      operator_id: "includes",
      values: ["venture_capital", "angel"],
    },
  ],
  limit: 25,
};
```

### 6.3b: Web Search Agent (Tavily)

**API:** Tavily Search API  
**Queries generated:** Multiple targeted queries constructed from parsed idea keywords.

```typescript
const queries = [
  `${parsedIdea.sector[0]} ${parsedIdea.stage} investor ${parsedIdea.geography}`,
  `venture capital ${parsedIdea.sub_sector} fund 2024 2025`,
  `angel investor ${parsedIdea.keywords.slice(0, 3).join(" ")}`,
];
// Run all queries, collect raw page content for Claude to extract from
```

### 6.4 Agent 4: Synthesis Agent

**Model:** `claude-sonnet-4-6`  
**Max tokens:** 4000  
**Input:** Array of raw investor records from all sources  
**Output:** Array of deduplicated, merged canonical investor objects

**System prompt:**

```
You are a data synthesis expert. You will receive raw investor records from
multiple sources. Your job is to:

1. NORMALISE: Map every record to the canonical schema below.
2. DEDUPLICATE: Identify records referring to the same entity using:
   - Name similarity (fuzzy match — "Sequoia" and "Sequoia Capital" are the same)
   - Website/domain match (strongest signal — exact match = definite same entity)
   - Sector + geography overlap (tiebreaker for ambiguous names)
3. MERGE: For confirmed duplicates, merge into one record:
   - Use the most complete/formal name
   - Union all sector tags, deduplicate synonyms
   - Take the range for numeric fields (check size min/max)
   - Prefer the source with highest data quality for contact fields
4. FLAG conflicts: If two sources disagree on a critical field (investment stage,
   check size by >3x), set that field to null and add to "conflicts" array.

Canonical schema per investor:
{
  "canonical_name": string,
  "fund_name": string | null,
  "website": string | null,
  "sectors": string[],
  "stages": string[],           // seed | series_a | series_b | growth | any
  "geo_focus": string[],
  "check_min": number | null,   // USD
  "check_max": number | null,   // USD
  "contact_email": string | null,
  "linkedin_url": string | null,
  "sources": string[],
  "source_urls": string[],
  "conflicts": string[]
}

Return ONLY a JSON array of canonical investor objects. No preamble.
Input records: {{RAW_RECORDS}}
```

### 6.5 Agent 5: Ranking Agent

**Model:** `claude-sonnet-4-6`  
**Max tokens:** 3000  
**Input:** Merged investor profiles + parsed idea  
**Output:** Scored and ranked profiles with reasoning

**System prompt:**

```
You are an expert startup fundraising advisor. Score each investor's fit
for this startup idea across four dimensions (0-100 each).

Startup idea:
{{PARSED_IDEA}}

Scoring dimensions:
- sector_fit: Does the investor's thesis and portfolio match the startup's sector?
  Reason semantically — "fintech infrastructure" matches "B2B payment tools".
- stage_fit: Does the startup's current stage match investor's preferred stage?
  Penalise heavily if more than one stage away.
- budget_fit: Does the funding ask fall within the investor's typical check size?
  Score 100 if within range, penalise proportionally outside range.
- geo_fit: Does the investor invest in the founder's geography?
  Score 100 if explicit match, 70 if global/agnostic, 30 if different region.

overall = (sector_fit * 0.40) + (stage_fit * 0.25) +
          (budget_fit * 0.25) + (geo_fit * 0.10)

For each investor return:
{
  "canonical_name": string,
  "sector_fit": number,
  "stage_fit": number,
  "budget_fit": number,
  "geo_fit": number,
  "overall": number,
  "fit_reasoning": "2-3 sentence plain English explanation for the founder"
}

Sort output array by overall score descending.
Return ONLY the JSON array.

Investors to score: {{MERGED_INVESTORS}}
```

---

## 7. NestJS Backend Structure

### 7.1 Project Layout

```
backend/
├── src/
│   ├── main.ts                        ← Bootstrap NestJS app, global pipes, Swagger
│   ├── app.module.ts                  ← Root module — imports all feature modules
│   │
│   ├── auth/                          ← AuthModule
│   │   ├── auth.module.ts
│   │   ├── clerk.guard.ts             ← Validates Clerk JWT on every protected route
│   │   ├── clerk.strategy.ts
│   │   └── clerk-webhook.controller.ts ← POST /auth/webhook — syncs user to DB
│   │
│   ├── users/                         ← UserModule
│   │   ├── users.module.ts
│   │   ├── users.controller.ts        ← GET/PUT /users/me
│   │   ├── users.service.ts
│   │   ├── users.repository.ts        ← TypeORM queries
│   │   └── dto/
│   │       └── update-user.dto.ts
│   │
│   ├── searches/                      ← SearchModule
│   │   ├── searches.module.ts
│   │   ├── searches.controller.ts     ← POST/GET/DELETE /searches
│   │   ├── searches.service.ts        ← Creates search, triggers BullMQ job
│   │   ├── searches.repository.ts
│   │   ├── search-stream.gateway.ts   ← SSE endpoint /searches/:id/stream
│   │   ├── search.processor.ts        ← @Processor('search') BullMQ job handler
│   │   └── dto/
│   │       ├── create-search.dto.ts
│   │       └── search-response.dto.ts
│   │
│   ├── investors/                     ← InvestorModule
│   │   ├── investors.module.ts
│   │   ├── investors.controller.ts    ← GET /investors, POST /save, PUT /status
│   │   ├── investors.service.ts
│   │   ├── investors.repository.ts
│   │   └── dto/
│   │       ├── save-investor.dto.ts
│   │       └── update-status.dto.ts
│   │
│   ├── agents/                        ← AgentModule — all Claude API logic lives here
│   │   ├── agents.module.ts
│   │   ├── idea-parser.service.ts     ← Agent 1
│   │   ├── discovery.service.ts       ← Agent 2 orchestrator
│   │   ├── sources/
│   │   │   ├── crunchbase.service.ts  ← Agent 3a
│   │   │   ├── angellist.service.ts   ← Agent 3b
│   │   │   ├── web-search.service.ts  ← Agent 3c (Tavily)
│   │   │   └── news-signal.service.ts ← Agent 3d
│   │   ├── synthesis.service.ts       ← Agent 4
│   │   ├── ranking.service.ts         ← Agent 5
│   │   └── pitch.service.ts           ← Pitch draft generator
│   │
│   ├── common/                        ← Shared utilities
│   │   ├── guards/
│   │   │   └── quota.guard.ts         ← Enforces free-tier search limits
│   │   ├── interceptors/
│   │   │   └── sentry.interceptor.ts
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts
│   │   └── types/
│   │       └── index.ts               ← Shared TypeScript interfaces
│   │
│   └── database/
│       ├── database.module.ts
│       └── migrations/                ← TypeORM migration files
│
├── test/
│   ├── e2e/
│   └── unit/
├── nest-cli.json
├── tsconfig.json
└── package.json
```

### 7.2 App Bootstrap (`main.ts`)

```typescript
import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global prefix
  app.setGlobalPrefix("api/v1");

  // Global validation pipe — enforces all DTOs automatically
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip unknown fields
      forbidNonWhitelisted: true,
      transform: true, // Auto-transform types (string → number etc.)
    }),
  );

  // Swagger — auto-generated API docs at /api/docs
  const config = new DocumentBuilder()
    .setTitle("InvestorMatch API")
    .setVersion("1.1")
    .addBearerAuth()
    .build();
  SwaggerModule.setup(
    "api/docs",
    app,
    SwaggerModule.createDocument(app, config),
  );

  // CORS for Next.js frontend
  app.enableCors({ origin: process.env.NEXT_PUBLIC_APP_URL });

  await app.listen(3001);
}
bootstrap();
```

### 7.3 Root Module (`app.module.ts`)

```typescript
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({ useFactory: typeOrmConfig }),
    BullModule.forRootAsync({ useFactory: bullConfig }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 30 }]),
    AuthModule,
    UsersModule,
    SearchesModule,
    InvestorsModule,
    AgentsModule,
  ],
})
export class AppModule {}
```

### 7.4 Example: SearchModule wiring

```typescript
// searches.module.ts
@Module({
  imports: [
    TypeOrmModule.forFeature([Search, InvestorProfile]),
    BullModule.registerQueue({ name: "search" }),
    AgentsModule,
  ],
  controllers: [SearchesController],
  providers: [SearchesService, SearchesRepository, SearchProcessor],
})
export class SearchesModule {}

// searches.controller.ts
@Controller("searches")
@UseGuards(ClerkGuard)
@ApiBearerAuth()
export class SearchesController {
  constructor(private readonly searchesService: SearchesService) {}

  @Post()
  @UseGuards(QuotaGuard)
  @HttpCode(202)
  async create(@Body() dto: CreateSearchDto, @CurrentUser() user: User) {
    return this.searchesService.create(dto, user);
  }

  @Get(":id")
  async findOne(@Param("id") id: string, @CurrentUser() user: User) {
    return this.searchesService.findOne(id, user.id);
  }

  @Sse(":id/stream")
  stream(@Param("id") id: string): Observable<MessageEvent> {
    return this.searchesService.getProgressStream(id);
  }
}

// search.processor.ts — BullMQ job handler
@Processor("search")
export class SearchProcessor {
  constructor(private readonly discoveryService: DiscoveryService) {}

  @Process()
  async handleSearch(job: Job<{ searchId: string; parsedIdea: ParsedIdea }>) {
    await this.discoveryService.run(job.data.searchId, job.data.parsedIdea);
  }
}
```

### 7.5 AgentModule — Dependency Injection Pattern

All Claude API calls are encapsulated in injectable services. This makes them independently testable and mockable in unit tests.

```typescript
// agents.module.ts
@Module({
  providers: [
    IdeaParserService,
    DiscoveryService,
    CrunchbaseService,
    AngelListService,
    WebSearchService,
    NewsSignalService,
    SynthesisService,
    RankingService,
    PitchService,
    { provide: "ANTHROPIC_CLIENT", useFactory: anthropicClientFactory },
  ],
  exports: [IdeaParserService, DiscoveryService, PitchService],
})
export class AgentsModule {}

// idea-parser.service.ts — typical agent service pattern
@Injectable()
export class IdeaParserService {
  constructor(
    @Inject("ANTHROPIC_CLIENT") private readonly anthropic: Anthropic,
  ) {}

  async parse(rawInput: string): Promise<ParsedIdea> {
    const response = await this.anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 800,
      system: IDEA_PARSER_SYSTEM_PROMPT,
      messages: [{ role: "user", content: rawInput }],
    });
    return JSON.parse(response.content[0].text) as ParsedIdea;
  }
}
```

### 7.6 Key NestJS Packages to Install

```bash
# Core NestJS + platform
npm install @nestjs/core @nestjs/common @nestjs/platform-express

# Config + validation
npm install @nestjs/config class-validator class-transformer

# Auth (Clerk)
npm install @clerk/nestjs

# Database (TypeORM + Postgres)
npm install @nestjs/typeorm typeorm pg

# Job queue (BullMQ)
npm install @nestjs/bull bull ioredis

# Rate limiting
npm install @nestjs/throttler

# SSE streaming
npm install rxjs   # already a NestJS peer dep

# Swagger
npm install @nestjs/swagger

# AI
npm install @anthropic-ai/sdk

# External APIs
npm install axios  # for Crunchbase, Tavily, Apollo calls

# Dev
npm install -D @nestjs/testing jest ts-jest supertest
```

---

## 8. Frontend Architecture

### 8.1 Page Structure (Next.js App Router)

```
app/
├── (auth)/
│   ├── sign-in/page.tsx
│   └── sign-up/page.tsx
├── (app)/
│   ├── layout.tsx              ← Protected layout with sidebar
│   ├── dashboard/page.tsx      ← Search history + quick start
│   ├── search/
│   │   ├── page.tsx            ← New search form
│   │   └── [id]/
│   │       ├── page.tsx        ← Results page
│   │       └── loading.tsx     ← Streaming skeleton
│   ├── saved/page.tsx          ← Saved investors CRM view
│   └── settings/page.tsx       ← Account + billing
├── api/                        ← Next.js API routes (thin proxies to BE)
└── layout.tsx                  ← Root layout
```

### 8.2 Key Components

```
components/
├── search/
│   ├── IdeaForm.tsx            ← Multi-step idea input form
│   ├── AgentProgressBar.tsx    ← SSE-connected real-time progress
│   └── BudgetSlider.tsx        ← Funding range input
├── investors/
│   ├── InvestorCard.tsx        ← Single investor result card
│   ├── InvestorGrid.tsx        ← Paginated grid of results
│   ├── FitScoreBadge.tsx       ← Colour-coded fit % badge
│   ├── FitBreakdown.tsx        ← Expandable dimension scores
│   └── PitchModal.tsx          ← Generate + edit pitch draft
├── saved/
│   ├── SavedBoard.tsx          ← Kanban-style status board
│   └── InvestorStatusPill.tsx
└── ui/                         ← shadcn/ui component overrides
```

### 8.3 State Management

```typescript
// Zustand store — global UI state only
interface AppStore {
  currentSearchId: string | null;
  agentStage: AgentStage | null;
  agentProgress: number;
  setAgentProgress: (stage: AgentStage, pct: number) => void;
}

// React Query — all server state
const searchQuery = useQuery({
  queryKey: ["search", searchId],
  queryFn: () => fetchSearch(searchId),
  refetchInterval: (data) => (data?.status === "complete" ? false : 2000),
});
```

### 8.4 SSE Connection (Real-time Progress)

```typescript
// hooks/useAgentStream.ts
export function useAgentStream(searchId: string) {
  const setAgentProgress = useAppStore((s) => s.setAgentProgress);

  useEffect(() => {
    const es = new EventSource(`/api/v1/searches/${searchId}/stream`);

    es.addEventListener("agent_update", (e) => {
      const { stage, progress } = JSON.parse(e.data);
      setAgentProgress(stage, progress);
    });

    es.addEventListener("complete", () => {
      es.close();
      queryClient.invalidateQueries(["search", searchId]);
    });

    return () => es.close();
  }, [searchId]);
}
```

---

## 9. Environment Variables

```bash
# App
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://investormatch.app

# Clerk Auth
CLERK_SECRET_KEY=sk_...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_WEBHOOK_SECRET=whsec_...

# Database
DATABASE_URL=postgresql://...
REDIS_URL=redis://...

# AI
ANTHROPIC_API_KEY=sk-ant-...

# External APIs
CRUNCHBASE_API_KEY=...
ANGELLIST_API_KEY=...
TAVILY_API_KEY=...
APOLLO_API_KEY=...

# Services
RESEND_API_KEY=re_...
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Monitoring
SENTRY_DSN=...
NEXT_PUBLIC_POSTHOG_KEY=...
```

---

## 10. BMAD Development Stories — Sprint Breakdown

### Epic 1: Foundation (Sprint 1)

| Story ID | Title                                              | Agent | Points |
| -------- | -------------------------------------------------- | ----- | ------ |
| S1-001   | Scaffold Next.js + NestJS monorepo with TypeScript | Dev   | 3      |
| S1-002   | Configure Clerk auth + webhook sync to Postgres    | Dev   | 3      |
| S1-003   | Set up Supabase Postgres + run initial migrations  | Dev   | 2      |
| S1-004   | Configure Redis + BullMQ job queue                 | Dev   | 2      |
| S1-005   | CI/CD pipeline with GitHub Actions                 | Dev   | 2      |
| S1-006   | Deploy skeleton to Vercel + Railway                | Dev   | 1      |

### Epic 2: Agent Pipeline (Sprint 2)

| Story ID | Title                                               | Agent | Points |
| -------- | --------------------------------------------------- | ----- | ------ |
| S2-001   | Implement Idea Parser agent (Agent 1)               | Dev   | 3      |
| S2-002   | Implement Crunchbase source agent (Agent 3a)        | Dev   | 3      |
| S2-003   | Implement Tavily web search agent (Agent 3b)        | Dev   | 3      |
| S2-004   | Implement News signal agent (Agent 3c)              | Dev   | 2      |
| S2-005   | Implement Synthesis + deduplication agent (Agent 4) | Dev   | 5      |
| S2-006   | Implement Ranking + scoring agent (Agent 5)         | Dev   | 3      |
| S2-007   | Wire Discovery Orchestrator with BullMQ             | Dev   | 3      |
| S2-008   | SSE streaming endpoint for agent progress           | Dev   | 2      |

### Epic 3: Core API (Sprint 3)

| Story ID | Title                                             | Agent | Points |
| -------- | ------------------------------------------------- | ----- | ------ |
| S3-001   | POST /searches — create search + trigger pipeline | Dev   | 3      |
| S3-002   | GET /searches/:id — status + results              | Dev   | 2      |
| S3-003   | GET /searches/:id/investors — paginated results   | Dev   | 2      |
| S3-004   | POST /investors/:id/save — save investor          | Dev   | 1      |
| S3-005   | PUT /investors/:id/status — update CRM status     | Dev   | 1      |
| S3-006   | POST /investors/:id/pitch — generate pitch draft  | Dev   | 3      |
| S3-007   | Rate limiting + usage quota enforcement           | Dev   | 2      |

### Epic 4: Frontend (Sprint 4)

| Story ID | Title                                         | Agent  | Points |
| -------- | --------------------------------------------- | ------ | ------ |
| S4-001   | IdeaForm — multi-step input with validation   | FE Dev | 3      |
| S4-002   | AgentProgressBar — SSE-connected live updates | FE Dev | 3      |
| S4-003   | InvestorCard + FitScoreBadge components       | FE Dev | 3      |
| S4-004   | InvestorGrid — paginated results view         | FE Dev | 2      |
| S4-005   | FitBreakdown — expandable score details       | FE Dev | 2      |
| S4-006   | PitchModal — generate + edit pitch draft      | FE Dev | 3      |
| S4-007   | Saved investors Kanban board                  | FE Dev | 3      |
| S4-008   | Dashboard — search history + quick start      | FE Dev | 2      |

### Epic 5: Billing + Polish (Sprint 5)

| Story ID | Title                                          | Agent | Points |
| -------- | ---------------------------------------------- | ----- | ------ |
| S5-001   | Stripe subscription integration + webhooks     | Dev   | 3      |
| S5-002   | Free tier quota enforcement (3 searches/month) | Dev   | 2      |
| S5-003   | Transactional emails with Resend               | Dev   | 2      |
| S5-004   | Sentry error monitoring setup                  | Dev   | 1      |
| S5-005   | Posthog analytics events                       | Dev   | 1      |
| S5-006   | QA — full end-to-end test suite                | QA    | 5      |

---

## 11. Non-Functional Requirements

| Requirement                | Target                     | Notes                                            |
| -------------------------- | -------------------------- | ------------------------------------------------ |
| Search latency             | < 45 seconds end-to-end    | Agent pipeline is async; SSE keeps UX responsive |
| API response time          | < 300ms (non-agent routes) | Cached reads from Postgres                       |
| Uptime                     | 99.5%                      | Vercel + Railway SLA coverage                    |
| Claude API cost per search | < $0.08                    | 5 agent calls, ~8k tokens total                  |
| Concurrent searches        | 50 simultaneous            | BullMQ concurrency limit = 10 workers            |
| Data retention             | 90 days for search results | Cron job to purge old records                    |
| GDPR compliance            | Required                   | User data deletion endpoint must exist           |

---

## 12. Security Decisions

- All API routes require valid Clerk JWT — `ClerkGuard` applied globally via `APP_GUARD` token, with opt-out via `@Public()` decorator on webhook routes.
- `@nestjs/throttler` enforces rate limits per `user_id` at the controller level — not just IP.
- Clerk webhook payloads verified with `svix` signature verification before any DB writes.
- Stripe webhooks verified with Stripe signature header — raw body preserved via `bodyParser` bypass on webhook route.
- All external API keys injected via `ConfigService` — never hardcoded or logged.
- Search results scoped strictly to `user_id` in every repository query — no cross-user data leakage possible.
- `QuotaGuard` enforces free-tier search limits before the BullMQ job is enqueued.
- LinkedIn scraping is explicitly prohibited — only Apollo.io licensed data used for contact enrichment.
- Tavily is used for all open-web search — it provides ToS-compliant search results.

---

## 13. Quality Gates

The following gates must pass before each phase transition:

### Gate 1 (After Epic 2 — Agent Pipeline complete)

- [ ] All 5 agents return valid JSON for a test idea input
- [ ] Deduplication correctly merges a seeded test set of 20 duplicate records
- [ ] Ranking scores correlate intuitively with manually verified investor fits
- [ ] BullMQ job completes end-to-end without error for 10 consecutive test runs

### Gate 2 (After Epic 3 — API complete)

- [ ] All routes return correct HTTP status codes and response shapes
- [ ] Auth middleware rejects unauthenticated requests on all protected routes
- [ ] Rate limiting correctly blocks requests over quota
- [ ] SSE stream delivers all events in correct order and closes cleanly

### Gate 3 (After Epic 4 — Frontend complete)

- [ ] IdeaForm validates and submits correctly
- [ ] AgentProgressBar reflects all SSE stages accurately
- [ ] Investor results render correctly across mobile, tablet, desktop
- [ ] Pitch modal generates and displays draft without errors

### Gate 4 (Before production release)

- [ ] QA full end-to-end test suite passes with 0 failures
- [ ] Stripe billing integration tested in test mode with all plan tiers
- [ ] Sentry receiving errors from both FE and BE
- [ ] Load test: 50 concurrent searches complete without pipeline failures
- [ ] GDPR deletion endpoint verified — removes all user data in < 5 seconds

---

## 14. Claude Code Agent Instructions

When using this document in Claude Code, direct agents as follows:

```
# Starting a new story
@bmad:scrum-master create story S2-005 from architecture.md

# Frontend work
@bmad:developer implement story S4-003
  reference: architecture.md sections 8.1, 8.2, 8.3

# Backend work
@bmad:developer implement story S3-001
  reference: architecture.md sections 5.2, 6.2, 7.3, 7.4, 10

# Agent pipeline work
@bmad:developer implement story S2-005
  reference: architecture.md sections 6.4, 7.5

# QA
@bmad:qa-engineer write tests for Epic 3 API routes
  reference: architecture.md section 5, quality gate 2

# Architecture questions
@bmad:architect review proposed change to section 6.4
```

All agents must treat this document as the source of truth. Any deviation from the specified tech stack, schema, or API contracts requires explicit architect approval and a document update before implementation.

---

_Document version controlled in `/docs/architecture.md`. v1.1 — NestJS backend. Update this file and commit with every approved architectural change._
