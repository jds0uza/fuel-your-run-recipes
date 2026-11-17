import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { DemoPlanner } from "@/components/recipe/DemoPlanner";
import { BOX_KEY } from "@/components/recipe/RecipeLab";
import { DEMO_RECIPES } from "@/lib/demo-recipes";
import type { Recipe } from "@/lib/recipes.functions";

export const Route = createFileRoute("/plan")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Weekly meal plan — Plate Math" },
      { name: "description", content: "Drag recipes onto a 7-day plan and see daily protein and carb totals for endurance training." },
      { property: "og:title", content: "Weekly meal plan — Plate Math" },
      { property: "og:description", content: "Plan a week of servings and see daily protein and carb totals." },
      { property: "og:type", content: "website" },
      { property: "og:image", content: "https://paceplate-macro-guide.lovable.app/app-preview.jpg" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: "https://paceplate-macro-guide.lovable.app/app-preview.jpg" },
    ],
  }),
  component: PlanPage,
});

function PlanPage() {
  const [box, setBox] = useState<Recipe[]>([]);
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(BOX_KEY);
      if (saved) setBox(JSON.parse(saved) as Recipe[]);
    } catch {
      // ignore corrupted storage
    }
  }, []);
  return (
    <main className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link to="/" className="font-display text-2xl tracking-tight">PLATE MATH</Link>
        <Link to="/" className="text-sm font-semibold text-primary underline-offset-2 hover:underline">← Recipes</Link>
      </header>
      <div className="mx-auto max-w-6xl px-6 pb-12">
        <DemoPlanner recipes={[...DEMO_RECIPES, ...box.filter((r) => !DEMO_RECIPES.some((d) => d.id === r.id))]} />
      </div>
    </main>
  );
}
