---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]
lastStep: 14
workflowStatus: complete
inputDocuments:
  - docs/architecture.md
  - docs/deployment.md
  - _bmad-output/implementation-artifacts/4-1-idea-form.md
  - _bmad-output/implementation-artifacts/4-2-agent-progress-bar.md
  - _bmad-output/implementation-artifacts/4-3-investor-card-fit-score-badge.md
  - _bmad-output/implementation-artifacts/4-4-investor-grid.md
  - _bmad-output/implementation-artifacts/4-5-fit-breakdown.md
  - _bmad-output/implementation-artifacts/4-6-pitch-modal.md
  - _bmad-output/implementation-artifacts/4-7-saved-investors-kanban.md
  - _bmad-output/implementation-artifacts/4-8-dashboard.md
  - _bmad-output/planning-artifacts/6-2-enriched-landing-page.md
  - _bmad-output/planning-artifacts/6-3-structured-idea-form-budget-slider.md
  - _bmad-output/planning-artifacts/6-4-rich-investor-card.md
  - _bmad-output/planning-artifacts/6-5-enhanced-dashboard.md
  - _bmad-output/planning-artifacts/6-6-animated-agent-pipeline-timeline.md
  - _bmad-output/planning-artifacts/6-7-app-shell-polish.md
  - _bmad-output/planning-artifacts/6-8-dark-mode-toggle.md
---

# UX Design Specification — InvestorMatch

**Author:** Varunkrishnan
**Date:** 2026-04-16

---

<!-- UX design content will be appended sequentially through collaborative workflow steps -->

## Executive Summary

### Project Vision

InvestorMatch is an AI-powered investor discovery platform that transforms a founder's raw startup description into a ranked, personalized list of investors — complete with multi-dimensional fit scores, plain-English reasoning, and one-click pitch drafts — in under 60 seconds.

The core promise: **a founder with no VC network gets the same intelligence advantage as one with warm intros.**

The product is built on Next.js 14 (App Router) with Tailwind CSS, shadcn/ui, and Framer Motion on the frontend, backed by a NestJS agent pipeline using Claude Sonnet 4.6 as the AI backbone. The app is feature-complete through Sprint 6, with a polished sidebar layout, mobile-responsive drawer, dark mode, real-time SSE agent pipeline visualization, and a full CRM-lite Kanban board.

### Implementation Reality (as of Sprint 6)

The following screens and components are **fully implemented** in the codebase:

| Screen / Component | Status | Notes |
|---|---|---|
| Landing page | ✅ Complete | HeroSection, HowItWorks, SocialProof, PricingTeaser, sticky nav |
| App shell / Sidebar | ✅ Complete | Mobile drawer (Framer Motion), avatar, PlanBadge, UsageBar, ThemeToggle |
| IdeaForm | ✅ Complete | All 6 fields visible (no accordion); quota error with upgrade CTA |
| AgentProgressBar | ✅ Complete | 3-stage animated canvas (searching/synthesis/ranking) + activity log + elapsed timer |
| InvestorCard | ✅ Complete | FitScoreRing (SVG), avatar initials, sector/stage badges, check range, social links |
| FitBreakdown | ✅ Complete | Framer Motion animated dimension bars |
| PitchModal | ✅ Complete | Dialog with generate/edit/copy/regenerate |
| InvestorGrid | ✅ Complete | Paginated 1/2/3-col responsive grid with skeletons |
| SavedBoard | ✅ Complete | 4-column Kanban with status mutation |
| Dashboard | ✅ Complete | Stats bar (3 StatCards), search history, empty state |
| Dark mode | ✅ Complete | next-themes, system-preference aware |
| PostHog analytics | ✅ Complete | identify + track calls throughout |

### Target Users

**Primary — The Fundraising Founder:**
- Early-stage (pre-seed → Series B), typically non-technical in investor relations
- Time-constrained: building a company *while* fundraising
- Often a first-time founder or an experienced founder entering a new sector/geography
- Lacks warm VC introductions — InvestorMatch is their equalizer
- Primarily desktop (serious, workday task); mobile for reviewing saved investors on the go
- Tech-confident enough for a SaaS web app, but not needing developer-grade complexity

**Secondary — The Repeat Fundraiser (Pro):**
- Has raised before, knows what good investor targeting looks like
- Uses InvestorMatch for speed and broad coverage, not as a replacement for judgment
- Power user of the structured search form and Kanban CRM
- More likely to upgrade to Pro (unlimited searches)

### Key Design Challenges

1. **The 45-second waiting problem** — The AI pipeline takes up to 45 seconds. The `AgentProgressBar` resolves this with a rich animated canvas (floating investor tags → converging dots → ranking bars), stage pills, activity log, and elapsed timer. This is already implemented and is the product's most distinctive UX moment.

2. **IdeaForm progressive disclosure gap** — All 6 fields are currently shown upfront. For a first-time founder landing from the landing page, the full form (textarea + 3 multi-selects + budget slider) may feel like friction. The textarea-first pattern with optional filter reveal would reduce cognitive load for new users.

3. **InvestorCard information density** — The card successfully balances avatar, fit ring, sector/stage tags, check range, geo, fit details toggle, and actions within a single card. The "Show Fit Details" toggle and `fit_reasoning` text are the key trust-building elements and need visual prominence.

4. **CRM adoption** — The SavedBoard is powerful but founders need to feel the value of tracking status (saved → contacted → replied → passed). The empty state and first-save moment are critical adoption triggers.

5. **Free-tier friction management** — 3 searches/month is enforced via QuotaGuard on the backend. The `UsageBar` in the sidebar and the inline quota error on the IdeaForm both communicate limits. The upgrade CTA needs to feel motivating, not punitive.

6. **Trust in AI-generated results** — The `fit_reasoning` field (Claude's plain-English explanation per investor) is the product's strongest differentiator. It must be visually prominent, not buried under the FitBreakdown accordion.

### Design Opportunities

1. **Pipeline animation as brand signature** — The animated `AgentProgressBar` with stage-specific visuals (floating VC names, converging dots, animated ranking bars) is already exceptional. It is the single most memorable UX moment in the product and should be showcased in marketing.

2. **`fit_reasoning` as the hero feature** — A score is forgettable. Two sentences from Claude explaining *why* Sequoia Capital fits a specific B2B SaaS seed round is something founders screenshot and share. This content needs to be surfaced *above* the fold on the InvestorCard rather than hidden in the collapsed FitBreakdown.

3. **Dashboard as a motivational scoreboard** — The 3-stat bar ("12 searches · 148 investors found · 23 saved") frames fundraising progress as a momentum story. The empty state → first search → first save arc is the key habit-formation loop to optimize.

4. **Pitch generation as the closing action** — The PitchModal is the feature that turns a discovery tool into an action tool. The "Generate Pitch" CTA on each InvestorCard should be more visually prominent to drive this conversion.

5. **Mobile experience for the review phase** — While the search input is primarily desktop, reviewing saved investors and tracking outreach status is a natural mobile use case. The responsive Kanban board and mobile sidebar drawer are already implemented — the opportunity is to polish touch interactions on the SavedBoard cards.

---

## Core User Experience

### Defining Experience

The defining experience of InvestorMatch is a single, linear transformation: a founder describes their startup in plain language → the platform's AI agent pipeline runs for ~45 seconds → a ranked, scored, explained list of investors appears. Everything else in the product (filters, CRM, pitch drafts) is either input to or output from this core loop.

**Core action:** Describe startup idea → Watch the pipeline work → Read ranked investor matches → Act on the best ones.

This is not a search engine. It is a research analyst — one that works in 45 seconds instead of two weeks.

### Platform Strategy

| Dimension | Decision | Rationale |
|---|---|---|
| Primary surface | Desktop web (Next.js App Router) | Fundraising research is a serious, focused workday task — founders sit down with intent |
| Mobile role | Review & CRM tracking | Saved investors and Kanban status updates are natural on-the-go tasks |
| Responsive approach | Mobile-first CSS, desktop-optimized layout | 2-col sidebar layout on md+, full-width stacked on mobile |
| Dark mode | First-class, system-preference aware | Power users work late; dark mode signals product sophistication |
| Offline support | None required | All results are server-generated and require authentication |
| Auth boundary | Clerk-gated — all app screens require login | No anonymous searches; user identity needed for quota management and saved board |

### Effortless Interactions

The product's six key interactions and the design constraint for each:

| Interaction | User intent | Design constraint |
|---|---|---|
| Submit IdeaForm | Describe my startup and start a search | The textarea must feel like the obvious first step — filters are secondary |
| Watch AgentProgressBar | Understand what the AI is doing right now | The 45-second wait must feel purposeful, not like a loading spinner |
| Read an InvestorCard | Quickly evaluate one investor | The fit_reasoning text (Claude's explanation) must be above the fold — not hidden in accordion |
| Save an investor | Bookmark for later outreach | One-click, immediate feedback, status change visible in sidebar UsageBar |
| Generate a pitch | Draft an outreach email | Should feel like a natural next action after reading an investor card |
| Track in Kanban | Update outreach status | Card drag/status change must feel like progress being logged, not busywork |

### Critical Success Moments

Five moments where the product either earns lasting trust or loses the user:

1. **The pipeline reveal** — When the AgentProgressBar first appears after form submission, the animated stage-specific visuals (floating VC name tags, converging dots, ranking bars) must immediately signal: *"This is doing real work."* A generic spinner here would kill perceived intelligence.

2. **First card renders** — When the InvestorGrid populates after the pipeline completes, the transition from skeleton placeholders to real investor cards with fit rings must feel like intelligence arriving. The FitScoreRing (SVG arc) and sector/stage badges together convey that each result was individually scored — not bulk-retrieved.

3. **Reading fit_reasoning** — The moment a founder reads Claude's plain-English explanation of why an investor fits their specific startup is the product's highest-value interaction. This is what turns a list into intelligence. Currently buried in the FitBreakdown accordion — surfacing it changes the product's perceived value entirely.

4. **First pitch generation** — When the PitchModal generates a draft that actually references the investor's portfolio and the founder's idea, the founder feels equipped rather than overwhelmed. This is the "aha" moment that drives Pro conversion.

5. **Empty dashboard → first search** — A new user who lands on the dashboard empty state and hits "Find Investors" is the activation moment. The empty state's framing ("Your fundraising journey starts here") and CTA must convert curiosity into action without friction.

### Experience Principles

Five principles that govern every design decision in InvestorMatch:

1. **Transparency builds trust** — Show what the AI is doing at every step. Stage labels, activity log messages, elapsed timer — the AgentProgressBar's transparency is not decoration; it is the trust mechanism that makes the 45-second wait acceptable.

2. **Results before configuration** — The IdeaForm's textarea is the hero, not the filters. Filters (sector, stage, geo, budget) are refinement tools for returning users, not required input for first-timers. Progressive disclosure serves this principle.

3. **Explain the score** — A number without reasoning is trivia. Every fit score must be accompanied by Claude's `fit_reasoning` text. The InvestorCard's most important real estate is that two-sentence explanation — not the ring graphic.

4. **Every result has a next action** — Save, Generate Pitch, LinkedIn, Twitter, Website. After reading an investor card, the user should never think "now what?" The action bar must make the next step obvious without being overwhelming.

5. **CRM feels like tracking, not work** — The SavedBoard's four columns (saved → contacted → replied → passed) should feel like recording wins, not filling out a form. Status updates must be frictionless — the satisfaction of moving a card forward should outweigh the effort of the click.

---

## Desired Emotional Response

### Primary Emotional Goals

InvestorMatch exists to make founders feel **empowered** — not just informed. The emotional north star is: *"I have a real shot at this."*

This is a product for founders who feel structurally disadvantaged — they lack the warm intros that funded founders in previous generations had. The emotional promise of InvestorMatch is that **real investor intelligence is now accessible without struggle**. The feeling is not "I found a list" — it's "I found my list, and it's based on actual data about me."

**Primary emotion:** Empowered — agency, confidence, readiness to pursue investors they previously wouldn't have known to approach.

**Secondary emotion:** Effortless — the process should feel lighter than expected. Founders come in braced for hours of research; they leave in 45 seconds. That contrast is the delight.

**Tertiary emotion:** Accomplished — after saving investors and generating a pitch, founders should feel they've made real progress on their fundraise, not just browsed a database.

### Emotional Journey Mapping

| Moment | Target emotion | What creates it |
|---|---|---|
| First landing on the product | Curious, cautiously hopeful | Clear value prop — "find your investors in 45 seconds" |
| Typing in the IdeaForm | Seen and understood | The textarea invites full description; no dropdown-only constraint |
| Watching the AgentProgressBar | Impressed, engaged | Stage visuals signal real work — not a generic spinner |
| Results appear | Empowered, validated | Ranked list with fit_reasoning shows this was personalized to *them* |
| Reading fit_reasoning | Trusted, convinced | Claude's plain-English explanation > a number |
| Saving first investor | Accomplished, in motion | One click, immediate confirmation — progress feels real |
| Generating first pitch | Equipped, ready | A draft that references their actual idea and the investor's portfolio |
| Returning to the dashboard | Proud, motivated | Stats bar showing searches run, investors found — a fundraising scoreboard |
| Hitting the quota limit | Informed, not punished | Transparent limit communication + motivating upgrade path |
| Something goes wrong | Calm, handled | Clear error messaging — never confused or abandoned |

### Micro-Emotions

The product must actively cultivate these subtle emotional states:

| Target state | Opposite to avoid | Design lever |
|---|---|---|
| **Confidence** | Confusion | Clear stage labels, activity log, elapsed timer on pipeline |
| **Trust** | Skepticism | `fit_reasoning` text — Claude's reasoning, not just a score |
| **Effortlessness** | Friction | Progressive field disclosure; textarea first, filters optional |
| **Excitement** | Anxiety | Animated pipeline canvas turns waiting into watching |
| **Accomplishment** | Futility | Kanban status changes feel like wins logged, not busywork |
| **Agency** | Helplessness | Every investor card ends with a clear next action |

### Design Implications

| If we want founders to feel... | The UX must... |
|---|---|
| **Empowered** | Surface `fit_reasoning` above the fold on every InvestorCard — the AI explanation is what makes the score credible |
| **Effortless** | Keep the IdeaForm textarea as the hero interaction; filters should feel optional, not mandatory |
| **Trusted** | Show real investor data (check range, geo, portfolio) alongside AI-generated fit scores — mix of human-curated and AI-generated signals |
| **Impressed during the wait** | Maintain the AgentProgressBar's stage-specific animated canvases — they signal active intelligence, not passive loading |
| **Accomplished** | Make the Save action feel celebratory (confirm animation, Kanban column update visible); make pitch generation feel like a significant milestone |
| **Not punished at quota limit** | Frame the quota error as a milestone ("You've run 3 searches") not a wall; upgrade CTA should feel like unlocking, not paying a toll |

### Emotional Design Principles

1. **Empowerment over information** — The product's job is not to give founders a list; it's to make them feel capable of pursuing investors they couldn't access before. Every design decision asks: does this make the founder feel *more able*, or just more informed?

2. **Earned trust through transparency** — Trust in AI results cannot be assumed. It must be earned at every touchpoint: the pipeline shows its work, the score explains its reasoning, the data shows its sources. Never let the AI feel like a black box.

3. **Effortlessness as the brand** — The product's competitive advantage is that 45 seconds of effort replaces days of research. The UX must make that contrast *felt*, not just stated. Friction anywhere in the form, the wait, or the results undermines the promise.

4. **Make progress visible** — Founders are anxious. The dashboard stats bar, the Kanban columns, the saved count in the sidebar — all of these are anxiety-reduction mechanisms. They show that something real is happening, that the fundraise is moving.

5. **Every interaction earns the next** — Landing page earns the form. The form earns the wait. The wait earns the trust in results. Results earn the save. The save earns the pitch. Design each transition so the user feels *rewarded* for getting this far.

---

## UX Pattern Analysis & Inspiration

### Inspiring Products Analysis

**LinkedIn Sales Navigator**
The gold standard for B2B prospecting UX. Key patterns that earn trust:
- Structured profile cards with consistent data taxonomy (company size, industry, seniority) make comparison effortless
- Advanced search filters feel powerful without being overwhelming — defaults hide complexity, advanced mode reveals it
- "Saved leads" with status tracking (the CRM layer on top of discovery) is the model InvestorMatch's SavedBoard follows
- Trust signal: data is user-generated and verified via LinkedIn identity — results feel real because real people maintain them
- Weakness to avoid: feature sprawl. SalesNav has grown complex enough that new users are intimidated on first contact

**Crunchbase**
The definitive investor database UX reference. Key patterns:
- Investor profile cards with standardized fields (check size, portfolio, stage focus, geo) establish a shared vocabulary for "what matters" about an investor
- Sort + filter sidebar lets power users refine without cluttering the default experience
- Data sourcing transparency ("last updated", round announcements with press links) builds credibility — results feel cited, not invented
- Weakness to avoid: paywall-first disclosure. Crunchbase hides key fields behind upgrade prompts before the user has felt enough value. InvestorMatch must show enough to prove the AI's quality before quota limits kick in

**OpenVC**
A lean investor database where investors self-submit their thesis — the "trust by design" model. Key patterns:
- Filter-first interface with check size, sector, stage, and geo as primary axes — maps directly to InvestorMatch's filter set
- Each listing shows the investor's *own words* about what they look for — the original `fit_reasoning` analog
- The product earns trust by surfacing investor intent, not just identity
- Key lesson: self-stated investment thesis > algorithmically inferred focus. InvestorMatch's `fit_reasoning` serves the same function — it translates AI analysis into investor-intent language

**cofounder.ai**
The clearest "AI does research for you" UX reference. Key patterns:
- Guided input flow — the product asks you structured questions to understand your context before generating anything
- AI output feels curated and personalized, not scraped and ranked by recency
- Results are presented as recommendations with reasoning, not as a raw list to browse
- The product makes the AI's judgment feel like a collaborator's advice, not a search engine's ranking
- Key lesson: the *presentation* of AI output determines whether users trust it. A result with reasoning feels like advice; a result without reasoning feels like guesswork

### Transferable UX Patterns

**From Sales Navigator → InvestorMatch:**
- Consistent card taxonomy: every investor card shows the same fields in the same position — sector, stage, check range, geo — so comparison across cards is effortless
- CRM layer on discovery: the SavedBoard's 4-column Kanban is SalesNav's lead list pattern applied to founder outreach
- Status persistence: once you've interacted with an investor (saved, contacted, replied), that status should follow them everywhere in the product — grid view, saved board, search history

**From Crunchbase → InvestorMatch:**
- Data density with visual hierarchy: important fields (check size, stage focus) visually larger than secondary fields (portfolio count, location detail)
- Sourcing transparency: showing *why* an investor appears (sector match, stage match, geo match) the way Crunchbase cites funding round sources
- Filter sidebar as power-user tool, not primary navigation — new users shouldn't see it first

**From OpenVC → InvestorMatch:**
- Investor intent language: `fit_reasoning` should read like the investor's own thesis applied to the founder's idea — not a scoring algorithm's output
- Brevity in fit explanation: 2–3 sentences max. OpenVC's listings work because each investor thesis is scannable in 10 seconds

**From cofounder.ai → InvestorMatch:**
- Reasoning alongside every result: no result without an explanation of why it appeared
- Guided input that feels conversational: the IdeaForm's textarea is the right instinct — describe your startup in your own words, not checkboxes
- AI output as collaborator voice: `fit_reasoning` should sound like an advisor's recommendation, not a database query result

### Anti-Patterns to Avoid

| Anti-pattern | Source | Why it fails for InvestorMatch |
|---|---|---|
| **Paywall before value** | Crunchbase | Hiding key data before the user has seen AI quality destroys trust before it's built |
| **Filter overload on first view** | SalesNav advanced mode | First-time founders need to see results before they refine — filters are a returning-user tool |
| **Score without explanation** | Generic ranking tools | A number (87/100) without `fit_reasoning` feels like astrology — plausible but not trustworthy |
| **Generic AI output** | Most AI tools | "This investor focuses on fintech startups" is useless. "Sequoia's $150–500K check range and B2B SaaS portfolio history makes them a strong fit for your seed-stage API-first product" is actionable |
| **Status reset on return** | Poor CRM tools | If a founder saved an investor in a previous search, that status must persist — losing context feels like the product forgot them |

### Design Inspiration Strategy

**Adopt directly:**
- Crunchbase's investor card taxonomy (check size, stage, geo, sector) as the canonical InvestorCard field set
- SalesNav's CRM-on-top-of-discovery architecture (already implemented as SavedBoard)
- cofounder.ai's reasoning-first AI output presentation — every result has an explanation

**Adapt for InvestorMatch's context:**
- SalesNav's advanced filter sidebar → collapsed "Refine" panel in InvestorGrid, visible only after first results load
- Crunchbase's data sourcing transparency → `fit_reasoning` as the "why this result" signal (AI-generated, not press-linked, but same trust function)
- OpenVC's investor intent language → `fit_reasoning` phrasing guidelines for the Ranking Agent prompt

**Deliberately avoid:**
- Crunchbase's paywall-first disclosure — show full investor cards (including `fit_reasoning`) to free users within their quota
- SalesNav's feature sprawl — InvestorMatch's power is that it does one thing in 45 seconds, not fifty things in forty clicks
- Generic AI output phrasing — `fit_reasoning` must always reference the founder's specific idea and the investor's specific portfolio, never generic category matches

---

## Design System Foundation

### Design System Choice

**Tailwind CSS + shadcn/ui + Framer Motion**

InvestorMatch uses a themeable, copy-owned component architecture. This is not a traditional component library — shadcn/ui copies Radix UI primitives directly into the codebase as editable source files, styled with Tailwind CSS utility classes. This gives full ownership of every component while inheriting Radix's accessibility primitives and shadcn's proven visual defaults.

| Layer | Technology | Role |
|---|---|---|
| Utility styling | Tailwind CSS v3 | Spacing, color, typography, responsive layout |
| Component primitives | Radix UI (via shadcn/ui) | Accessible headless components (Dialog, Tooltip, Avatar, Command, Popover, Slider) |
| Visual components | shadcn/ui | Pre-styled variants (Button, Badge, Card, Skeleton, Sonner) |
| Animation | Framer Motion | Page transitions, animated stage canvases, mobile drawer, FitBreakdown bars |
| Theme system | next-themes + CSS variables | Light/dark mode, system-preference aware, zero flash |
| Utility helpers | `cn()` (clsx + tailwind-merge) | Conditional class composition without conflicts |

### Rationale for Selection

1. **Already implemented and proven** — The entire component set (Button, Badge, Avatar, Tooltip, Dialog, Skeleton, Command, Popover, Slider) is deployed and production-tested. This is not a decision to make — it's a decision to document and build on.

2. **Copy-owned = fully customizable** — Because shadcn/ui components live in `frontend/components/ui/`, every component can be edited without waiting for an upstream library update. The FitScoreRing (custom SVG arc), AgentProgressBar canvases (raw canvas + Framer Motion), and AvatarFallback color logic are all custom additions built on top of this foundation.

3. **Tailwind + CSS variables = first-class dark mode** — The `hsl(var(--background))` / `hsl(var(--foreground))` token system makes every component automatically dark-mode-aware. next-themes handles the class toggle; no manual dark: overrides needed on most components.

4. **Framer Motion for trust-building animation** — The AgentProgressBar's three animated canvases (SearchingVisual, SynthesisVisual, RankingVisual) are the product's most differentiated UX moment. Framer Motion's `AnimatePresence`, `motion.div`, and `useReducedMotion()` support make this achievable without custom animation engines.

5. **Accessibility by default via Radix** — Dialog, Tooltip, Popover, Command, and Slider are all Radix primitives with ARIA roles, keyboard navigation, and focus management built in. This reduces accessibility debt significantly.

### Implementation Approach

The component hierarchy is:

```
Radix UI primitives (headless, accessible)
  └── shadcn/ui styles (Tailwind, CSS variables)
       └── Custom components (FitScoreRing, AgentProgressBar, InvestorCard, etc.)
            └── Framer Motion (animation layer, additive — never replaces layout)
```

All custom components follow the same pattern:
- Props typed with TypeScript interfaces
- Styling via `cn()` for conditional Tailwind composition
- Animation via Framer Motion `motion.div` with `useReducedMotion()` fallback
- Dark mode via CSS variable tokens (no hardcoded colors)

### Customization Strategy

**What has already been customized:**
- Color tokens: `--primary`, `--muted`, `--card`, `--border`, `--destructive` set in `globals.css` for both light and dark modes
- AvatarFallback: deterministic color from name hash (avatarColor helper) — 8 distinct bg colors per first letter
- FitScoreRing: fully custom SVG arc — not a shadcn/ui component
- AgentProgressBar canvases: raw canvas animations — entirely custom, no shadcn/ui dependency
- Badge variants: `secondary` (sector tags) and `outline` (stage tags) differentiated by variant

**What to customize next (based on UX spec findings):**
- `fit_reasoning` surface: needs a new visual treatment — currently inside FitBreakdown accordion; should be an always-visible text block on InvestorCard with distinct typography (italic, slightly muted, 1px left border accent)
- IdeaForm progressive disclosure: optional filters (sectors, stages, geo, budget) should collapse behind a "Refine search" toggle for first-time users — new interaction state, no new components needed
- Save button success state: current `STATUS_LABELS` text swap is functional but flat — a brief scale animation on save confirmation would reinforce the "accomplished" emotional goal
- Quota error: amber banner is functional but punitive in tone — redesign as a milestone card ("3/3 searches used this month") with motivating framing

---

## Defining Core Experience

### The Defining Interaction

> *"Describe your startup in plain English. Thirty seconds later, read a ranked list of investors who fit — and understand exactly why each one does."*

If InvestorMatch nails this one interaction, everything else follows. The comparable product interactions:

- Tinder: *"Swipe to match"*
- Spotify: *"Discover and play any song instantly"*
- InvestorMatch: *"Describe it once, get your matched investors with AI reasoning"*

The product's core action is a **single textarea submit → AI pipeline → personalized ranked list**. The defining quality is not the list — it's that every entry in the list *explains itself*. That explanation (`fit_reasoning`) is what makes the result feel like intelligence rather than a database query.

### User Mental Model

**How founders currently solve this problem:**
- Manually browsing Crunchbase for investors with matching sector tags (slow, unfiltered by stage/geo/check size simultaneously)
- Asking other founders "who should I talk to?" (depends entirely on network quality)
- Paying for introductions or accelerator access (expensive, gatekept)
- LinkedIn cold outreach to investors whose focus is guesswork (low signal, low response rate)

**Mental model founders bring to InvestorMatch:**
- They expect a *search interface* — most investor discovery tools are filter-and-browse
- They are pleasantly surprised when a *description input* produces *personalized results* — this pattern is closer to asking a trusted advisor than searching a database
- They are skeptical of AI-generated lists by default — "how does it know which investors are right for me?" The `fit_reasoning` is the answer to this skepticism; without it, the product feels like guesswork dressed up as intelligence
- They measure quality by recognizing investor names — if Sequoia, a16z, or Y Combinator appear for a relevant idea, trust is established. If obscure/irrelevant names appear first, trust collapses immediately

**Where founders get confused or frustrated:**
- Unclear minimum viable input: "How much do I need to write for good results?" → Character counter + placeholder examples solve this
- Filters that feel like gatekeeping: "Should I fill out all the filters or just submit?" → Textarea-first, filters-optional progressive disclosure resolves this
- Results that feel generic: "These are just well-known VCs, not matches" → `fit_reasoning` specificity is the differentiator; generic explanations destroy trust as fast as generic results

### Success Criteria

The core interaction succeeds when a founder:

1. **Submits in under 90 seconds** — Fills the textarea with a natural description of their startup; optionally adds 1–2 filters; hits "Find Investors" without second-guessing whether they've done it "right"
2. **Feels engaged during the 45-second wait** — Watches the AgentProgressBar's animated stages (searching → synthesis → ranking) and reads activity log messages without feeling abandoned; elapsed timer prevents "is it frozen?" anxiety
3. **Reads the first investor card and says "that makes sense"** — The `fit_reasoning` for the top result references something specific about their startup (sector, stage, check size, a relevant portfolio company) that proves the AI understood their description
4. **Saves at least one investor before leaving** — The transition from "browsing results" to "taking action" (Save → Kanban) is the habit-formation moment; if they leave without saving, the session produced no lasting value
5. **Returns within 7 days** — The dashboard's search history and stats bar ("1 search · 12 investors found · 3 saved") make returning feel like continuing progress, not starting over

**The interaction fails when:**
- `fit_reasoning` is generic ("This investor focuses on SaaS startups") rather than specific ("This investor's portfolio of B2B API tools and $250K–1M check range aligns with your seed-stage developer infrastructure play")
- The pipeline takes >60 seconds without visible progress indicators
- The top 3 results are investors the founder can immediately identify as irrelevant — trust collapses and is nearly impossible to recover in the same session

### Novel vs. Established Patterns

InvestorMatch uses **familiar patterns in an innovative sequence**:

| Pattern | Origin | How InvestorMatch uses it |
|---|---|---|
| Free-text search input | Google, Perplexity | As startup *description*, not keyword query — triggers AI understanding, not string matching |
| AI pipeline visualization | No direct precedent | The AgentProgressBar's animated stage canvases are novel — most AI tools show a spinner |
| Scored results grid | Crunchbase, SalesNav | Cards are familiar; the SVG FitScoreRing + `fit_reasoning` combination is novel |
| CRM Kanban | Trello, Notion | Applied to investor outreach status — familiar metaphor, new context |
| Pitch generation modal | No direct precedent | One-click draft from investor profile + startup description — novel closing action |

**The novel pattern that needs no education:** The textarea → AI pipeline → results sequence feels intuitive because founders understand "describe your startup" (they do it in investor meetings). The AI doing the matching is the surprise — but a positive one. No tutorial needed.

**The novel pattern that benefits from a hint:** The `fit_reasoning` toggle ("Show Fit Details") implies the reasoning is *below* the fold. The UX opportunity is to surface 1–2 sentences of `fit_reasoning` *always visible* on each card — removing the discoverability barrier for the product's highest-value content.

### Experience Mechanics

**The complete flow of the defining interaction:**

**1. Initiation**
- User arrives at `/search` (New Search nav link or empty dashboard CTA)
- The IdeaForm is the only content — no competing distractions
- The textarea's placeholder text models the ideal input: *"Describe your startup idea, target market, and funding needs..."*
- Trigger: user begins typing; the 20-char minimum counter provides implicit guidance on depth expected

**2. Interaction**
- User types a 2–5 sentence description of their startup (natural language, no structured format required)
- Optionally selects sector, stage, geo, or check size filters — each is a MultiSelect dropdown, independently optional
- Hits "Find Investors" — form validates inline (min length check), then POST `/searches`
- Immediate redirect to `/search/:id` — AgentProgressBar appears with indeterminate shimmer while SSE connection establishes

**3. Feedback (the pipeline)**
- SSE stream delivers stage updates: `searching` → `synthesis` → `ranking`
- Each stage has a distinct animated canvas (floating investor name tags / converging dots / animated ranking bars)
- Activity log messages appear sequentially, fading older ones — e.g., "Searching Crunchbase...", "Found 47 candidates", "Scoring sector fit..."
- Elapsed timer counts up — transparency about time passing, not hiding it
- Stage pills at top show completed stages with checkmarks

**4. Completion**
- Pipeline completes → InvestorGrid renders with skeleton → real cards populate
- First visible card shows: Avatar + name, FitScoreRing score, sector/stage badges, check range, geo, `fit_reasoning` (always visible), Save + Generate Pitch CTAs
- Pagination allows browsing beyond initial set; grid is 1/2/3-col responsive
- User's next action is clear: read `fit_reasoning`, save the investor, generate a pitch, or open their LinkedIn

---

## Visual Design Foundation

### Color System

InvestorMatch uses shadcn/ui's semantic CSS variable color system — all colors are defined as HSL values in `globals.css` and consumed via Tailwind aliases. The system is fully dark-mode aware with zero hardcoded colors in components.

**Semantic color tokens:**

| Token | Light mode (HSL) | Dark mode (HSL) | Usage |
|---|---|---|---|
| `--background` | `0 0% 100%` (white) | `222.2 84% 4.9%` (deep navy) | Page background |
| `--foreground` | `222.2 84% 4.9%` (near-black) | `210 40% 98%` (near-white) | Body text |
| `--card` | `0 0% 100%` (white) | `222.2 84% 4.9%` (deep navy) | Card surfaces |
| `--primary` | `222.2 47.4% 11.2%` (dark navy) | `210 40% 98%` (near-white) | CTA buttons, active nav, FitScoreRing |
| `--muted` | `210 40% 96.1%` (light blue-gray) | `217.2 32.6% 17.5%` (dark blue-gray) | Secondary backgrounds, Badge fills |
| `--muted-foreground` | `215.4 16.3% 46.9%` (mid-gray) | `215 20.2% 65.1%` (lighter gray) | Secondary text, placeholders |
| `--border` | `214.3 31.8% 91.4%` (light blue-gray) | `217.2 32.6% 17.5%` (dark blue-gray) | Card borders, dividers |
| `--destructive` | `0 84.2% 60.2%` (red) | `0 62.8% 30.6%` (dark red) | Error states, validation |

**Accent colors (outside the token system — used inline via Tailwind):**

| Color | Where used | Purpose |
|---|---|---|
| `blue-600` / `blue-700` | Upgrade to Pro CTA button | Primary brand accent — signals action/premium |
| `indigo` (600/500/400) | AgentProgressBar searching stage | Stage identity color |
| `violet` (600/500/400) | AgentProgressBar synthesis stage | Stage identity color |
| `purple` (600/500/400) | AgentProgressBar ranking stage | Stage identity color |
| `green-600` | Pro plan badge text | Positive status signal |
| `amber-50/200/700/800` | Quota error banner | Warning state |
| `#0A66C2` | LinkedIn icon hover | Brand-accurate social color |

**Color strategy assessment:**
The neutral blue-gray palette is professional and trust-building — it reads as "data tool" not "marketing site," which aligns with the Crunchbase/SalesNav inspiration. The `blue-600` Upgrade CTA and the indigo→violet→purple pipeline gradient are the product's only warm color moments — appropriately reserved for the most action-driving and most memorable interactions.

**Opportunity:** `--primary` in light mode is dark navy, making it identical to foreground text. Adding a distinct brand hue (e.g., a mid-blue at ~60% lightness) as `--primary` would give InvestorMatch a more distinctive visual identity and make primary buttons more recognizable without breaking dark mode.

### Typography System

**Font stack (from `app/layout.tsx`):**

| Role | Font | Weights loaded | Variable |
|---|---|---|---|
| Primary / UI | **Plus Jakarta Sans** | 300, 400, 500, 600, 700, 800 | `--font-sans` |
| Monospace / data | **JetBrains Mono** | 400, 500 | `--font-mono` |
| System fallback | `system-ui, sans-serif` | — | — |

**Plus Jakarta Sans** is a geometric sans-serif with humanist warmth — it feels modern and trustworthy without being cold. The 8-weight range gives full typographic expressiveness from light labels to heavy hero text. This is an excellent choice for a data-heavy product that also needs to feel approachable.

**JetBrains Mono** is developer-adjacent — it signals technical precision where used (code snippets, IDs, data values). Currently not heavily used in the UI, but available for check size values, search IDs, or quota counters if visual distinction is needed.

**Type scale in practice (Tailwind classes observed in codebase):**

| Level | Classes | Usage |
|---|---|---|
| Hero / H1 | `text-4xl font-bold` | Landing page headline |
| H2 | `text-2xl font-bold` | Section headers |
| H3 | `text-lg font-semibold` | Card titles, page sub-headers |
| Body base | `text-sm` (14px) | Most UI text — nav labels, form fields, card content |
| Caption / muted | `text-xs text-muted-foreground` | Secondary metadata, timestamps, tooltips |
| Investor name | `text-base font-semibold` | InvestorCard name — slightly elevated from body |

**Typography gap to address:** `fit_reasoning` text currently has no distinct typographic treatment — it renders as standard body text inside the collapsed FitBreakdown. Recommended: `text-sm italic text-muted-foreground` with a `border-l-2 border-primary/30 pl-3` left-accent treatment when surfaced above the fold, signaling it as AI-generated insight distinct from structured data.

### Spacing & Layout Foundation

**Base unit:** 4px (Tailwind's default scale: 1 unit = 4px)

**Spacing rhythm observed across components:**

| Context | Value | Tailwind |
|---|---|---|
| Card internal padding | 20px | `p-5` |
| Card internal spacing between sections | 12px | `space-y-3` |
| Form field vertical spacing | 20px | `space-y-5` |
| Badge gap | 6px | `gap-1.5` |
| Button gap in action bar | 8px | `gap-2` |
| Sidebar width (desktop) | 224px | `w-56` |
| Mobile drawer width | 256px | `w-64` |
| Mobile top bar height | 56px | `h-14` |

**Layout structure:**

```
Desktop (md+):
┌─────────────────────┬──────────────────────────────┐
│ Sidebar (224px)     │ Main content (flex-1)        │
│ fixed, full-height  │ ml-56, full height, scroll   │
└─────────────────────┴──────────────────────────────┘

Mobile (<md):
┌──────────────────────────────────────────────────┐
│ Top bar (56px, fixed, z-40)                      │
├──────────────────────────────────────────────────┤
│ Main content (full width, pt-14)                 │
│ Drawer slides in from left (Framer Motion)       │
└──────────────────────────────────────────────────┘
```

**Border radius:** `--radius: 0.5rem` (8px) — applied to cards, buttons, badges. Consistent rounded feel without being overly playful.

**Density philosophy:** Medium density — InvestorCards at `p-5` with `space-y-3` feel substantial without being cramped. The grid uses responsive columns (1/2/3) to control density by viewport, not by shrinking card content.

### Accessibility Considerations

- **Dark mode:** Implemented via next-themes `attribute="class"`, system-preference aware, `suppressHydrationWarning` prevents flash. All color tokens automatically swap — no manual `dark:` overrides needed on shadcn/ui components.
- **Reduced motion:** AgentProgressBar's `useReducedMotion()` hook disables all canvas animations and Framer Motion transitions for users with vestibular disorders. This is correctly implemented.
- **Focus management:** Radix UI primitives (Dialog/PitchModal, Tooltip, Command/MultiSelect) handle focus trapping and keyboard navigation automatically.
- **Color contrast:** The `--muted-foreground` token at 46.9% lightness on white background is borderline for WCAG AA (4.5:1 minimum). Secondary text labels (form field hints, card metadata) should be verified — using `text-foreground` for critical labels, `text-muted-foreground` only for truly supplementary content.
- **ARIA:** InvestorCard's social links use `aria-label` for icon-only links. The AgentProgressBar stage pills and activity log are visual-only — adding `aria-live="polite"` on the activity log region would announce pipeline progress to screen readers.

---

## Design Direction Decision

### Design Directions Explored

Four high-impact UX improvement opportunities were identified and visualized as current vs. proposed mockups in `ux-design-directions.html`:

| Direction | Focus area | Current state | Proposed change |
|---|---|---|---|
| **A — Intelligence First** | InvestorCard `fit_reasoning` | Hidden in collapsed FitBreakdown accordion | Always visible with blue left-accent, italic typography |
| **B — Progressive Form** | IdeaForm field disclosure | All 6 fields visible on load | Textarea hero; filters behind "Refine search" toggle |
| **C — Milestone Limit** | Quota error framing | Amber warning banner ("Monthly limit reached") | Blue milestone card with progress bar and motivating CTA |
| **D — Accomplished Save** | Save action feedback | Flat text label swap ("Save" → "Saved ✓") | Scale animation + green check + status-colored states |

### Chosen Direction

**All four directions are adopted.** They are additive improvements to distinct components — there are no conflicts between them. Each addresses a separate UX gap identified in the emotional response (Step 4), inspiration analysis (Step 5), and core experience mechanics (Step 7).

The combined effect:
- Direction A surfaces the product's highest-value content by default
- Direction B removes first-impression friction for new users
- Direction C converts the quota wall from a frustrating dead-end into a motivating milestone
- Direction D makes the CRM habit-formation loop feel rewarding from the first save

### Design Rationale

1. **Direction A is the highest-ROI change** — `fit_reasoning` is the feature that makes InvestorMatch intelligent rather than just convenient. Hiding it in an accordion means most users never see the product's differentiating value. An always-visible treatment with a left-border accent and italic styling signals "AI insight" without requiring a click.

2. **Direction B aligns the form with the product's promise** — InvestorMatch's value prop is "describe it, get matched." A form that opens with 6 fields contradicts that simplicity. The textarea-first layout with a collapsible "Refine search" panel delivers simplicity for new users and power for returning ones — from a single conditional render.

3. **Direction C reframes a friction moment as a success moment** — Founders who hit the quota have gotten value from the product. The milestone card acknowledges that, shows exactly where they stand (3/3 with a full progress bar), and frames the upgrade as "continuing momentum" rather than "paying to unlock."

4. **Direction D closes the emotional loop on the core action** — The Save button is the product's most important CTA after "Find Investors." A micro-animation at that moment makes the habit feel rewarding, reduces doubt about whether the click registered, and makes the SavedBoard feel alive when the investor card appears.

### Implementation Priority

| Direction | Estimated effort | Recommended sprint |
|---|---|---|
| A — fit_reasoning above fold | ~30 min (CSS + JSX edit in InvestorCard.tsx) | Next sprint |
| B — Progressive form | ~1 hour (state + conditional render in IdeaForm.tsx) | Next sprint |
| C — Milestone quota card | ~2 hours (new MilestoneCard component) | Next sprint |
| D — Save animation | ~3 hours (Framer Motion + color tokens) | Sprint +1 |

---

## User Journey Flows

### Journey 1: First-Time Founder — Discovery

*A founder with no VC network discovers InvestorMatch, describes their startup, watches the AI pipeline, and saves their first investors.*

```mermaid
flowchart TD
    A([Landing page\n/]) --> B{Signed in?}
    B -- No --> C[HeroSection CTA\n'Get Started Free']
    B -- Yes --> D[Auto-redirect to /dashboard]
    C --> E[Clerk sign-up modal\nEmail or OAuth]
    E --> F[Redirect to /dashboard]
    D --> F

    F --> G{First visit?\nno searches yet}
    G -- Yes --> H[Empty state\n'Find your first investors' CTA]
    G -- No --> I[Search history grid\n+ New Search nav]
    H --> J[/search — IdeaForm]
    I --> J

    J --> K[Textarea: describe startup]
    K --> L{Optional: open\n'Refine search'?}
    L -- No --> M[Submit: POST /searches]
    L -- Yes --> N[Sectors / Stage / Geo / Budget\nmulti-selects + slider]
    N --> M

    M --> O{Quota check}
    O -- Under limit --> P[Redirect to /search/:id\nAgentProgressBar appears]
    O -- Limit hit --> Q[Milestone quota card\nDirection C]
    Q --> R[/pricing upgrade page]

    P --> S[SSE stream opens\nstage: searching]
    S --> T[Animated canvas:\nfloating VC name tags + globe]
    T --> U[stage: synthesis\nconverging dots canvas]
    U --> V[stage: ranking\nanimated score bars]
    V --> W[Pipeline complete]

    W --> X[InvestorGrid renders\nskeletons → real cards]
    X --> Y[Read InvestorCard:\nfit_reasoning visible above fold]
    Y --> Z{Decision}
    Z -- Save --> AA[POST /investors/:id/save\nGreen animation — Direction D]
    Z -- Generate Pitch --> AB[PitchModal opens\nClaude drafts pitch]
    Z -- Social links --> AC[LinkedIn/Twitter/Website\nnew tab]
    Z -- Browse more --> X

    AA --> AD[SavedBoard updated\nkanban pop-in]
    AB --> AE[Read, edit, copy pitch]
    AE --> AF[Send outreach externally]

    style Q fill:#dbeafe,stroke:#93c5fd
    style AA fill:#dcfce7,stroke:#86efac
    style Y fill:#eff6ff,stroke:#bfdbfe
```

**Journey optimizations applied:**
- Direction A: `fit_reasoning` visible at step Y without any click
- Direction B: filters are optional behind "Refine search" at step L
- Direction C: quota wall replaced by milestone card at step Q
- Direction D: green animation fires at step AA

### Journey 2: Returning Founder — Refine & Track

*A founder who has done 1–2 searches returns to run a more targeted search, reviews results against saved investors, and updates their outreach status.*

```mermaid
flowchart TD
    A([/dashboard]) --> B[Stats bar:\nsearches · investors found · saved]
    B --> C[Search history grid]
    C --> D{Goal}
    D -- Run new search --> E[New Search nav\n/search]
    D -- Review saved investors --> F[Saved nav\n/saved — SavedBoard]
    D -- View past results --> G[Click 'View results →'\n/search/:id/results]

    E --> H[IdeaForm\nwith refined description]
    H --> I[Open 'Refine search'\npanel — Direction B]
    I --> J[Set Sector + Stage + Geo\nbased on prior learning]
    J --> K[Submit — POST /searches]
    K --> L[/search/:id\nAgentProgressBar]
    L --> M[Results — InvestorGrid]

    M --> N{Compare with saved?}
    N -- Yes --> O[Check investor status badge\non card: 'Saved ✓']
    N -- No --> P[Read fit_reasoning\nfor new investors]
    O --> P
    P --> Q{Action}
    Q -- New investor: Save --> R[Save + green animation]
    Q -- Already saved: Generate Pitch --> S[PitchModal]
    Q -- Pass --> T[No action — browse on]

    F --> U[4-column Kanban\nSaved / Contacted / Replied / Passed]
    U --> V[Select investor card]
    V --> W[Update status via dropdown]
    W --> X{New status}
    X -- Contacted --> Y[Status → Contacted\nblue badge]
    X -- Replied --> Z[Status → Replied\npurple badge]
    X -- Passed --> AA[Status → Passed\ngray badge]

    Y --> AB[Return to Kanban\nmomentum visible]
    Z --> AB
    AA --> AB
    AB --> AC{Continue?}
    AC -- More updates --> V
    AC -- Done --> A

    G --> AD[Past results page\nread-only InvestorGrid]
    AD --> AE[Save previously unsaved investors]
    AE --> R

    style U fill:#f0fdf4,stroke:#86efac
    style B fill:#eff6ff,stroke:#bfdbfe
    style R fill:#dcfce7,stroke:#86efac
```

**Journey optimizations applied:**
- Dashboard stats bar makes "progress" visible before the founder starts — motivates return
- Saved status badge on InvestorCard prevents re-saving the same investor across searches
- Kanban status update is 1 click (dropdown) — frictionless CRM tracking

### Journey 3: Quota-Hit Founder — Upgrade

*A founder hits the 3-search free limit, sees the milestone card, evaluates Pro, and upgrades — or defers and tracks progress on the SavedBoard instead.*

```mermaid
flowchart TD
    A[IdeaForm submit\n4th search attempt] --> B[POST /searches\n→ 429 QuotaGuard]
    B --> C[Milestone quota card\nDirection C]
    C --> D['3 searches completed this month'\nFull progress bar]
    D --> E{Decision}

    E -- Upgrade --> F[Click 'Upgrade to Pro'\nPOST track: upgrade_clicked]
    E -- Not now --> G[Close / dismiss]
    E -- Review saved investors --> H[/saved — SavedBoard]

    F --> I[/pricing page]
    I --> J[Review Pro plan\nUnlimited searches · $29/mo]
    J --> K{Purchase?}
    K -- Yes --> L[Payment flow\nStripe / payment processor]
    L --> M[Success → redirect\n/dashboard?upgraded=true]
    M --> N[Upgrade success banner\n'Welcome to Pro ✨']
    N --> O[UsageBar removed from sidebar\n'Pro Plan ✓' badge shown]
    O --> P[/search — unlimited IdeaForm]
    P --> Q[Run 4th+ search\nno quota check]

    K -- No → back --> I
    K -- No → exit --> R[/dashboard\nUsageBar shows 3/3 used]

    G --> R
    R --> S[Next month\nquota resets automatically]
    S --> A

    H --> T[Review & update\noutreach statuses]
    T --> U[Continue fundraising\nwithout new searches]
    U --> V{Next month?}
    V -- Yes --> A
    V -- Upgrade later --> F

    style C fill:#dbeafe,stroke:#93c5fd
    style N fill:#dcfce7,stroke:#86efac
    style O fill:#dcfce7,stroke:#86efac
```

**Journey optimizations applied:**
- Milestone card (Direction C) replaces punitive warning — maintains positive framing at the quota wall
- Two meaningful "not now" paths: review SavedBoard or wait for monthly reset
- `?upgraded=true` query param triggers upgrade success banner on dashboard (already implemented)
- Pro badge + sidebar UsageBar removal immediately communicates the plan change

### Journey Patterns

Three patterns appear consistently across all three journeys:

**1. Confirm-then-act** — Every significant action (save, pitch, status update) gives immediate visual confirmation before the user moves on. No ambiguity about whether an action registered.

**2. Always a next action** — At every terminal node in the flows above, there is a clear path forward. The product never leaves the founder at a dead end — even the quota limit has three distinct "what now" paths.

**3. Progress is always visible** — Dashboard stats bar, Kanban columns, sidebar UsageBar, and the quota milestone card all serve the same function: showing the founder that something is happening, that the fundraise is moving.

### Flow Optimization Principles

1. **Minimize steps to first value** — First-time founder journey reaches InvestorCard (value) in 6 steps from landing page. No step is optional complexity.
2. **Progressive trust escalation** — Landing page → free sign-up → 3 free searches → results → upgrade. Each step delivers value before asking for commitment.
3. **Error states are recoverable** — Quota hit → milestone card → two "not now" paths. Pipeline failure → error state + retry. Form validation → inline, non-blocking.
4. **Mobile paths are identical** — All three journeys work on mobile via the Framer Motion drawer. SavedBoard review is the primary mobile use case in Journey 2.

---

## Component Strategy

### Design System Components (shadcn/ui — Production)

All shadcn/ui components are copy-owned in `frontend/components/ui/`. No external runtime dependency.

| Component | Radix primitive | Used in |
|---|---|---|
| `Button` | — | IdeaForm, InvestorCard, PitchModal, SavedBoard |
| `Badge` | — | InvestorCard (sector/stage tags), PlanBadge |
| `Avatar` + `AvatarFallback` + `AvatarImage` | Radix Avatar | InvestorCard, AppLayout sidebar |
| `Textarea` | — | IdeaForm |
| `Dialog` + sub-components | Radix Dialog | PitchModal |
| `Tooltip` + `TooltipProvider` + `TooltipContent` + `TooltipTrigger` | Radix Tooltip | InvestorCard FitScoreRing, AppLayout |
| `Command` + sub-components | Radix Command (cmdk) | MultiSelect |
| `Popover` + sub-components | Radix Popover | MultiSelect |
| `Slider` | Radix Slider | BudgetSlider |
| `Skeleton` | — | InvestorGrid loading state |

### Custom Components (Production — No Changes Required)

| Component | File | Purpose |
|---|---|---|
| `FitScoreRing` | `components/investors/FitScoreRing.tsx` | SVG arc ring displaying fit score (0–100) with color gradient |
| `AgentProgressBar` | `components/search/AgentProgressBar.tsx` | 3-stage SSE-driven pipeline visualization with animated canvases, stage pills, activity log, elapsed timer |
| `InvestorCard` | `components/investors/InvestorCard.tsx` | Full investor card — avatar, fit ring, badges, meta, fit reasoning, actions |
| `FitBreakdown` | `components/investors/FitBreakdown.tsx` | Framer Motion animated dimension bars (sector/stage/budget/geo) |
| `PitchModal` | `components/investors/PitchModal.tsx` | Dialog for AI pitch generation, edit, copy, regenerate |
| `InvestorGrid` | `components/investors/InvestorGrid.tsx` | Responsive paginated grid (1/2/3-col) with skeleton loading |
| `SavedBoard` | `components/saved/SavedBoard.tsx` | 4-column Kanban (saved/contacted/replied/passed) with status mutation |
| `MultiSelect` | `components/search/MultiSelect.tsx` | Popover + Command multi-select (sectors, stages, geo) |
| `BudgetSlider` | `components/search/BudgetSlider.tsx` | Radix Slider wrapper with BUDGET_UNLIMITED constant |
| `ThemeToggle` | `components/layout/ThemeToggle.tsx` | Dark/light mode toggle (next-themes) |
| `PlanBadge` | `components/layout/PlanBadge.tsx` | Free/Pro/Enterprise plan indicator badge |
| `UsageBar` | `components/layout/UsageBar.tsx` | Searches this month / limit progress bar (free tier only) |
| `IdeaForm` | `components/search/IdeaForm.tsx` | 6-field search form with validation and quota error handling |

### New Components (Sprint 7+)

**MilestoneCard** *(Direction C — replaces quota warning banner)*

**Purpose:** Reframe the quota limit as a milestone achievement. Replaces the amber warning banner in IdeaForm.

**Anatomy:** Icon circle · title ("N searches completed this month") · motivating body copy · progress track (`searches_this_month / limit`) · progress label · primary CTA ("Upgrade to Pro ✨") · pricing anchor text.

**States:** `at-limit` (default) — full progress bar, CTA visible. Extendable to `near-limit` (2/3 used) with partial bar and softer prompt.

**Props:**
```typescript
interface MilestoneCardProps {
  used: number;    // searches_this_month
  limit: number;   // FREE_LIMIT (3)
  onUpgrade?: () => void;
}
```

**Accessibility:** `role="status"`, progress bar uses `aria-valuenow` / `aria-valuemax`.

**File:** `components/search/MilestoneCard.tsx`

---

**FitReasoningBlock** *(Direction A — surfaces fit_reasoning above the fold)*

**Purpose:** Display Claude's `fit_reasoning` text with a distinct AI-insight visual treatment — always visible on InvestorCard.

**Anatomy:** "Why this match" label (uppercase, 10px, brand color) · reasoning text (italic, 13px, muted-foreground) · left-border accent (2px, `border-primary/30`) · light blue background tint (`bg-primary/5`).

**States:** Default (visible with text). Null guard: component not rendered if `fit_reasoning` is null.

**Props:**
```typescript
interface FitReasoningBlockProps {
  reasoning: string;
  className?: string;
}
```

**File:** Inline in `InvestorCard.tsx` or extracted as `components/investors/FitReasoningBlock.tsx`.

### Component Modifications (Existing Components)

**`IdeaForm.tsx`** *(Direction B — progressive disclosure)*
Add `showFilters: boolean` state defaulting to `false`. Wrap the 4 optional filter fields in a conditional render. Add a "Refine search" toggle button (`Button variant="outline"` with `SlidersHorizontal` icon) between the textarea and the submit button.

**`InvestorCard.tsx`** *(Direction A + D)*
- Direction A: Insert `FitReasoningBlock` between the meta row and the "Show Fit Details" toggle.
- Direction D: Wrap Save `Button` in Framer Motion `motion.button` with scale animation on `onSuccess`. Update status badge colors: green (saved), blue (contacted), purple (replied), gray (passed). Guard with `useReducedMotion()`.

### Component Implementation Strategy

1. **Modify before creating** — Directions A, B, D are modifications to existing components. Only Direction C (MilestoneCard) and optional FitReasoningBlock extraction require new files.
2. **Tokens over hardcoded values** — All new components use CSS variable tokens (`text-primary`, `bg-primary/5`, `border-primary/30`). Dark mode compatibility is automatic.
3. **Animation is additive** — Framer Motion wraps existing DOM structure without changing it. `useReducedMotion()` guard required on all animation additions.
4. **Minimal prop contracts** — MilestoneCard takes `used` and `limit`. FitReasoningBlock takes `reasoning: string`. Complex orchestration stays in parent components.

### Implementation Roadmap

**Sprint 7 (next sprint):**

| Work item | File | Effort |
|---|---|---|
| Surface `fit_reasoning` above fold | `InvestorCard.tsx` | 30 min |
| Progressive form disclosure | `IdeaForm.tsx` | 1 hour |
| Milestone quota card | `MilestoneCard.tsx` (new) | 2 hours |

**Sprint 8:**

| Work item | File | Effort |
|---|---|---|
| Save animation + status colors | `InvestorCard.tsx` | 3 hours |
| `aria-live` on activity log | `AgentProgressBar.tsx` | 30 min |
| Kanban pop-in animation | `SavedBoard.tsx` | 1 hour |

---

## UX Consistency Patterns

### Button Hierarchy

All interactive actions use a consistent 4-level button hierarchy enforced across every screen.

| Level | Variant | Usage rule |
|---|---|---|
| Primary | `variant="default"` (filled, brand color) | One per screen max — the single most important action (e.g., "Find Investors", "Upgrade to Pro") |
| Brand accent | `variant="default"` with icon | CTA actions that carry emotional weight (e.g., "Generate Pitch") |
| Secondary | `variant="outline"` | Supporting actions that don't compete with primary (e.g., "Save", social links) |
| Ghost | `variant="ghost"` | Tertiary actions, nav links, toggles (e.g., "Show Fit Details", "Refine search") |

**Rule:** Never place two `variant="default"` buttons in the same visual group. The primary action must be visually dominant.

### Feedback Patterns

**Success states:**

| Trigger | Response |
|---|---|
| Investor saved | Button label swaps to `STATUS_LABELS[savedStatus]` (e.g., "Saved ✓"), disabled. No toast. |
| Status updated (Kanban) | Column card moves with Framer Motion spring. No toast. |
| Pitch generated | Modal body replaces loading spinner with rendered markdown. Copy button appears. |
| Search submitted | Router pushes to `/search/[id]`. AgentProgressBar mounts immediately. |

**Error states:**

| Trigger | Response | Pattern |
|---|---|---|
| Form too short | Inline message below textarea: "Please enter at least 20 characters." | Blur-first — only shown after first blur or submit attempt |
| Quota exceeded | MilestoneCard replaces `quotaError` amber banner | Replaces inline error, not a toast |
| Mutation error (save/pitch) | Inline `text-destructive` `<p>` below action area | `saveMutation.isError` guard |
| API generic error | `genericError` state string rendered below form | Non-quota 4xx/5xx errors |

**Loading states:** Button text appends `...` suffix during pending (`isPending`). Skeleton components replace content grids. AgentProgressBar shows 3-stage pipeline with animated SVG canvases.

**Warning states:** Used exclusively for quota milestone (MilestoneCard, blue). Amber reserved for system-level warnings not yet in scope.

**Info states:** Tooltips (`TooltipContent`) for supplemental data (e.g., fit score breakdown on ring hover). No floating info banners.

### Form Patterns

- **Blur-first validation** — Errors appear only after `onBlur` or submit attempt. Never on `onChange`.
- **Character counter** — `{description.trim().length} / {MIN_LENGTH} min` shown live, right-aligned below textarea.
- **Optional field labeling** — All optional fields labeled with `(optional)` in `text-muted-foreground font-normal` span inline with the label.
- **Progressive disclosure (Direction B)** — 4 optional filter fields hidden by default behind "Refine search" toggle. Textarea + submit always visible.
- **Submission state** — Submit button text: `mutation.isPending ? 'Starting search...' : 'Find Investors'`. Button disabled during pending and when validation fails after first touch.
- **Error recovery** — Quota error cleared on successful submission. Generic error cleared on new submission attempt.

### Navigation Patterns

**Desktop sidebar (AppLayout):**
- Active link: `bg-accent text-accent-foreground font-medium`
- Inactive link: `text-muted-foreground hover:text-foreground hover:bg-accent/50`
- UsageBar visible only for free-tier users (hidden for Pro+)
- PlanBadge + ThemeToggle pinned to sidebar bottom

**Mobile (top bar + drawer):**
- Hamburger menu opens Framer Motion `motion.div` drawer (spring animation, `x: -100% → 0`)
- Drawer overlays content; tap-outside or close button dismisses
- Same nav links as desktop sidebar, full-width touch targets
- `useReducedMotion()` guard: drawer appears instantly with no spring when reduced motion preferred

**Back navigation:** Browser default (`router.back()`) used throughout. No custom breadcrumbs.

**External links:** `target="_blank" rel="noopener noreferrer"` on all external anchors (LinkedIn, Twitter, website). Icon-only links include `aria-label`.

### Modal and Overlay Patterns

**PitchModal (Dialog):**
- Three states: `idle` (closed), `loading` (generating spinner + streaming text), `success` (rendered markdown + Copy + Regenerate actions)
- Opened via "Generate Pitch" button on InvestorCard
- Closed via `onClose` prop → `setShowPitch(false)` → Dialog `open={false}`
- Focus returns to trigger button on close (Radix Dialog default behavior)

**Tooltip:** `TooltipProvider` wraps each `InvestorCard` (component-level, not app-level). `TooltipContent` displays fit sub-scores on FitScoreRing hover. Side: `"left"`.

**MultiSelect dropdown:** Popover + Command pattern. Opens on trigger click, closes on outside click or Escape. Selected items shown as comma-separated text in trigger. No "select all" control.

### Empty State Patterns

**Dashboard (no searches yet):** Icon (search/compass) + "No searches yet" title + "Start by describing your startup below" body + single "Find Investors" CTA.

**SavedBoard columns (empty column):** Italic placeholder text (e.g., "No investors saved yet") with no CTA. Column heading still visible.

**Search results (no matches):** "No investors found" heading + "Try adjusting your search criteria" body. No CTA — user scrolls back to form.

### Loading State Patterns

- **Skeleton rules:** InvestorGrid uses `<Skeleton>` cards matching InvestorCard dimensions during initial load. Skeleton count matches expected results-per-page.
- **Button pending text:** All mutation buttons append `...` suffix (`'Saving...'`, `'Starting search...'`, `'Generating...'`). Icon removed during pending state.
- **Pipeline loading:** AgentProgressBar handles all search loading UI. Three named stages (searching → synthesis → ranking) with animated SVG canvases per stage. Elapsed timer counts up. Activity log streams live progress lines.

### Search and Filtering Patterns

- **Description-driven, not query-driven** — The core input is a natural language startup description, not keyword search. The AI extracts intent.
- **Filters as refinement** — Sector, stage, geo, and budget filters narrow AI-generated results. They do not replace the description.
- **Stateless across sessions** — Filters reset to defaults on each new search. No filter persistence in URL or localStorage (current behavior).
- **No manual sort UI** — Results ranked by `fit_score` descending. No user-facing sort control (fit score is the single ranking signal).

---

## Responsive Design & Accessibility

### Responsive Strategy

InvestorMatch is primarily a desktop product — founders research and evaluate investors at a desk, not on the go. The responsive strategy prioritizes information density on large screens and task-focused simplicity on mobile.

**Desktop (1024px+):** Full sidebar navigation always visible. 3-column InvestorGrid for maximum scanning density. IdeaForm with all fields accessible (progressive disclosure optional via Direction B toggle). Full 4-column SavedBoard Kanban.

**Tablet (768px–1023px):** 2-column InvestorGrid. IdeaForm fields stacked (no side-by-side layout). Sidebar collapses to top bar + Framer Motion drawer. SavedBoard Kanban scrolls horizontally across all 4 columns with `overflow-x-auto`.

**Mobile (320px–767px):** Single-column InvestorGrid. IdeaForm progressive disclosure (Direction B) is especially valuable on mobile — textarea is the hero, filters hidden by default behind "Refine search" toggle. Top bar + drawer navigation. SavedBoard is the primary mobile use case (reviewing saved investors between meetings). InvestorCard action buttons stack vertically when viewport is narrow.

**Mobile-first principle:** Tailwind breakpoints applied mobile-first (`sm:`, `md:`, `lg:` prefixes add complexity at larger screens). Base styles always serve mobile.

### Breakpoint Strategy

Tailwind CSS breakpoints (configured in `tailwind.config.ts` — default Tailwind scale):

| Breakpoint | Min width | InvestorMatch layout change |
|---|---|---|
| *(base)* | 320px | 1-col grid, drawer nav, stacked form |
| `md` | 768px | 2-col grid, sidebar collapses |
| `lg` | 1024px | 3-col grid, sidebar always visible |
| `xl` | 1280px | Max content width cap (`max-w-7xl`) |
| `2xl` | 1536px | No layout change — content stays centered |

**Column rules (Tailwind classes):**
- InvestorGrid: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- IdeaForm: single column always (no breakpoint change)
- SavedBoard: `grid-cols-2 md:grid-cols-4`
- AppLayout sidebar: `hidden lg:flex` (drawer replaces on mobile/tablet)

### Accessibility Strategy

**Target compliance: WCAG 2.1 Level AA** — the industry standard for B2B SaaS. Appropriate for InvestorMatch because founders and investors include users with visual impairments, and B2B products face increasing legal scrutiny (ADA, European Accessibility Act 2025).

**Already compliant (existing codebase):**
- `aria-label` on icon-only social links (LinkedIn, Twitter, ExternalLink) in InvestorCard
- `aria-invalid` on Textarea when validation fails (IdeaForm)
- Radix UI primitives (Dialog, Tooltip, Popover, Slider, Command) provide ARIA roles, keyboard navigation, and focus management out of the box
- `useReducedMotion()` guard on all Framer Motion animations (respects OS `prefers-reduced-motion`)
- ThemeProvider `attribute="class"` supports forced-colors / high-contrast mode via CSS
- `rel="noopener noreferrer"` on all external links

**Gaps to address (Sprint 7+):**

| Gap | Recommended fix |
|---|---|
| AgentProgressBar activity log not announced to screen readers | `aria-live="polite"` on activity log container |
| FitScoreRing SVG has no accessible label | `<title>` element inside SVG + `aria-labelledby` on `<svg>` |
| MultiSelect missing `aria-multiselectable` | Add to Radix Command trigger wrapper |
| MilestoneCard progress bar (new component) | `role="progressbar"` + `aria-valuenow` + `aria-valuemax` from component spec |
| Focus indicator audit | Verify `focus-visible:ring-2 focus-visible:ring-ring` on all interactive elements |

**Color contrast requirements:**
- Light mode `--foreground` on `--background` (near-black on white): passes AA at 21:1
- `--muted-foreground` (gray) on `--background`: audit required — must meet 4.5:1 for normal text, 3:1 for large text
- Badge text (`text-xs`, 12px): requires 4.5:1 (small text standard)
- FitScoreRing gradient (green/yellow/red): color is not the only signal — score number rendered inside ring satisfies non-color requirement

### Testing Strategy

**Responsive testing:**
- Chrome DevTools device emulation for breakpoint verification during development
- Real-device: iPhone (Safari Mobile) and iPad (Safari) before each sprint release
- Cross-browser: Chrome, Firefox, Safari, Edge — all latest stable
- Network: Throttle to "Slow 3G" to verify AgentProgressBar SSE stream on poor connections

**Accessibility testing:**
- **Automated:** `eslint-plugin-jsx-a11y` for static analysis in Next.js config
- **Screen reader:** VoiceOver (macOS/iOS) primary; NVDA (Windows) secondary validation
- **Keyboard-only:** Tab through complete user journey: IdeaForm → search results → InvestorCard → save → SavedBoard status update
- **Color blindness:** Browser extension (e.g., Colorblindly) on FitScoreRing gradient — verify score number is legible without color
- **Reduced motion:** Toggle OS `prefers-reduced-motion: reduce` and verify all Framer Motion animations become instant

### Implementation Guidelines

**Responsive development:**
- Use Tailwind responsive prefixes (`md:`, `lg:`) exclusively — no inline styles or CSS media queries outside `globals.css`
- Touch targets: minimum 44×44px on mobile. `Button size="sm"` (36px tall) needs `py-2` padding increase on mobile or upgrade to `size="default"` at `sm:` breakpoint
- SavedBoard horizontal scroll: `overflow-x-auto` wrapper + `-webkit-overflow-scrolling: touch` for iOS momentum scrolling
- If `AvatarImage` is added later: use `next/image` with `sizes` prop for optimized delivery

**Accessibility development:**
- Semantic heading hierarchy: `<h1>` page title, `<h2>` section headings, `<h3>` InvestorCard names — never skip levels
- Skip link: Add `<a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-50 ...">Skip to main content</a>` at top of AppLayout
- Every `<form>` element has an associated `<label>` (IdeaForm already compliant — explicit labels with `htmlFor`)
- Focus management: PitchModal (Radix Dialog) automatically returns focus to trigger on close — no manual management needed
- `aria-live` regions: activity log in AgentProgressBar, quota error state transitions
- Never suppress focus outlines — replace `:focus` with `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2` (already in shadcn/ui button styles)
- External link disclosure: consider adding visually hidden " (opens in new tab)" text for screen reader users on social links
