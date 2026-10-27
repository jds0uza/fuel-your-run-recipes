# Roadmap

## Open tasks

1. **Publish the app publicly** so it's live 24/7 at its own address (user asked for always-available sharing; public so recruiters can open it without a Lovable login).
2. **Public demo walkthrough** (`/demo`, no signup): pre-analyzed sample recipes, localStorage-only demo box, and live URL analyses capped server-side at 25/day globally (demo_usage table + increment_demo_usage RPC, service-role only). Explains the pipeline as it goes.
3. **Rewrite README.md for recruiters**: what it does, the pipeline (Firecrawl scrape → AI extraction → USDA macros → private per-user storage), stack, how to run locally.
4. **Verify demo + landing in preview, then publish** and share the URL.
5. **Weekly planner** (`/planner`, signed-in): 7 day columns; dragging a recipe onto a day inserts one serving card per serving (meal_plan_entries, one row per serving); servings draggable between days; per-day and per-week protein/carb/kcal totals. Verify in preview with a signed-in session.

## Done (earlier)

- Recipe box: URL → scrape → parse → USDA-first macros → private save, category filters.
- Daily goals section on home page (weight-based protein/carb ranges, tested).
- USDA_API_KEY stored as encrypted app secret.
