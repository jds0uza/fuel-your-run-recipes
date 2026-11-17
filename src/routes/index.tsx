import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarDays, FlaskConical, Link2, Sparkles } from "lucide-react";

import heroImage from "@/assets/fuel-hero.jpg";
import { DailyGoals } from "@/components/recipe/DailyGoals";
import { RecipeLab } from "@/components/recipe/RecipeLab";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Plate Math — Macro-aware recipe box for endurance runners" },
      {
        name: "description",
        content:
          "Set daily protein and carb goals by body weight, then paste a recipe link to get per-serving macros from USDA data.",
      },
      { property: "og:title", content: "Plate Math — Macro-aware recipe box for endurance runners" },
      {
        property: "og:description",
        content: "Daily protein and carb goals plus per-serving recipe macros for endurance training.",
      },
      { property: "og:type", content: "website" },
      { property: "og:image", content: "https://paceplate-macro-guide.lovable.app/app-preview.jpg" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: "https://paceplate-macro-guide.lovable.app/app-preview.jpg" },
    ],
  }),
  component: Landing,
});

const STEPS = [
  { icon: Link2, title: "Paste a recipe URL", body: "Ingredients, timings, servings and dish type are pulled from the page." },
  { icon: Sparkles, title: "AI reads the recipe", body: "Ingredients are structured with estimated gram weights." },
  { icon: FlaskConical, title: "Macros from USDA data", body: "Matched to USDA FoodData Central, AI fills gaps — protein, carbs and protein per 100 kcal per serving." },
];

function Landing() {
  return (
    <main className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <span className="font-display text-2xl tracking-tight">PLATE MATH</span>
        <Link to="/plan" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary underline-offset-2 hover:underline">
          <CalendarDays className="size-4" aria-hidden /> Weekly plan
        </Link>
      </header>

      <section className="mx-auto grid max-w-6xl items-center gap-10 px-6 pb-10 pt-4 lg:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">For marathon & endurance blocks</p>
          <h1 className="mt-4 text-5xl leading-[0.95] sm:text-6xl font-normal">Know the protein and carbs before you cook</h1>
          <p className="mt-5 max-w-lg text-lg text-muted-foreground">
            Set your daily fuel goals, then check any recipe against them. No account needed.
          </p>
        </div>
        <div className="overflow-hidden rounded-xl border border-border shadow-card">
          <img src={heroImage} alt="Overhead spread of salmon, quinoa, sweet potato, yogurt with berries and eggs beside running shoes" width={1600} height={1008} className="h-full w-full object-cover" />
        </div>
      </section>

      <DailyGoals />

      <section className="mx-auto max-w-6xl px-6 pt-12">
        <h2 className="text-3xl sm:text-4xl">Analyze a recipe</h2>
        <ol className="mt-5 grid gap-4 sm:grid-cols-3">
          {STEPS.map((item, i) => (
            <li key={item.title} className="rounded-xl border border-border bg-card p-5 shadow-card">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">{i + 1}</span>
                <item.icon className="h-5 w-5 text-primary" aria-hidden />
              </div>
              <h3 className="mt-3 text-xl">{item.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{item.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <div className="pt-6">
        <RecipeLab />
      </div>

      <section className="mx-auto max-w-6xl px-6 pt-12">
        <Link to="/plan" className="flex items-center justify-between gap-4 rounded-xl border border-primary/40 bg-gradient-to-b from-primary/10 to-secondary/60 p-6 shadow-card transition-opacity hover:opacity-90">
          <div>
            <h2 className="inline-flex items-center gap-2 text-2xl"><CalendarDays className="size-5 text-primary" aria-hidden /> Plan your week</h2>
            <p className="mt-1 text-sm text-muted-foreground">Drag recipes onto days and see daily protein and carb totals.</p>
          </div>
          <span className="shrink-0 font-semibold text-primary">Open →</span>
        </Link>
      </section>

      <footer className="mx-auto max-w-6xl px-6 py-10 text-sm text-muted-foreground">
        Saved recipes and plans stay in this browser. Macro figures are estimates for training planning, not medical advice.
      </footer>
    </main>
  );
}
