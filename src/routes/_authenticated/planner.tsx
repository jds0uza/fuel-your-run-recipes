import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CalendarDays, GripVertical, Loader2, LogOut, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import {
  DAYS,
  addRecipeToPlan,
  clearPlan,
  listPlanEntries,
  movePlanEntry,
  removePlanEntry,
  removeRecipeFromPlan,
  type PlanEntry,
} from "@/lib/planner.functions";
import { listRecipes, type Recipe } from "@/lib/recipes.functions";

export const Route = createFileRoute("/_authenticated/planner")({
  head: () => ({
    meta: [
      { title: "Weekly meal plan — Fuel Lab" },
      {
        name: "description",
        content:
          "Drag recipes onto your week: every serving becomes a movable card, and each day adds up protein, carbs and calories.",
      },
      { property: "og:title", content: "Weekly meal plan — Fuel Lab" },
      {
        property: "og:description",
        content: "Plan the week's meals per serving and see daily protein and carb totals.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PlannerPage,
});

type DayTotals = { kcal: number; protein: number; carbs: number; count: number };

function totalsFor(entries: PlanEntry[], day: number): DayTotals {
  const todays = entries.filter((e) => e.day_of_week === day);
  return {
    kcal: todays.reduce((sum, e) => sum + (e.recipe.calories ?? 0), 0),
    protein: todays.reduce((sum, e) => sum + (e.recipe.protein_g ?? 0), 0),
    carbs: todays.reduce((sum, e) => sum + (e.recipe.carbs_g ?? 0), 0),
    count: todays.length,
  };
}

const RECIPE_MIME = "application/x-fuel-lab-recipe";
const ENTRY_MIME = "application/x-fuel-lab-entry";

function PlannerPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const loadPlan = useServerFn(listPlanEntries);
  const loadRecipes = useServerFn(listRecipes);
  const add = useServerFn(addRecipeToPlan);
  const move = useServerFn(movePlanEntry);
  const removeEntry = useServerFn(removePlanEntry);
  const removeRecipe = useServerFn(removeRecipeFromPlan);
  const clear = useServerFn(clearPlan);

  const [dragOverDay, setDragOverDay] = useState<number | null>(null);

  const plan = useQuery({ queryKey: ["plan"], queryFn: () => loadPlan({}) });
  const recipes = useQuery({ queryKey: ["recipes"], queryFn: () => loadRecipes({}) });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["plan"] });

  const adding = useMutation({
    mutationFn: (input: { recipe_id: string; day_of_week: number }) => add({ data: input }),
    onSuccess: (result) => {
      toast.success(`Added ${result.added} serving${result.added === 1 ? "" : "s"} to the week`);
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message || "Couldn't add that recipe."),
  });

  const moving = useMutation({
    mutationFn: (input: { id: string; day_of_week: number }) => move({ data: input }),
    onSuccess: invalidate,
    onError: () => toast.error("Couldn't move that serving."),
  });

  const removing = useMutation({
    mutationFn: (id: string) => removeEntry({ data: { id } }),
    onSuccess: invalidate,
    onError: () => toast.error("Couldn't remove that serving."),
  });

  const removingRecipe = useMutation({
    mutationFn: (recipe_id: string) => removeRecipe({ data: { recipe_id } }),
    onSuccess: invalidate,
    onError: () => toast.error("Couldn't remove that recipe from the plan."),
  });

  const clearing = useMutation({
    mutationFn: () => clear({}),
    onSuccess: () => {
      toast.success("Week cleared");
      invalidate();
    },
    onError: () => toast.error("Couldn't clear the week."),
  });

  const entries = plan.data ?? [];
  const recipeList = recipes.data ?? [];
  const plannedRecipeIds = new Set(entries.map((e) => e.recipe_id));
  const weekTotals = DAYS.reduce(
    (acc, _, day) => {
      const t = totalsFor(entries, day);
      return { kcal: acc.kcal + t.kcal, protein: acc.protein + t.protein, carbs: acc.carbs + t.carbs };
    },
    { kcal: 0, protein: 0, carbs: 0 },
  );

  function handleDrop(day: number, e: React.DragEvent) {
    e.preventDefault();
    setDragOverDay(null);
    const recipeId = e.dataTransfer.getData(RECIPE_MIME);
    const entryId = e.dataTransfer.getData(ENTRY_MIME);
    if (recipeId) adding.mutate({ recipe_id: recipeId, day_of_week: day });
    else if (entryId) moving.mutate({ id: entryId, day_of_week: day });
  }

  async function signOut() {
    await supabase.auth.signOut();
    queryClient.clear();
    navigate({ to: "/" });
  }

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/70">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/" className="font-display text-2xl">
            FUEL LAB
          </Link>
          <nav className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link to="/recipes">Recipe box</Link>
            </Button>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="mr-1.5 h-4 w-4" /> Sign out
            </Button>
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-10">
        <section className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">
              <CalendarDays className="mr-1 inline h-4 w-4" aria-hidden /> Weekly plan
            </p>
            <h1 className="mt-2 text-4xl leading-[0.95]">Plan the week, serving by serving</h1>
            <p className="mt-3 max-w-xl text-muted-foreground">
              Drag a recipe onto a day and it splits into one card per serving — a 4-serving chili
              becomes 4 cards you can spread across lunches and dinners. Each day totals its
              protein and carbs.
            </p>
          </div>
          {entries.length > 0 && (
            <div className="flex items-center gap-4">
              <div className="text-right text-sm">
                <p className="font-semibold uppercase tracking-wider text-muted-foreground">Week total</p>
                <p className="stat-number text-lg">
                  <span className="text-protein">{Math.round(weekTotals.protein)}g protein</span>
                  {" · "}
                  <span className="text-carb">{Math.round(weekTotals.carbs)}g carbs</span>
                  {" · "}
                  {Math.round(weekTotals.kcal)} kcal
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => clearing.mutate()}
                disabled={clearing.isPending}
              >
                <Trash2 className="mr-1.5 h-4 w-4" /> Clear week
              </Button>
            </div>
          )}
        </section>

        <section className="mt-8">
          <h2 className="text-xl">Your recipes</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Drag a card onto any day, or use the + button to add it to Monday and move servings from
            there.
          </p>
          {recipes.isLoading ? (
            <div className="mt-4 flex gap-3">
              <Skeleton className="h-24 w-56" />
              <Skeleton className="h-24 w-56" />
            </div>
          ) : recipeList.length === 0 ? (
            <p className="mt-4 rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">
              No saved recipes yet.{" "}
              <Link to="/recipes" className="font-semibold text-primary underline">
                Add some in your recipe box
              </Link>{" "}
              first.
            </p>
          ) : (
            <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
              {recipeList.map((recipe) => (
                <RecipePaletteCard
                  key={recipe.id}
                  recipe={recipe}
                  planned={plannedRecipeIds.has(recipe.id)}
                  onAdd={() => adding.mutate({ recipe_id: recipe.id, day_of_week: 0 })}
                  onRemove={() => removingRecipe.mutate(recipe.id)}
                />
              ))}
            </div>
          )}
        </section>

        <section className="mt-8 grid gap-3 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          {DAYS.map((label, day) => {
            const todays = entries.filter((e) => e.day_of_week === day);
            const totals = totalsFor(entries, day);
            return (
              <div
                key={label}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOverDay(day);
                }}
                onDragLeave={() => setDragOverDay((d) => (d === day ? null : d))}
                onDrop={(e) => handleDrop(day, e)}
                className={`flex min-h-[220px] flex-col rounded-xl border p-3 transition-colors ${
                  dragOverDay === day
                    ? "border-primary bg-primary/5 shadow-glow"
                    : "border-border bg-card shadow-card"
                }`}
              >
                <h3 className="font-display text-lg tracking-wide">{label}</h3>
                <div className="mt-2 flex-1 space-y-2">
                  {todays.length === 0 ? (
                    <p className="rounded-md border border-dashed border-border p-3 text-center text-xs text-muted-foreground">
                      Drop servings here
                    </p>
                  ) : (
                    todays.map((entry) => (
                      <ServingCard
                        key={entry.id}
                        entry={entry}
                        onRemove={() => removing.mutate(entry.id)}
                      />
                    ))
                  )}
                </div>
                <div className="mt-3 border-t border-border pt-2 text-xs">
                  {totals.count === 0 ? (
                    <p className="text-muted-foreground">Nothing planned</p>
                  ) : (
                    <>
                      <p className="stat-number text-base">
                        <span className="text-protein">{Math.round(totals.protein)}g P</span>
                        {" · "}
                        <span className="text-carb">{Math.round(totals.carbs)}g C</span>
                      </p>
                      <p className="text-muted-foreground">
                        {Math.round(totals.kcal)} kcal · {totals.count} serving
                        {totals.count === 1 ? "" : "s"}
                      </p>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </section>

        {(adding.isPending || moving.isPending) && (
          <p className="mt-4 inline-flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Updating your week…
          </p>
        )}
      </div>
    </main>
  );
}

function RecipePaletteCard({
  recipe,
  planned,
  onAdd,
  onRemove,
}: {
  recipe: Recipe;
  planned: boolean;
  onAdd: () => void;
  onRemove: () => void;
}) {
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData(RECIPE_MIME, recipe.id);
        e.dataTransfer.effectAllowed = "copy";
      }}
      className="w-56 shrink-0 cursor-grab rounded-xl border border-border bg-card p-4 shadow-card active:cursor-grabbing"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-base font-semibold leading-tight">{recipe.title}</h3>
        <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        {recipe.servings} serving{recipe.servings === 1 ? "" : "s"} ·{" "}
        {recipe.protein_g !== null ? `${Math.round(recipe.protein_g)}g protein` : "no macro data"}
        {recipe.carbs_g !== null ? ` · ${Math.round(recipe.carbs_g)}g carbs` : ""} per serving
      </p>
      <div className="mt-3 flex items-center gap-2">
        <Button size="sm" variant="secondary" onClick={onAdd}>
          <Plus className="mr-1 h-3.5 w-3.5" /> Add all {recipe.servings}
        </Button>
        {planned && (
          <Button size="sm" variant="ghost" onClick={onRemove}>
            Remove
          </Button>
        )}
      </div>
    </div>
  );
}

function ServingCard({ entry, onRemove }: { entry: PlanEntry; onRemove: () => void }) {
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData(ENTRY_MIME, entry.id);
        e.dataTransfer.effectAllowed = "move";
      }}
      className="group cursor-grab rounded-md border border-border bg-background px-2.5 py-2 text-sm shadow-sm active:cursor-grabbing"
    >
      <div className="flex items-center justify-between gap-1">
        <span className="font-medium leading-tight">{entry.recipe.title}</span>
        <button
          onClick={onRemove}
          aria-label={`Remove ${entry.recipe.title} serving`}
          className="text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <p className="mt-0.5 text-[11px] text-muted-foreground">
        1 serving
        {entry.recipe.protein_g !== null && (
          <span className="text-protein"> · {Math.round(entry.recipe.protein_g)}g P</span>
        )}
        {entry.recipe.carbs_g !== null && (
          <span className="text-carb"> · {Math.round(entry.recipe.carbs_g)}g C</span>
        )}
      </p>
    </div>
  );
}
