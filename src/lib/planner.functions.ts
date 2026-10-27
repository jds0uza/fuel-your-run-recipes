import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** 0 = Monday … 6 = Sunday */
export const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;

export type PlanRecipe = {
  id: string;
  title: string;
  servings: number;
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
};

export type PlanEntry = {
  id: string;
  recipe_id: string;
  day_of_week: number;
  recipe: PlanRecipe;
};

const daySchema = z.number().int().min(0).max(6);

/** The user's week: every planned serving with its recipe's per-serving macros. */
export const listPlanEntries = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("meal_plan_entries")
      .select("id, recipe_id, day_of_week, recipe:recipes(id, title, servings, calories, protein_g, carbs_g, fat_g)")
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as PlanEntry[];
  });

/**
 * Drag a recipe onto a day: inserts one entry per serving, so a 4-serving
 * recipe becomes 4 movable cards. All start on the dropped day; the user
 * drags individual servings to other days from there.
 */
export const addRecipeToPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ recipe_id: z.string().uuid(), day_of_week: daySchema }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: recipe, error: recipeError } = await context.supabase
      .from("recipes")
      .select("id, servings")
      .eq("id", data.recipe_id)
      .single();
    if (recipeError || !recipe) throw new Error("Recipe not found.");

    const rows = Array.from({ length: recipe.servings }, () => ({
      user_id: context.userId,
      recipe_id: recipe.id,
      day_of_week: data.day_of_week,
    }));
    const { error } = await context.supabase.from("meal_plan_entries").insert(rows);
    if (error) throw new Error(error.message);
    return { added: recipe.servings };
  });

/** Move one serving card to another day. */
export const movePlanEntry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ id: z.string().uuid(), day_of_week: daySchema }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("meal_plan_entries")
      .update({ day_of_week: data.day_of_week })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Remove one serving card from the week. */
export const removePlanEntry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("meal_plan_entries").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Remove every serving of a recipe from the week. */
export const removeRecipeFromPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ recipe_id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("meal_plan_entries")
      .delete()
      .eq("recipe_id", data.recipe_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Clear the whole week. */
export const clearPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { error } = await context.supabase
      .from("meal_plan_entries")
      .delete()
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
