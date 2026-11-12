# Roadmap

## Open tasks

- Pin the repository on the GitHub profile (waiting for the user to select it under Customize your pins).

## Done

- Recipe box: URL → scrape → parse → USDA-first macros → private save, category filters.
- Daily goals section on home page (weight-based protein/carb ranges, tested).
- USDA_API_KEY stored as encrypted app secret.
- Public demo walkthrough (`/demo`): sample recipes, localStorage demo box, live analyses capped server-side at 25/day (demo_usage table + increment_demo_usage RPC, service-role only).
- Weekly planner (`/planner`, signed-in): 7-day board, per-serving cards, drag between days, per-day totals. Verified signed-in in preview.
- README rewritten for users (what it does, pipeline, stack, privacy/cost controls, local run).
- README technical decisions added, including storage boundaries, quota semantics, planner behavior, and known trade-offs; the architecture diagram was removed on request.
- README uses users instead of recruiters and links to the GitHub repository and live application.
- GitHub repository description and homepage updated; profile-pinning steps checked against GitHub documentation.
- Published publicly at https://paceplate-macro-guide.lovable.app (security scan clean before publish).
