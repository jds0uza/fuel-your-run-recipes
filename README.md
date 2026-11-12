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

## Architecture

```text
Browser · React 19 + TanStack Router / Query
│
├── Daily goals → pure weight / training-load calculations
│                (local calculation; body weight is not stored)
│
├── Public demo
│   ├── Sample recipes → demo box + weekly plan → browser localStorage
│   └── Live recipe URL ────────────────────────────────┐
│                                                      │
└── Signed-in recipe box + weekly plan                  │
    └── Authenticated server functions                 │
        ├── Owner-scoped reads / writes                │
        │   └── PostgreSQL + Row Level Security        │
        │       ├── recipes (per-serving nutrition)    │
        │       └── meal_plan_entries (one serving)    │
        └── Live recipe URL ───────────────────────┐   │
                                                  │   │
Server · TanStack Start / Cloudflare Workers       │   │
                                                  │   ▼
                                                  │   Atomic demo quota RPC
                                                  │   (25 attempts / UTC day,
                                                  │    shared by all guests)
                                                  │   │ allowed
                                                  ▼   ▼
                                           Shared analysis pipeline
                                                  │
                         Firecrawl → recipe-page markdown
                                                  │
                         Gemini → structured recipe + ingredient grams
                                                  │
                         USDA → per-100-g nutrition per ingredient
                                                  │
                         AI fallback → unmatched / failed USDA lookups
                                                  │
                         Scale by grams and servings → macros + density
                                                  │
                         Return draft → visitor chooses whether to save
```

The demo and private account share recipe-analysis logic, but not recipe storage. Demo saves and planning stay in the visitor's browser; signed-in saves and planning persist in owner-scoped database tables. Live analysis calls external services from the server using encrypted app secrets.

## Technical decisions

| Decision | Why | Trade-off / boundary |
| --- | --- | --- |
| **USDA first, AI fallback** | Prefer reference nutrition data while supporting ingredients USDA cannot match or requests that fail. Missing foods are deduplicated into one batched AI fallback request. | Food matching uses the first USDA search result; ingredient weights are AI-estimated. Results are estimates, not verified dietary advice. Source and coverage accompany the analysis. |
| **Store macros per serving** | A planned serving can directly contribute protein, carbs, and calories to daily totals without recalculating the original recipe. Protein density is `protein_g / calories × 100`. | Estimates assume evenly divided servings; changing portion size is not modeled. |
| **One planner entry per serving** | Each portion can move independently. Adding a recipe spreads portions over consecutive days from the chosen start day. | The board is a repeating Monday–Sunday week, not a dated calendar: portions wrap after Sunday and can overlap when a recipe has more than seven servings. There are no separate lunch / dinner slots. |
| **Authenticated functions + owner-scoped RLS** | Authentication checks precede private operations, and database policies restrict access to the owner. Ordinary reads and writes use the caller's authenticated database client. | The privileged client is reserved for the public demo quota; it is not used for ordinary recipe or planner access. |
| **Atomic, server-enforced guest quota** | A database RPC increments the daily counter before scraping, preventing browser resets and concurrent requests from bypassing the shared cap. | The cap is **25 live analysis attempts per UTC day across all guests**, not per visitor or per USDA lookup. Failed analyses consume an attempt; counter failures block analysis. Signed-in analysis is outside this cap. |
| **Browser-only demo persistence** | Recruiters can save sample recipes and try planning without signing up or using the USDA key for those interactions. | `localStorage` is browser/device-specific and can be cleared. Guest live URL analysis still uses the app's USDA, scraping, and AI services. |
| **Pure daily-goal calculations** | Separating formulas from controls makes the math independently testable and avoids storing body weight. | Goals are training-based ranges, not an individualized clinical nutrition prescription. |
| **Server-only external-service credentials** | USDA, scraping, and AI calls run on the server; private keys are encrypted app secrets, not repository or browser configuration. | Keeping keys secret does not eliminate usage costs or upstream rate limits. The guest quota bounds attempts, not total service spend. |

### Known limitations and next steps

- Some recipe sites reject scraping; malformed extraction or incomplete ingredient matches can reduce coverage.
- Each usable ingredient currently triggers a USDA lookup; repeat URLs and ingredient matches are not cached.
- Tests cover daily-goal formulas. Broader automated coverage for macro scaling, quota concurrency, and planner distribution would strengthen regression protection.
- Potential next steps: cache repeated analyses, add per-visitor throttling alongside the global quota, and support dated weeks and portion-size adjustments.

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
