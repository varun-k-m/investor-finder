# Story S6-002 — Enriched Landing Page

**Epic:** 6 — UI Enrichment  
**Points:** 3  
**Agent:** FE Dev  
**Depends on:** S6-001 (ThemeProvider, Framer Motion, Badge)

---

## Goal

Replace the current minimal landing page (`app/page.tsx`) with a rich, conversion-optimised page. Sections: sticky nav, hero with animated gradient CTA, how-it-works steps, social proof strip, pricing teaser, and footer. Fully responsive from 375px.

---

## Acceptance Criteria

1. All five sections render correctly on mobile, tablet, and desktop.
2. Hero CTA ("Find My Investors →") leads to Clerk sign-in modal — same as today.
3. "How it works" section shows 4 numbered steps with icons.
4. Social proof section shows at least 3 placeholder founder quotes.
5. Pricing teaser links to `/pricing`.
6. Page respects dark mode — no hardcoded colours.
7. Framer Motion entrance animations respect `prefers-reduced-motion`.

---

## Page Structure

```
<LandingPage>
  <StickyNav />          ← logo left, Sign in right, blurs on scroll
  <HeroSection />        ← gradient bg, headline, sub, CTA, animated badge
  <HowItWorks />         ← 4 steps: Describe → Discover → Rank → Pitch
  <SocialProof />        ← 3 founder quote cards
  <PricingTeaser />      ← Free vs Pro feature comparison strip + upgrade CTA
  <Footer />             ← links, copyright
</LandingPage>
```

---

## Component Details

### `HeroSection`
- Full-width gradient background: `from-background via-primary/5 to-background`
- Animated pill badge: "AI-Powered · Real-time · Personalised"
- H1: "Find the right investors for your startup — fast."
- Sub: existing copy
- Primary CTA button (large): "Find My Investors →"
- Secondary ghost link: "See how it works ↓" (smooth-scrolls to HowItWorks)
- Framer Motion: fade-up stagger on badge → h1 → p → buttons

### `HowItWorks`
Four steps in a horizontal row (stacks vertically on mobile):

| # | Icon | Title | Description |
|---|------|-------|-------------|
| 1 | `Search` (lucide) | Describe your idea | Tell us your startup, sector, stage, and how much you're raising |
| 2 | `Zap` | AI discovery | Our agent searches Crunchbase, AngelList, and the open web in parallel |
| 3 | `BarChart2` | Fit scoring | Every investor ranked by sector, stage, check size, and geography match |
| 4 | `Mail` | Pitch in one click | Generate a personalised pitch draft for each investor instantly |

Steps connected by a dashed line on desktop.

### `SocialProof`
Three quote cards with avatar placeholder, quote text, founder name, and company. Use placeholder copy — real quotes to be filled in by product team:

> "Found 3 investors who led our seed round — all through InvestorMatch."  
> — Alex T., Founder @ Finstack

Cards in a 3-col grid, subtle border, dark-mode aware.

### `PricingTeaser`
Two-column comparison (Free / Pro) with a short feature list and a prominent "Upgrade to Pro" CTA linking to `/pricing`. Match the styling in `pricing/page.tsx` if that page exists.

---

## Files Changed / Created

- `frontend/app/page.tsx` — full rewrite
- `frontend/components/landing/HeroSection.tsx` (new)
- `frontend/components/landing/HowItWorks.tsx` (new)
- `frontend/components/landing/SocialProof.tsx` (new)
- `frontend/components/landing/PricingTeaser.tsx` (new)
