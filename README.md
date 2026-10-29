# Fuel Lab — Macro-Aware Recipe Box for Endurance Runners

**Live application:** [paceplate-macro-guide.lovable.app](https://paceplate-macro-guide.lovable.app)

*(Open the [live demo](https://paceplate-macro-guide.lovable.app/demo) with no signup — sample analyses, a demo recipe box, and a capped live recipe-URL analysis.)*

---

## The problem

Marathon and endurance training places rigorous metabolic demands on the body. Sports nutrition research recommends that endurance athletes eat roughly **5–10 g of carbohydrates** and **1.2–2.0 g of protein per kilogram of body weight per day**, scaling with training volume *(Academy of Nutrition and Dietetics, Dietitians of Canada & ACSM, 2016)*.

Meeting those targets means constantly checking recipes against daily macros — and most cooking sites bury nutrition in a footnote, or skip it entirely.

**Fuel Lab removes the mental math:**

1. **Paste any recipe link** — the page is scraped to markdown and an LLM extracts ingredients, preparation time, servings, and dish type.
2. **Macro estimation** — every ingredient is matched against **USDA FoodData Central** (with an AI fallback for unmatched foods) to compute per-serving protein, carbs, fat, fiber, and calories.
3. **Protein density metric** — grams of protein per 100 kcal, so runners can balance high-carb recovery meals against lean protein.
4. **Weight-based daily goals** — enter your weight and training load to see personalized protein and carbohydrate ranges (computed locally; weight is never stored).
5. **Weekly planner** — a recipe with 4 servings becomes 4 per-serving cards you can drag across a 7-day board, with per-day protein/carb totals.

## How it works

```
Recipe URL → Firecrawl scrape (markdown) → LLM structured extraction
          → USDA FoodData Central lookup per ingredient (AI fills gaps)
          → per-serving macros + protein-per-100-kcal
          → private recipe box (categories: breakfast / mains / sides / snacks)
          → drag servings onto a weekly plan
```

## Tech stack

- **Framework**: [TanStack Start](https://tanstack.com/start) + [TanStack Router](https://tanstack.com/router) — full-stack React 19 with SSR, file-based routing, and strict type safety
- **Data & state**: [TanStack Query](https://tanstack.com/query) + type-safe server functions (`createServerFn`)
- **Backend**: PostgreSQL with Row Level Security (owner-scoped tables), managed auth, and service-role server functions
- **Ingestion pipeline**: Firecrawl page extraction → LLM structured parsing (Gemini via an OpenAI-compatible gateway) → USDA FoodData Central nutrition matching with AI fallback for unmatched ingredients
- **Demo quota**: guest live analyses are capped server-side in a database counter (`demo_usage` + a service-role RPC), so clearing browser storage can't bypass the limit
- **Styling**: Tailwind CSS v4 design system with Radix UI primitives

## Privacy & cost controls

- Saved recipes are visible **only to their owner** (Row Level Security on every table).
- The public demo is read-mostly: pre-analyzed samples plus a small daily allowance of live analyses, enforced server-side.
- API keys (USDA, Firecrawl) are stored as encrypted app secrets, never in the repository.

## Run it locally

```bash
# Clone the repository
git clone https://github.com/jds0uza/fuel-your-run-recipes.git
cd fuel-your-run-recipes

# Install dependencies
npm install

# Start the dev server with HMR
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173).

### Production build

```bash
npm run build
npm run preview
```

---

## Testing

`src/lib/nutrition-goals.test.ts` covers the weight-based goal math (protein 1.2–2.0 g/kg, carbohydrate ranges per training load, lb↔kg conversion, invalid input). Run it with `bun test`.

## Built with

This app was built with [Lovable](https://lovable.dev), which generated the TanStack Start + edge-runtime foundation; the recipe pipeline, planner, demo quota, and nutrition model were built iteratively in the Lovable editor and kept in two-way Git sync with this repository.
