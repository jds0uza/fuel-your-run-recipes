import { CalendarDays, GripVertical, Plus, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import type { Recipe } from "@/lib/recipes.functions";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const PLAN_KEY = "fuel-lab-demo-plan";
const RECIPE_MIME = "application/x-fuel-lab-recipe";
const ENTRY_MIME = "application/x-fuel-lab-entry";

type Entry = { id: string; recipe_id: string; day: number };

let counter = 0;
const newId = () => `e-${Date.now()}-${counter++}`;

/** Guest weekly plan: stored only in this browser, no server calls. */
export function DemoPlanner({ recipes }: { recipes: Recipe[] }) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [dragOverDay, setDragOverDay] = useState<number | null>(null);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(PLAN_KEY);
      if (saved) setEntries(JSON.parse(saved) as Entry[]);
    } catch {
      // ignore corrupted storage
    }
  }, []);

  function persist(next: Entry[]) {
    setEntries(next);
    try {
      window.localStorage.setItem(PLAN_KEY, JSON.stringify(next));
    } catch {
      // storage blocked — plan works for this session
    }
  }

  const byId = new Map(recipes.map((r) => [r.id, r]));
  const valid = entries.filter((e) => byId.has(e.recipe_id));

  function addRecipe(recipeId: string, day: number) {
    const r = byId.get(recipeId);
    if (!r) return;
    const n = Math.max(1, r.servings || 1);
    persist([...valid, ...Array.from({ length: n }, () => ({ id: newId(), recipe_id: recipeId, day }))]);
  }

  function handleDrop(day: number, e: React.DragEvent) {
    e.preventDefault();
    setDragOverDay(null);
    const recipeId = e.dataTransfer.getData(RECIPE_MIME);
    const entryId = e.dataTransfer.getData(ENTRY_MIME);
    if (recipeId) addRecipe(recipeId, day);
    else if (entryId) persist(valid.map((x) => (x.id === entryId ? { ...x, day } : x)));
  }

  const totals = (day: number | null) => {
    const list = day === null ? valid : valid.filter((e) => e.day === day);
    return list.reduce(
      (acc, e) => {
        const r = byId.get(e.recipe_id)!;
        return {
          kcal: acc.kcal + (r.calories ?? 0),
          protein: acc.protein + (r.protein_g ?? 0),
          carbs: acc.carbs + (r.carbs_g ?? 0),
          count: acc.count + 1,
        };
      },
      { kcal: 0, protein: 0, carbs: 0, count: 0 },
    );
  };
  const week = totals(null);
  const planned = new Set(valid.map((e) => e.recipe_id));

  return (
    <section className="mt-12">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="inline-flex items-center gap-2 text-2xl">
            <CalendarDays className="h-5 w-5 text-primary" aria-hidden /> Demo weekly plan
          </h2>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Drag a recipe onto a day and it splits into one card per serving. Move servings between
            days and watch daily protein and carbs add up. Saved only in this browser.
          </p>
        </div>
        {week.count > 0 && (
          <div className="flex items-center gap-3">
            <p className="stat-number text-sm">
              <span className="text-protein">{Math.round(week.protein)}g protein</span>
              {" · "}
              <span className="text-carb">{Math.round(week.carbs)}g carbs</span>
              {" · "}
              {Math.round(week.kcal)} kcal
            </p>
            <Button variant="outline" size="sm" onClick={() => persist([])}>
              <Trash2 className="mr-1.5 h-4 w-4" /> Clear week
            </Button>
          </div>
        )}
      </div>

      <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
        {recipes.map((r) => (
          <div
            key={r.id}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData(RECIPE_MIME, r.id);
              e.dataTransfer.effectAllowed = "copy";
            }}
            className="w-56 shrink-0 cursor-grab rounded-xl border border-border bg-card p-4 shadow-card active:cursor-grabbing"
          >
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-base font-semibold leading-tight">{r.title}</h3>
              <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {r.servings} servings · {Math.round(r.protein_g ?? 0)}g P · {Math.round(r.carbs_g ?? 0)}g C each
            </p>
            <div className="mt-3 flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => addRecipe(r.id, 0)}>
                <Plus className="mr-1 h-3.5 w-3.5" /> Add all {r.servings}
              </Button>
              {planned.has(r.id) && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => persist(valid.filter((e) => e.recipe_id !== r.id))}
                >
                  Remove
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        {DAYS.map((label, day) => {
          const t = totals(day);
          return (
            <div
              key={label}
              data-testid={`demo-day-${day}`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverDay(day);
              }}
              onDragLeave={() => setDragOverDay((d) => (d === day ? null : d))}
              onDrop={(e) => handleDrop(day, e)}
              className={`flex min-h-[180px] flex-col rounded-xl border p-3 transition-colors ${
                dragOverDay === day ? "border-primary bg-primary/5 shadow-glow" : "border-border bg-card shadow-card"
              }`}
            >
              <h3 className="font-display text-lg tracking-wide">{label}</h3>
              <div className="mt-2 flex-1 space-y-2">
                {valid
                  .filter((e) => e.day === day)
                  .map((e) => {
                    const r = byId.get(e.recipe_id)!;
                    return (
                      <div
                        key={e.id}
                        draggable
                        onDragStart={(ev) => {
                          ev.dataTransfer.setData(ENTRY_MIME, e.id);
                          ev.dataTransfer.effectAllowed = "move";
                        }}
                        className="cursor-grab rounded-md border border-border bg-background px-2.5 py-2 text-sm shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-1">
                          <span className="font-medium leading-tight">{r.title}</span>
                          <button
                            onClick={() => persist(valid.filter((x) => x.id !== e.id))}
                            aria-label={`Remove ${r.title} serving`}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                          1 serving
                          <span className="text-protein"> · {Math.round(r.protein_g ?? 0)}g P</span>
                          <span className="text-carb"> · {Math.round(r.carbs_g ?? 0)}g C</span>
                        </p>
                      </div>
                    );
                  })}
                {t.count === 0 && (
                  <p className="rounded-md border border-dashed border-border p-3 text-center text-xs text-muted-foreground">
                    Drop servings here
                  </p>
                )}
              </div>
              <div className="mt-3 border-t border-border pt-2 text-xs">
                {t.count === 0 ? (
                  <p className="text-muted-foreground">Nothing planned</p>
                ) : (
                  <>
                    <p className="stat-number text-base">
                      <span className="text-protein">{Math.round(t.protein)}g P</span>
                      {" · "}
                      <span className="text-carb">{Math.round(t.carbs)}g C</span>
                    </p>
                    <p className="text-muted-foreground">
                      {Math.round(t.kcal)} kcal · {t.count} serving{t.count === 1 ? "" : "s"}
                    </p>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
