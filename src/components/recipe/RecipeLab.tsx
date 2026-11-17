import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Clock, Database, Loader2, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { MacroSplitBar, MacroStats, ProteinRatioBadge } from "@/components/recipe/MacroStats";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DEMO_RECIPES } from "@/lib/demo-recipes";
import { analyzeDemoRecipeUrl } from "@/lib/demo.functions";
import { CATEGORIES, type Category, type Recipe } from "@/lib/recipes.functions";

export const LABELS: Record<Category, string> = {
  breakfast: "Breakfast",
  main: "Mains",
  side: "Sides",
  snack: "Snacks",
};

export const BOX_KEY = "plate-math-box";
const LEGACY_BOX_KEY = "fuel-lab-demo-box";
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

export function RecipeLab() {
  const analyze = useServerFn(analyzeDemoRecipeUrl);

  const [box, setBox] = useState<Recipe[]>([]);
  const [limitReached, setLimitReached] = useState(false);
  const [filter, setFilter] = useState<Category | "all">("all");
  const [url, setUrl] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [coverage, setCoverage] = useState<{ matched: number; total: number } | null>(null);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(BOX_KEY) ?? window.localStorage.getItem(LEGACY_BOX_KEY);
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
    },
    onError: (error: Error) => {
      if (error.message.includes(LIMIT_MESSAGE)) {
        setLimitReached(true);
        toast.info("Today's live demo analyses are all used up.");
      } else {
        toast.error(error.message || "Couldn't read that recipe page.");
      }
    },
  });

  const filteredBox = box.filter((r) => filter === "all" || r.category === filter);

  return (
    <div className="mx-auto max-w-6xl px-6">
      <section className="mt-12">
        <h2 className="text-2xl">Sample analyses</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Add any of these to your recipe box.
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
                  toast.success(`Added to your recipe box under ${LABELS[recipe.category]}`);
                }}
              >
                {box.some((r) => r.id === recipe.id) ? "In your recipe box" : "Add to recipe box"}
              </Button>
            </article>
          ))}
        </div>
      </section>
      <section id="try-it" className="mt-0 rounded-xl border border-primary/40 bg-card p-6 shadow-glow">
        <h2 className="text-2xl">Try it live</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Paste a real recipe URL and watch the full pipeline run.{" "}
          {limitReached ? (
            <>Today's live analyses are all used up — they reset tomorrow.</>
          ) : (
            <>Live analyses are limited each day to keep things fast for everyone.</>
          )}
        </p>
        <form
          className="mt-4 flex flex-col gap-3 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            if (url.trim() && !limitReached) analyzing.mutate(url.trim());
          }}
        >
          <Input
            type="url"
            required
            placeholder="https://example.com/high-protein-oatmeal"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="flex-1"
            disabled={limitReached}
          />
          <Button type="submit" disabled={analyzing.isPending || limitReached}>
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
                  toast.success(`Saved to your recipe box under ${LABELS[draft.category]}`);
                  setDraft(null);
                  setCoverage(null);
                  setUrl("");
                }}
              >
                Save to recipe box
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
            <Database className="h-5 w-5 text-primary" aria-hidden /> Your recipe box
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
          Stored only in this browser.
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
    </div>
  );
}
