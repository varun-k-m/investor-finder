# Story S6-003 — Structured IdeaForm + Budget Slider + Backend DTO

**Epic:** 6 — UI Enrichment  
**Points:** 5  
**Agent:** FE Dev + Dev  
**Depends on:** S6-001 (Slider, Select, Command, Badge shadcn components)

---

## Goal

Replace the single-textarea `IdeaForm` with a structured multi-field form. Add five optional fields: sector multi-select, stage multi-select, geography multi-select, and a dual-handle budget range slider. Update the backend `CreateSearchDto` and `IdeaParserService` to accept and use these fields.

---

## Acceptance Criteria

1. Form has six fields: description textarea, sector multi-select, stage multi-select, geography multi-select, budget range slider, and submit button.
2. All new fields are optional — form is valid with only a description (≥ 20 chars).
3. Selected values render as removable Badge chips inside each field.
4. Budget slider shows a dual handle for min/max; displays formatted label (e.g. "$50K – $500K").
5. On submit, all populated fields are sent to `POST /searches` alongside `raw_input`.
6. Backend `CreateSearchDto` accepts the new optional fields without validation errors.
7. `IdeaParserService.parse()` receives and passes structured overrides to the Claude prompt.
8. Search row in DB stores structured fields correctly.

---

## Frontend Implementation

### Form Fields

**Description** (existing, unchanged):
- `<Textarea>` rows={5}, min 20 chars, character counter

**Sectors** (multi-select combobox):
- Component: `<Command>` inside a `<Popover>` trigger
- Options: Fintech, SaaS, HealthTech, EdTech, CleanTech, Consumer, DeepTech, E-commerce, MarketPlace, Web3, Other
- Selected values shown as `<Badge variant="secondary">` chips with `×` to remove
- Placeholder: "Select sectors (optional)"

**Stage** (multi-select):
- Same pattern as sectors
- Options: Pre-seed, Seed, Series A, Series B, Growth
- Maps to values: `pre_seed`, `seed`, `series_a`, `series_b`, `growth`

**Geography** (multi-select):
- Options: USA, Europe, UK, India, Southeast Asia, LATAM, Africa, Global
- Placeholder: "Select geographies (optional)"

**Budget Range Slider**:
- Component: `<BudgetSlider />` (new, wraps shadcn `Slider`)
- Dual handle: `[min, max]`
- Range: $0 – $10M, step $50K
- Display: formatted label above slider — "$100K – $2M" or "Up to $500K" if min = 0
- Maps to `budget_min` and `budget_max` in USD integers
- When untouched, sends `undefined` (omits from payload)

### `BudgetSlider` component

```tsx
// components/search/BudgetSlider.tsx
interface BudgetSliderProps {
  value: [number, number];
  onChange: (value: [number, number]) => void;
}
```

Format helper:
```typescript
function formatBudget(usd: number): string {
  if (usd >= 1_000_000) return `$${(usd / 1_000_000).toFixed(1)}M`;
  if (usd >= 1_000) return `$${(usd / 1_000).toFixed(0)}K`;
  return `$${usd}`;
}
```

### Form State (`IdeaForm.tsx`)

```typescript
const [description, setDescription] = useState('');
const [sectors, setSectors] = useState<string[]>([]);
const [stages, setStages] = useState<string[]>([]);
const [geoFocus, setGeoFocus] = useState<string[]>([]);
const [budget, setBudget] = useState<[number, number] | null>(null);
```

Payload construction:
```typescript
const payload: CreateSearchBody = {
  raw_input: description.trim(),
  ...(sectors.length > 0 && { sectors }),
  ...(stages.length > 0 && { stages }),
  ...(geoFocus.length > 0 && { geo_focus: geoFocus }),
  ...(budget !== null && budget[0] > 0 && { budget_min: budget[0] }),
  ...(budget !== null && budget[1] > 0 && { budget_max: budget[1] }),
};
```

---

## Backend Implementation

### `create-search.dto.ts`

```typescript
import { IsString, IsOptional, IsArray, IsNumber, MinLength, Min } from 'class-validator';

export class CreateSearchDto {
  @IsString()
  @MinLength(20)
  raw_input: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  sectors?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  stages?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  geo_focus?: string[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  budget_min?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  budget_max?: number;
}
```

### `searches.service.ts` — persist structured fields

When creating the search entity, map the DTO fields onto the `Search` entity columns (`sectors`, `stages`, `geo_focus`, `budget_min`, `budget_max`).

Pass them through to `IdeaParserService`:

```typescript
const parsedIdea = await this.ideaParserService.parse(dto.raw_input, {
  sectors: dto.sectors,
  stages: dto.stages,
  geo_focus: dto.geo_focus,
  budget_min: dto.budget_min,
  budget_max: dto.budget_max,
});
```

### `idea-parser.service.ts` — merge overrides

```typescript
async parse(rawInput: string, structured?: Partial<SearchStructuredFields>): Promise<ParsedIdea> {
  const userMessage = structured && Object.values(structured).some(Boolean)
    ? `STRUCTURED_OVERRIDES: ${JSON.stringify(structured)}\n\nFOUNDER DESCRIPTION:\n${rawInput}`
    : rawInput;

  const response = await this.anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 800,
    system: IDEA_PARSER_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userMessage }],
  });

  return JSON.parse(response.content[0].text) as ParsedIdea;
}
```

### Migration

Add a TypeORM migration to add the five new nullable columns to the `searches` table (see architecture.md §4.1).

---

## Files Changed / Created

**Frontend:**
- `frontend/components/search/IdeaForm.tsx` — full rewrite
- `frontend/components/search/BudgetSlider.tsx` (new)
- `frontend/lib/api.ts` — update `CreateSearchBody` type

**Backend:**
- `backend/src/searches/dto/create-search.dto.ts`
- `backend/src/searches/searches.service.ts`
- `backend/src/agents/idea-parser.service.ts`
- `backend/src/database/migrations/XXXX_add_structured_search_fields.ts` (new)
- `backend/src/searches/entities/search.entity.ts` (add new columns)
