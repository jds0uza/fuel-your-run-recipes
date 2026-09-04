/**
 * Server-only helpers: recipe page scraping (Firecrawl), structured recipe
 * parsing (Lovable AI), and macro estimation (USDA FoodData Central first,
 * AI estimate as fallback).
 */

export type ParsedIngredient = {
  raw: string;
  food: string;
  grams: number | null;
};

export type ParsedRecipe = {
  title: string;
  category: "breakfast" | "main" | "side" | "snack";
  dish_type: string | null;
  prep_minutes: number | null;
  total_minutes: number | null;
  servings: number;
  image_url: string | null;
  instructions: string[];
  ingredients: ParsedIngredient[];
};

export type Macros = {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
};

const AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const GATEWAY_V2 = "https://connector-gateway.lovable.dev/firecrawl/v2";
const USDA_SEARCH = "https://api.nal.usda.gov/fdc/v1/foods/search";

function aiKey(): string {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("AI is not configured for this project.");
  return key;
}

async function askAI(system: string, user: string): Promise<string> {
  const res = await fetch(AI_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${aiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3.7-flash",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: { type: "json_object" },
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    console.error(`AI request failed [${res.status}]: ${body}`);
    if (res.status === 429) throw new Error("AI rate limit reached. Try again in a moment.");
    if (res.status === 402) throw new Error("AI credits exhausted for this workspace.");
    throw new Error(`AI request failed (${res.status}).`);
  }
  const json = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return json.choices?.[0]?.message?.content ?? "";
}

function parseJsonLoose<T>(text: string): T {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "");
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  return JSON.parse(start >= 0 ? cleaned.slice(start, end + 1) : cleaned) as T;
}

/** Scrape a recipe page through the Firecrawl connector gateway. */
export async function scrapeRecipePage(url: string): Promise<{ markdown: string; image: string | null; title: string | null }> {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const firecrawlKey = process.env["FIRECRAWL_API_KEY"];
  if (!lovableKey || !firecrawlKey) throw new Error("Recipe scraping is not configured.");

  const res = await fetch(`${GATEWAY_V2}/scrape`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": firecrawlKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ url, formats: ["markdown"], onlyMainContent: true }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`Firecrawl scrape failed [${res.status}]: ${body}`);
    if (res.status === 402 || res.status === 403) {
      throw new Error("The scraping service is out of credits or access was denied.");
    }
    throw new Error(`Could not read that page (${res.status}).`);
  }

  const payload = (await res.json()) as {
    markdown?: string;
    metadata?: { title?: string; ogImage?: string; "og:image"?: string };
    data?: { markdown?: string; metadata?: { title?: string; ogImage?: string; "og:image"?: string } };
  };
  const markdown = payload.markdown ?? payload.data?.markdown ?? "";
  const metadata = payload.metadata ?? payload.data?.metadata ?? {};
  if (!markdown.trim()) throw new Error("That page had no readable recipe content.");

  return {
    markdown: markdown.slice(0, 24000),
    image: metadata.ogImage ?? metadata["og:image"] ?? null,
    title: metadata.title ?? null,
  };
}

/** Turn scraped page text into a structured recipe. */
export async function parseRecipe(markdown: string, sourceUrl: string): Promise<ParsedRecipe> {
  const content = await askAI(
    [
      "You extract structured recipe data from scraped web page text.",
      "Return ONLY a JSON object with keys:",
      'title (string), category (one of "breakfast","main","side","snack"),',
      "dish_type (short phrase like \"pasta bowl\" or null), prep_minutes (number|null),",
      "total_minutes (number|null), servings (number, default 1), instructions (array of short step strings, max 15),",
      "ingredients (array of objects: raw = the ingredient line as written, food = a plain single food name suitable for a USDA food search (no quantities, no brands, no preparation words), grams = your best estimate of the total weight in grams for that line, or null).",
      "Choose the category that best fits how an endurance athlete would file it.",
      "Estimate grams carefully using standard measure conversions. Do not invent ingredients that are not present.",
    ].join(" "),
    `Source URL: ${sourceUrl}\n\nPage content:\n${markdown}`,
  );

  const raw = parseJsonLoose<Partial<ParsedRecipe> & { ingredients?: ParsedIngredient[] }>(content);
  const allowed = ["breakfast", "main", "side", "snack"] as const;
  const category = allowed.includes(raw.category as (typeof allowed)[number])
    ? (raw.category as ParsedRecipe["category"])
    : "main";

  const ingredients = (raw.ingredients ?? [])
    .filter((i) => i && (i.raw || i.food))
    .slice(0, 40)
    .map((i) => ({
      raw: String(i.raw ?? i.food ?? "").slice(0, 200),
      food: String(i.food ?? i.raw ?? "").slice(0, 80),
      grams: typeof i.grams === "number" && i.grams > 0 && i.grams < 20000 ? Math.round(i.grams) : null,
    }));

  return {
    title: (raw.title ?? "Untitled recipe").slice(0, 160),
    category,
    dish_type: raw.dish_type ? String(raw.dish_type).slice(0, 80) : null,
    prep_minutes: numOrNull(raw.prep_minutes),
    total_minutes: numOrNull(raw.total_minutes),
    servings: typeof raw.servings === "number" && raw.servings >= 1 ? Math.round(Math.min(raw.servings, 50)) : 1,
    image_url: null,
    instructions: (raw.instructions ?? []).slice(0, 15).map((s) => String(s).slice(0, 400)),
    ingredients,
  };
}

function numOrNull(v: unknown): number | null {
  return typeof v === "number" && v >= 0 && v < 10000 ? Math.round(v) : null;
}

type Per100g = Macros;

const NUTRIENT_IDS: Record<string, keyof Macros> = {
  "208": "calories",
  "203": "protein_g",
  "205": "carbs_g",
  "204": "fat_g",
  "291": "fiber_g",
};

async function usdaPer100g(food: string): Promise<Per100g | null> {
  const apiKey = process.env["USDA_API_KEY"] ?? "DEMO_KEY";
  // NOTE: dataType must keep literal commas — USDA rejects %2C separators with a 400.
  const url = `${USDA_SEARCH}?api_key=${encodeURIComponent(apiKey)}&query=${encodeURIComponent(
    food,
  )}&pageSize=1&dataType=Foundation,SR%20Legacy,Survey%20%28FNDDS%29`;

  let res: Response;
  try {
    res = await fetch(url);
  } catch (error) {
    console.error("USDA request error", error);
    return null;
  }
  if (!res.ok) {
    console.error(`USDA lookup failed [${res.status}] for "${food}": ${await res.text()}`);
    return null;
  }

  const json = (await res.json()) as {
    foods?: { foodNutrients?: { nutrientNumber?: string; value?: number }[] }[];
  };
  const nutrients = json.foods?.[0]?.foodNutrients;
  if (!nutrients) return null;

  const out: Per100g = { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0 };
  let matched = 0;
  for (const n of nutrients) {
    const key = NUTRIENT_IDS[n.nutrientNumber ?? ""];
    if (key && typeof n.value === "number") {
      out[key] = n.value;
      matched += 1;
    }
  }
  if (matched < 3) return null;
  if (out.calories === 0) {
    out.calories = out.protein_g * 4 + out.carbs_g * 4 + out.fat_g * 9;
  }
  return out;
}

async function aiPer100g(foods: string[]): Promise<Record<string, Per100g>> {
  if (foods.length === 0) return {};
  const content = await askAI(
    'You are a nutrition database. Return ONLY JSON: {"items":[{"food":string,"calories":number,"protein_g":number,"carbs_g":number,"fat_g":number,"fiber_g":number}]} with values per 100 grams of the raw food as purchased. Use realistic reference values.',
    `Foods: ${foods.join("; ")}`,
  );
  const parsed = parseJsonLoose<{ items?: ({ food?: string } & Partial<Per100g>)[] }>(content);
  const map: Record<string, Per100g> = {};
  for (const item of parsed.items ?? []) {
    if (!item.food) continue;
    map[item.food.toLowerCase()] = {
      calories: Number(item.calories) || 0,
      protein_g: Number(item.protein_g) || 0,
      carbs_g: Number(item.carbs_g) || 0,
      fat_g: Number(item.fat_g) || 0,
      fiber_g: Number(item.fiber_g) || 0,
    };
  }
  return map;
}

/**
 * Estimate per-serving macros: USDA FoodData Central per ingredient, with a
 * single batched AI estimate covering whatever USDA could not match.
 */
export async function estimateMacros(
  ingredients: ParsedIngredient[],
  servings: number,
): Promise<{ macros: Macros; source: string; matched: number; total: number }> {
  const usable = ingredients.filter((i) => i.grams && i.grams > 0);
  const total = usable.length;

  const usdaResults = await Promise.all(
    usable.map(async (i) => ({ ingredient: i, per100g: await usdaPer100g(i.food) })),
  );

  const missing = usdaResults.filter((r) => !r.per100g).map((r) => r.ingredient.food);
  let aiMap: Record<string, Per100g> = {};
  if (missing.length > 0) {
    try {
      aiMap = await aiPer100g([...new Set(missing)]);
    } catch (error) {
      console.error("AI macro fallback failed", error);
    }
  }

  const sum: Macros = { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0 };
  let usdaMatched = 0;
  let anyMatched = 0;

  for (const { ingredient, per100g } of usdaResults) {
    const ref = per100g ?? aiMap[ingredient.food.toLowerCase()] ?? null;
    if (!ref) continue;
    if (per100g) usdaMatched += 1;
    anyMatched += 1;
    const factor = (ingredient.grams ?? 0) / 100;
    sum.calories += ref.calories * factor;
    sum.protein_g += ref.protein_g * factor;
    sum.carbs_g += ref.carbs_g * factor;
    sum.fat_g += ref.fat_g * factor;
    sum.fiber_g += ref.fiber_g * factor;
  }

  const per = Math.max(servings, 1);
  const macros: Macros = {
    calories: round(sum.calories / per),
    protein_g: round(sum.protein_g / per, 1),
    carbs_g: round(sum.carbs_g / per, 1),
    fat_g: round(sum.fat_g / per, 1),
    fiber_g: round(sum.fiber_g / per, 1),
  };

  const source =
    anyMatched === 0
      ? "unavailable"
      : usdaMatched === anyMatched
        ? "USDA FoodData Central"
        : usdaMatched === 0
          ? "AI estimate"
          : `USDA FoodData Central + AI estimate (${usdaMatched}/${anyMatched} from USDA)`;

  return { macros, source, matched: anyMatched, total };
}

function round(value: number, decimals = 0): number {
  const f = 10 ** decimals;
  return Math.round(value * f) / f;
}

export function proteinPer100kcal(protein_g: number, calories: number): number | null {
  if (!calories || calories <= 0) return null;
  return round((protein_g / calories) * 100, 1);
}
