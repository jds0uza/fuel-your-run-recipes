import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Clock, ExternalLink, Loader2, LogOut, Trash2, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { MacroSplitBar, MacroStats, ProteinRatioBadge } from "@/components/recipe/MacroStats";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import {
  CATEGORIES,
  analyzeRecipeUrl,
  deleteRecipe,
  listRecipes,
  saveRecipe,
  updateRecipeCategory,
  type Category,
  type Recipe,
} from "@/lib/recipes.functions";

export const Route = createFileRoute("/_authenticated/recipes")({
  head: () => ({
    meta: [
      { title: "My recipe box — Fuel Lab" },
      {
        name: "description",
        content: "Your saved recipes with per-serving protein, carbs and protein-per-calorie.",
      },
      { property: "og:title", content: "My recipe box — Fuel Lab" },
      { property: "og:description", content: "Saved recipes with per-serving macros for training." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RecipesPage,
});

const LABELS: Record<Category, string> = {
  breakfast: "Breakfast",
  main: "Mains",
  side: "Sides",
  snack: "Snacks",
};

type Draft = Awaited<ReturnType<typeof analyzeRecipeUrl>>["draft"];

function RecipesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const analyze = useServerFn(analyzeRecipeUrl);
  const save = useServerFn(saveRecipe);
  const remove = useServerFn(deleteRecipe);
  const recategorize = useServerFn(updateRecipeCategory);
  const load = useServerFn(listRecipes);

  const [url, setUrl] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [coverage, setCoverage] = useState<{ matched: number; total: number } | null>(null);
  const [filter, setFilter] = useState<Category | "all">("all");

  const recipes = useQuery({ queryKey: ["recipes"], queryFn: () => load({}) });

  const analyzing = useMutation({
    mutationFn: (value: string) => analyze({ data: { url: value } }),
    onSuccess: (result) => {
      setDraft(result.draft);
      setCoverage(result.coverage);
    },
    onError: (error: Error) => toast.error(error.message || "Couldn't read that recipe page."),
  });

  const saving = useMutation({
    mutationFn: (value: Draft) => save({ data: { ...value, notes: null } }),
    onSuccess: () => {
      toast.success("Saved to your recipe box");
      setDraft(null);
      setCoverage(null);
      setUrl("");
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
    },
    onError: (error: Error) => toast.error(error.message || "Couldn't save that recipe."),
  });

  const deleting = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["recipes"] }),
    onError: () => toast.error("Couldn't delete that recipe."),
  });

  const moving = useMutation({
    mutationFn: (input: { id: string; category: Category }) => recategorize({ data: input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["recipes"] }),
    onError: () => toast.error("Couldn't change the category."),
  });

  const list = (recipes.data ?? []).filter((r) => filter === "all" || r.category === filter);

  async function signOut() {
    await supabase.auth.signOut();
    queryClient.clear();
    navigate({ to: "/" });
  }

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/70">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link to="/" className="font-display text-2xl">
            FUEL LAB
          </Link>
          <Button variant="ghost" size="sm" onClick={signOut}>
            <LogOut className="mr-1.5 h-4 w-4" /> Sign out
          </Button>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-10">
        <section className="rounded-xl border border-border bg-card p-6 shadow-card">
          <h1 className="text-3xl">Add a recipe</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Paste a recipe page link. We read the ingredients and estimate per-serving macros from USDA
            food data.
          </p>
          <form
            className="mt-4 flex flex-col gap-3 sm:flex-row"
            onSubmit={(e) => {
              e.preventDefault();
              if (url.trim()) analyzing.mutate(url.trim());
            }}
          >
            <Input
              type="url"
              required
              placeholder="https://example.com/high-protein-oatmeal"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={analyzing.isPending}>
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
              Reading the page, matching ingredients to USDA foods — this takes up to a minute.
            </p>
          )}
        </section>

        {draft && (
          <section className="mt-6 rounded-xl border border-primary/40 bg-card p-6 shadow-glow">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-primary">Preview</p>
                <h2 className="mt-1 text-2xl">{draft.title}</h2>
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
                {coverage ? ` · ${coverage.matched}/${coverage.total} ingredients matched in USDA` : ""}
              </p>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-[200px_1fr] sm:items-end">
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select
                  value={draft.category}
                  onValueChange={(value) => setDraft({ ...draft, category: value as Category })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {LABELS[c]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => saving.mutate(draft)} disabled={saving.isPending}>
                  {saving.isPending ? "Saving…" : "Save recipe"}
                </Button>
                <Button variant="ghost" onClick={() => setDraft(null)}>
                  Discard
                </Button>
              </div>
            </div>

            <details className="mt-5">
              <summary className="cursor-pointer text-sm font-semibold">
                Ingredients ({draft.ingredients.length})
              </summary>
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                {draft.ingredients.map((ing, i) => (
                  <li key={i}>
                    {ing.raw}
                    {ing.grams !== null && <span className="text-xs"> · ~{Math.round(ing.grams)}g</span>}
                  </li>
                ))}
              </ul>
            </details>
          </section>
        )}

        <section className="mt-10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-2xl">My recipe box</h2>
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

          {recipes.isLoading ? (
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Skeleton className="h-48" />
              <Skeleton className="h-48" />
            </div>
          ) : list.length === 0 ? (
            <p className="mt-5 rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              Nothing here yet. Paste a recipe link above to build your first entry.
            </p>
          ) : (
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {list.map((recipe) => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  onDelete={() => deleting.mutate(recipe.id)}
                  onCategory={(category) => moving.mutate({ id: recipe.id, category })}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function RecipeCard({
  recipe,
  onDelete,
  onCategory,
}: {
  recipe: Recipe;
  onDelete: () => void;
  onCategory: (category: Category) => void;
}) {
  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-card">
      {recipe.image_url && (
        <img
          src={recipe.image_url}
          alt={recipe.title}
          loading="lazy"
          className="h-40 w-full object-cover"
        />
      )}
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-xl leading-tight">{recipe.title}</h3>
          <Button variant="ghost" size="icon" onClick={onDelete} aria-label="Delete recipe">
            <Trash2 className="h-4 w-4" />
          </Button>
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
          {recipe.dish_type && <span>{recipe.dish_type}</span>}
        </div>

        <ProteinRatioBadge ratio={recipe.protein_per_100kcal} />
        <MacroStats {...recipe} compact />
        <MacroSplitBar {...recipe} />

        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          <Select value={recipe.category} onValueChange={(v) => onCategory(v as Category)}>
            <SelectTrigger className="h-8 w-[130px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {LABELS[c]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {recipe.source_url && (
            <a
              href={recipe.source_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              Source <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
