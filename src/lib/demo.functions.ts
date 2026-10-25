import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Public (no-login) version of the recipe analysis used by the /demo
 * walkthrough. It runs the same scrape → parse → macro pipeline as the
 * signed-in flow but never touches the database.
 *
 * Note: this endpoint is callable by anyone once published. The demo page
 * caps each browser at a few analyses, but that cap is client-side and
 * honor-system — acceptable for a portfolio demo, not a hard quota.
 */
export const analyzeDemoRecipeUrl = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ url: z.string().url().max(2000) }).parse(input),
  )
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
