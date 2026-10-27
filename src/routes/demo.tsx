import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Clock, Database, FlaskConical, Link2, Loader2, Sparkles, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { MacroSplitBar, MacroStats, ProteinRatioBadge } from "@/components/recipe/MacroStats";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DEMO_RECIPES } from "@/lib/demo-recipes";
import { analyzeDemoRecipeUrl } from "@/lib/demo.functions";
import { CATEGORIES, type Category, type Recipe } from "@/lib/recipes.functions";

export const Route = createFileRoute("/demo")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Live demo — Fuel Lab" },
      {
        name: "description",
        content:
          "Walk through Fuel Lab without an account: sample macro analyses, a demo recipe box, and a live recipe-URL analysis.",
      },
      { property: "og:title", content: "Live demo — Fuel Lab" },
      {
        property: "og:description",
        content: "Try the macro-aware recipe box: sample analyses and a live URL analysis, no signup.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DemoPage,
});

const LABELS: Record<Category, string> = {
  breakfast: "Breakfast",
  main: "Mains",
  side: "Sides",
  snack: "Snacks",
};

const BOX_KEY = "fuel-lab-demo-box";
const LIMIT_MESSAGE = "Daily demo limit reached";

type Draft = Awaited<ReturnType<typeof analyzeDemoRecipeUrl>>["draft"];

function draftToRecipe(draft: Draft): Recipe {
  return {
    ...draft,
    id: `demo-live-${Date.now()}`,
    notes: null,
    created_at: new Date().toISOString(),
  };
}

function DemoPage() {
  const analyze = useServerFn(analyzeDemoRecipeUrl);

  const [box, setBox] = useState<Recipe[]>([]);
  const [limitReached, setLimitReached] = useState(false);
  const [filter, setFilter] = useState<Category | "all">("all");
  const [url, setUrl] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [coverage, setCoverage] = useState<{ matched: number; total: number } | null>(null);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(BOX_KEY);
      if (saved) setBox(JSON.parse(saved) as Recipe[]);
    } catch {
      // Corrupted or unavailable storage — start with an empty demo box.
    }
  }, []);

  function persistBox(next: Recipe[]) {
    setBox(next);
    try {
      window.localStorage.setItem(BOX_KEY, JSON.stringify(next));
    } catch {
      // Storage full or blocked — the box still works for this session.
    }
  }

  const analyzing = useMutation({
    mutationFn: (value: string) => analyze({ data: { url: value } }),
    onSuccess: (result) => {
      setDraft(result.draft);
      setCoverage(result.coverage);
      const used = analysesUsed + 1;
      setAnalysesUsed(used);
      try {
        window.localStorage.setItem(ANALYSES_KEY, String(used));
      } catch {
        // Non-critical: the counter just resets next visit.
      }
    },
    onError: (error: Error) => toast.error(error.message || "Couldn't read that recipe page."),
  });

  const analysesLeft = Math.max(0, MAX_LIVE_ANALYSES - analysesUsed);
  const filteredBox = box.filter((r) => filter === "all" || r.category === filter);

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/70">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link to="/" className="font-display text-2xl">
            FUEL LAB
          </Link>
          <Button asChild variant="outline" size="sm">
            <Link to="/auth">Sign in</Link>
          </Button>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-10">
        <section className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">
            2-minute demo · no account needed
          </p>
          <h1 className="mt-3 text-4xl leading-[0.95] sm:text-5xl">
            See how a recipe becomes a macro plan
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Below are three recipes already run through the pipeline, a demo recipe box you can file
            them into, and a live analysis you can run on any recipe URL.
          </p>
        </section>

        <section className="mt-10 grid gap-4 sm:grid-cols-3">
          {[
            {
              icon: Link2,
              step: "1",
              title: "Paste a recipe URL",
              body: "The page is scraped to markdown — ingredients, timings, servings and dish type.",
            },
            {
              icon: Sparkles,
              step: "2",
              title: "AI reads the recipe",
              body: "A language model extracts structured ingredients with estimated gram weights.",
            },
            {
              icon: FlaskConical,
              step: "3",
              title: "Macros from USDA data",
              body: "Each ingredient is matched to USDA FoodData Central; AI fills any gaps. Per-serving protein, carbs and protein-per-100-kcal come out the other side.",
            },
          ].map((item) => (
            <div key={item.step} className="rounded-xl border border-border bg-card p-5 shadow-card">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {item.step}
                </span>
                <item.icon className="h-5 w-5 text-primary" aria-hidden />
              </div>
              <h2 className="mt-3 text-xl">{item.title}</h2>
              <p className="mt-1.5 text-sm text-muted-foreground">{item.body}</p>
            </div>
          ))}
        </section>

        <section className="mt-12">
          <h2 className="text-2xl">Sample analyses</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            What the signed-in app shows after analyzing a URL. Add any of these to your demo box.
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {DEMO_RECIPES.map((recipe) => (
              <article
                key={recipe.id}
                className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5 shadow-card"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-xl leading-tight">{recipe.title}</h3>
                  <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-xs font-semibold">
                    {LABELS[recipe.category]}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  {recipe.total_minutes !== null && (
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" /> {recipe.total_minutes} min
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" /> {recipe.servings}
                  </span>
                </div>
                <ProteinRatioBadge ratio={recipe.protein_per_100kcal} />
                <MacroStats {...recipe} compact />
                <MacroSplitBar {...recipe} />
                <Button
                  variant="secondary"
                  size="sm"
                  className="mt-auto"
                  disabled={box.some((r) => r.id === recipe.id)}
                  onClick={() => {
                    persistBox([recipe, ...box]);
                    toast.success(`Added to your demo box under ${LABELS[recipe.category]}`);
                  }}
                >
                  {box.some((r) => r.id === recipe.id) ? "In your demo box" : "Add to demo box"}
                </Button>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-12 rounded-xl border border-primary/40 bg-card p-6 shadow-glow">
          <h2 className="text-2xl">Try it live</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Paste a real recipe URL and watch the full pipeline run.{" "}
            {analysesLeft > 0 ? (
              <>
                You have <strong>{analysesLeft}</strong> of {MAX_LIVE_ANALYSES} live analyses left in
                this browser.
              </>
            ) : (
              <>You've used your {MAX_LIVE_ANALYSES} live analyses — sign up to keep going.</>
            )}
          </p>
          <form
            className="mt-4 flex flex-col gap-3 sm:flex-row"
            onSubmit={(e) => {
              e.preventDefault();
              if (url.trim() && analysesLeft > 0) analyzing.mutate(url.trim());
            }}
          >
            <Input
              type="url"
              required
              placeholder="https://example.com/high-protein-oatmeal"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="flex-1"
              disabled={analysesLeft === 0}
            />
            <Button type="submit" disabled={analyzing.isPending || analysesLeft === 0}>
              {analyzing.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing
                </>
              ) : (
                "Analyze recipe"
              )}
            </Button>
          </form>
          {analyzing.isPending && (
            <p className="mt-3 text-xs text-muted-foreground">
              Scraping the page, extracting ingredients, matching USDA foods — up to a minute.
            </p>
          )}

          {draft && (
            <div className="mt-6 rounded-lg border border-border bg-background p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h3 className="text-2xl">{draft.title}</h3>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                    {draft.dish_type && <span>{draft.dish_type}</span>}
                    {draft.total_minutes !== null && (
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" /> {draft.total_minutes} min total
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" /> {draft.servings} servings
                    </span>
                  </div>
                </div>
                <ProteinRatioBadge ratio={draft.protein_per_100kcal} />
              </div>
              <div className="mt-4 space-y-3">
                <MacroStats {...draft} />
                <MacroSplitBar {...draft} />
                <p className="text-xs text-muted-foreground">
                  Per serving · {draft.nutrition_source}
                  {coverage
                    ? ` · ${coverage.matched}/${coverage.total} ingredients matched in USDA`
                    : ""}
                </p>
              </div>
              <div className="mt-4 flex gap-2">
                <Button
                  onClick={() => {
                    persistBox([draftToRecipe(draft), ...box]);
                    toast.success(`Saved to your demo box under ${LABELS[draft.category]}`);
                    setDraft(null);
                    setCoverage(null);
                    setUrl("");
                  }}
                >
                  Save to demo box
                </Button>
                <Button variant="ghost" onClick={() => setDraft(null)}>
                  Discard
                </Button>
              </div>
            </div>
          )}
        </section>

        <section className="mt-12">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="inline-flex items-center gap-2 text-2xl">
              <Database className="h-5 w-5 text-primary" aria-hidden /> Your demo box
            </h2>
            <Tabs value={filter} onValueChange={(v) => setFilter(v as Category | "all")}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                {CATEGORIES.map((c) => (
                  <TabsTrigger key={c} value={c}>
                    {LABELS[c]}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Stored only in this browser — the real app saves recipes privately to your account.
          </p>
          {filteredBox.length === 0 ? (
            <p className="mt-5 rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              Empty so far. Add a sample above or run a live analysis.
            </p>
          ) : (
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {filteredBox.map((recipe) => (
                <article
                  key={recipe.id}
                  className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5 shadow-card"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-xl leading-tight">{recipe.title}</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => persistBox(box.filter((r) => r.id !== recipe.id))}
                    >
                      Remove
                    </Button>
                  </div>
                  <span className="w-fit rounded-full bg-secondary px-2 py-0.5 text-xs font-semibold">
                    {LABELS[recipe.category]}
                  </span>
                  <ProteinRatioBadge ratio={recipe.protein_per_100kcal} />
                  <MacroStats {...recipe} compact />
                  <MacroSplitBar {...recipe} />
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="mt-12 rounded-xl border border-border bg-card p-8 text-center shadow-card">
          <h2 className="text-3xl">Want your own recipe box?</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Create a free account to save recipes privately, keep them across devices, and analyze as
            many URLs as you like.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <Link to="/auth">Create my account</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/">Back to home</Link>
            </Button>
          </div>
        </section>
      </div>
    </main>
  );
}
