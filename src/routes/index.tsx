import { createFileRoute, Link } from "@tanstack/react-router";
import { Clock, Link2, Sparkles, Utensils } from "lucide-react";

import heroImage from "@/assets/fuel-hero.jpg";
import { Button } from "@/components/ui/button";
import { DailyGoals } from "@/components/recipe/DailyGoals";

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
  return (
    <main className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <span className="font-display text-2xl">FUEL LAB</span>
        <Button asChild variant="outline" size="sm">
          <Link to="/auth">Sign in</Link>
        </Button>
      </header>

      <DailyGoals />

      <section className="mx-auto grid max-w-6xl items-center gap-10 px-6 pb-16 pt-6 lg:grid-cols-2 lg:pb-24">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">
            For marathon training blocks
          </p>
          <h1 className="mt-4 text-5xl leading-[0.95] sm:text-6xl">
            Know the protein and carbs before you cook
          </h1>
          <p className="mt-5 max-w-lg text-lg text-muted-foreground">
            Paste any recipe link. Fuel Lab reads the page, pulls the ingredients, prep time and dish
            type, then estimates per-serving macros from USDA food data — including grams of protein
            per 100 kcal. File it under breakfast, mains, sides or snacks and stop doing mental math
            at the stove.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/auth">Build my recipe box</Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link to="/recipes">Open my recipes</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/demo">Try the 2-minute demo</Link>
            </Button>
          </div>
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
