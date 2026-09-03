import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const CATEGORIES = ["breakfast", "main", "side", "snack"] as const;
export type Category = (typeof CATEGORIES)[number];

export type Ingredient = { raw: string; food: string; grams: number | null };

export type Recipe = {
  id: string;
  title: string;
  source_url: string | null;
  image_url: string | null;
  category: Category;
  dish_type: string | null;
  prep_minutes: number | null;
  total_minutes: number | null;
  servings: number;
  ingredients: Ingredient[];
  instructions: string[];
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  fiber_g: number | null;
  protein_per_100kcal: number | null;
  nutrition_source: string | null;
  notes: string | null;
  created_at: string;
};

const urlSchema = z.object({ url: z.string().url().max(2000) });

/** Scrape + parse + macro-estimate a recipe URL. Nothing is saved yet. */
export const analyzeRecipeUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => urlSchema.parse(input))
  .handler(async ({ data }) => {
    const { scrapeRecipePage, parseRecipe, estimateMacros, proteinPer100kcal } = await import(
      "./nutrition.server"
    );

    const page = await scrapeRecipePage(data.url);
    const parsed = await parseRecipe(page.markdown, data.url);
    const { macros, source, matched, total } = await estimateMacros(parsed.ingredients, parsed.servings);

    return {
      draft: {
        title: parsed.title === "Untitled recipe" && page.title ? page.title.slice(0, 160) : parsed.title,
        source_url: data.url,
        image_url: page.image,
        category: parsed.category,
        dish_type: parsed.dish_type,
        prep_minutes: parsed.prep_minutes,
        total_minutes: parsed.total_minutes,
        servings: parsed.servings,
        ingredients: parsed.ingredients,
        instructions: parsed.instructions,
        calories: macros.calories,
        protein_g: macros.protein_g,
        carbs_g: macros.carbs_g,
        fat_g: macros.fat_g,
        fiber_g: macros.fiber_g,
        protein_per_100kcal: proteinPer100kcal(macros.protein_g, macros.calories),
        nutrition_source: source,
      },
      coverage: { matched, total },
    };
  });

const saveSchema = z.object({
  title: z.string().min(1).max(160),
  source_url: z.string().url().max(2000).nullable(),
  image_url: z.string().url().max(2000).nullable(),
  category: z.enum(CATEGORIES),
  dish_type: z.string().max(80).nullable(),
  prep_minutes: z.number().int().min(0).max(10000).nullable(),
  total_minutes: z.number().int().min(0).max(10000).nullable(),
  servings: z.number().int().min(1).max(50),
  ingredients: z
    .array(z.object({ raw: z.string().max(200), food: z.string().max(80), grams: z.number().nullable() }))
    .max(60),
  instructions: z.array(z.string().max(400)).max(20),
  calories: z.number().nullable(),
  protein_g: z.number().nullable(),
  carbs_g: z.number().nullable(),
  fat_g: z.number().nullable(),
  fiber_g: z.number().nullable(),
  protein_per_100kcal: z.number().nullable(),
  nutrition_source: z.string().max(160).nullable(),
  notes: z.string().max(2000).nullable(),
});

export const saveRecipe = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => saveSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("recipes")
      .insert({ ...data, user_id: context.userId })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id };
  });

export const listRecipes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("recipes")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as Recipe[];
  });

export const deleteRecipe = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("recipes").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const updateRecipeCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ id: z.string().uuid(), category: z.enum(CATEGORIES) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("recipes")
      .update({ category: data.category })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
