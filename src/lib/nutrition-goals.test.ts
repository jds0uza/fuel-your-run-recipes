import { describe, test } from "node:test";
import { deepStrictEqual, strictEqual } from "node:assert";
import { calculateDailyGoals } from "./nutrition-goals";

describe("daily endurance nutrition goals", () => {
  test("protein is 1.2–2.0 grams per kilogram per day", () => {
    deepStrictEqual(calculateDailyGoals(70, "kg", "moderate")?.protein, { min: 84, max: 140 });
  });
  for (const [load, min, max] of [
    ["light", 210, 350],
    ["moderate", 350, 490],
    ["high", 420, 700],
    ["very-high", 560, 840],
  ] as const) {
    test(`carbohydrate range for ${load} training at 70 kg`, () => {
      deepStrictEqual(calculateDailyGoals(70, "kg", load)?.carbs, { min, max });
    });
  }
  test("pounds convert to kilograms before calculating", () => {
    deepStrictEqual(calculateDailyGoals(154.3235835, "lb", "high"), calculateDailyGoals(70, "kg", "high"));
  });
  for (const weight of [0, -1, NaN, Infinity]) {
    test(`invalid weight ${weight} has no goals`, () => {
      strictEqual(calculateDailyGoals(weight, "kg", "moderate"), null);
    });
  }
});