import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Clock, Link2, Play, Sparkles, Utensils, Users } from "lucide-react";

import heroImage from "@/assets/fuel-hero.jpg";
import { Button } from "@/components/ui/button";
import { DailyGoals } from "@/components/recipe/DailyGoals";
import { DEMO_RECIPES } from "@/lib/demo-recipes";
import { MacroSplitBar, MacroStats, ProteinRatioBadge } from "@/components/recipe/MacroStats";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Fuel Lab — Macro-aware recipe box for endurance runners" },
      {
        name: "description",
        content:
          "Paste a recipe link and get protein, carbs and protein-per-calorie per serving, filed under breakfast, mains, sides or snacks.",
      },
      { property: "og:title", content: "Fuel Lab — Macro-aware recipe box for endurance runners" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      {
        property: "og:description",
        content:
          "Paste a recipe link and get protein, carbs and protein-per-calorie per serving, filed under breakfast, mains, sides or snacks.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  const [activeDemoId, setActiveDemoId] = useState(DEMO_RECIPES[1]?.id ?? DEMO_RECIPES[0]?.id ?? ""); // Salmon Quinoa by default
  const activeRecipe = DEMO_RECIPES.find((r) => r.id === activeDemoId) ?? DEMO_RECIPES[0];

  return (
    <main className="min-h-screen bg-background">
      {/* Top Reviewer / Demo Announcement Bar */}
      <aside aria-label="Reviewer demo announcement" className="border-b border-primary/20 bg-primary/10 px-4 py-2.5 text-center text-xs sm:text-sm text-foreground">
        <div className="mx-auto flex max-w-6xl items-center justify-center gap-2">
          <span className="inline-flex items-center gap-1.5 font-semibold text-primary">
            <Sparkles className="size-3.5" />
            Preview:
          </span>
          <span className="text-muted-foreground">
            Explore Fuel Lab with pre-calculated meals and instant recipe URL analysis.
          </span>
          <Link
            to="/demo"
            className="inline-flex items-center gap-1 font-semibold text-primary underline underline-offset-2 hover:opacity-80 transition-opacity ml-1"
          >
            Launch Demo <ArrowRight className="size-3" />
          </Link>
        </div>
      </aside>

      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <span className="font-display text-2xl tracking-tight">FUEL LAB</span>
        <div className="flex items-center gap-3">
          <Button asChild size="sm" className="gap-1.5 shadow-sm">
            <Link to="/demo">
              <Sparkles className="size-3.5" />
              Try Demo
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to="/auth">Sign in</Link>
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-6 pb-12 pt-4 lg:grid-cols-2 lg:pb-20">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">
            For marathon & endurance blocks
          </p>
          <h1 className="mt-4 text-5xl leading-[0.95] sm:text-6xl font-normal">
            Know the protein and carbs before you cook
          </h1>
          <p className="mt-5 max-w-lg text-lg text-muted-foreground">
            Paste any recipe link. Fuel Lab reads the page, pulls the ingredients, prep time and dish
            type, then estimates per-serving macros from USDA food data — including grams of protein
            per 100 kcal. Stop doing mental math at the stove.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="gap-2 shadow-md">
              <Link to="/demo">
                <Play className="size-4 fill-current" />
                Try the Interactive Demo
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/auth">Sign in / Account</Link>
            </Button>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            ⚡ No sign-up or credit card required to test all features.
          </p>
        </div>

        <div className="overflow-hidden rounded-xl border border-border shadow-card">
          <img
            src={heroImage}
            alt="Overhead spread of salmon, quinoa, sweet potato, yogurt with berries and eggs beside running shoes"
            width={1600}
            height={1008}
            className="h-full w-full object-cover"
          />
        </div>
      </section>

      {/* Live Interactive Demo Showcase Section */}
      <section className="border-t border-border bg-card/40 py-14">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
                <Sparkles className="size-3.5" />
                Interactive Recipe Preview
              </div>
              <h2 className="mt-2 text-3xl sm:text-4xl">See how Fuel Lab breaks down meals</h2>
              <p className="mt-1.5 text-muted-foreground text-sm max-w-xl">
                Switch between sample endurance dishes below to inspect real USDA macro splits,
                protein density ratios, and ingredient portions:
              </p>
            </div>
            <Button asChild variant="outline" size="sm" className="gap-1.5 self-start sm:self-auto">
              <Link to="/demo">
                Full Demo Experience <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </div>

          {/* Interactive tabs */}
          <div className="mt-6 flex flex-wrap gap-2">
            {DEMO_RECIPES.map((recipe) => {
              const active = recipe.id === activeDemoId;
              return (
                <button
                  key={recipe.id}
                  type="button"
                  onClick={() => setActiveDemoId(recipe.id)}
                  className={`rounded-lg px-4 py-2.5 text-sm font-medium transition-all text-left border ${active
                      ? "border-primary bg-primary text-primary-foreground shadow-sm"
                      : "border-border bg-card hover:bg-secondary/60 text-foreground"
                    }`}
                >
                  <span className="block text-xs uppercase tracking-wider opacity-75">
                    {recipe.category}
                  </span>
                  <span>{recipe.title.split(" with ")[0]?.split(",")[0] ?? recipe.title}</span>
                </button>
              );
            })}
          </div>

          {/* Active Recipe Display Card */}
          {activeRecipe && <div className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-card transition-all">
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
              <div className="flex-1 space-y-4">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="rounded-full bg-primary/10 text-primary border border-primary/20 px-3 py-0.5 text-xs font-semibold uppercase tracking-wide">
                    {activeRecipe.category}
                  </span>
                  {activeRecipe.dish_type && (
                    <span className="rounded-full bg-secondary px-3 py-0.5 text-xs text-muted-foreground">
                      {activeRecipe.dish_type}
                    </span>
                  )}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground ml-auto">
                    {activeRecipe.total_minutes !== null && (
                      <span className="inline-flex items-center gap-1">
                        <Clock className="size-3.5" /> {activeRecipe.total_minutes} min
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1">
                      <Users className="size-3.5" /> {activeRecipe.servings} servings
                    </span>
                  </div>
                </div>

                <h3 className="text-2xl sm:text-3xl leading-snug font-medium">
                  {activeRecipe.title}
                </h3>

                <div className="pt-2">
                  <ProteinRatioBadge ratio={activeRecipe.protein_per_100kcal} />
                </div>

                <div className="space-y-2 pt-2">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Calorie distribution:</span>
                    <span className="space-x-3">
                      <span className="text-protein font-semibold">Protein</span>
                      <span className="text-carb font-semibold">Carbs</span>
                      <span className="text-fat font-semibold">Fat</span>
                    </span>
                  </div>
                  <MacroSplitBar {...activeRecipe} />
                </div>

                <MacroStats {...activeRecipe} />
              </div>

              {/* Ingredients preview panel */}
              <div className="lg:w-80 rounded-xl border border-border bg-secondary/30 p-5 flex flex-col justify-between">
                <div>
                  <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    Ingredients ({activeRecipe.ingredients.length})
                  </h4>
                  <ul className="mt-3 space-y-2 text-sm text-foreground">
                    {activeRecipe.ingredients.slice(0, 5).map((ing, idx) => (
                      <li key={idx} className="flex items-start justify-between gap-2">
                        <span className="truncate">{ing.food}</span>
                        {ing.grams && (
                          <span className="text-xs text-muted-foreground shrink-0">
                            {ing.grams}g
                          </span>
                        )}
                      </li>
                    ))}
                    {activeRecipe.ingredients.length > 5 && (
                      <li className="text-xs text-muted-foreground pt-1">
                        +{activeRecipe.ingredients.length - 5} more ingredients...
                      </li>
                    )}
                  </ul>
                </div>

                <Button asChild size="sm" className="mt-5 w-full gap-2">
                  <Link to="/demo">
                    Open in Demo Recipe Box
                    <ArrowRight className="size-3.5" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>}
        </div>
      </section>

      {/* Daily Goals Calculator */}
      <DailyGoals />

      {/* Features Grid */}
      <section className="border-t border-border bg-card/60">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-14 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: Link2,
              title: "Paste a URL",
              body: "Any recipe page. The ingredient list, servings and timings get pulled automatically.",
            },
            {
              icon: Sparkles,
              title: "Macros per serving",
              body: "Each ingredient is matched to USDA food data, with an AI estimate filling any gaps.",
            },
            {
              icon: Clock,
              title: "Prep time in view",
              body: "Prep and total time sit next to the macros so you can plan around a long run.",
            },
            {
              icon: Utensils,
              title: "Four categories",
              body: "Breakfast, mains, sides and snacks — filter to what you actually need right now.",
            },
          ].map((item) => (
            <div key={item.title}>
              <item.icon className="h-6 w-6 text-primary" aria-hidden />
              <h2 className="mt-3 text-xl">{item.title}</h2>
              <p className="mt-1.5 text-sm text-muted-foreground">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="mx-auto max-w-6xl px-6 py-10 text-sm text-muted-foreground">
        Macro figures are estimates for training planning, not medical advice.
      </footer>
    </main>
  );
}
