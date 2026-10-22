/// <reference types="bun" />
import { describe, expect, test } from "bun:test";
import { calculateDailyGoals } from "./nutrition-goals";

describe("daily endurance nutrition goals", () => {
  test("protein is 1.2–2.0 grams per kilogram per day", () => {
    expect(calculateDailyGoals(70, "kg", "moderate")?.protein).toEqual({ min: 84, max: 140 });
  });
  test.each([
    ["light", 210, 350],
    ["moderate", 350, 490],
    ["high", 420, 700],
    ["very-high", 560, 840],
  ] as const)("carbohydrate range for %s training at 70 kg", (load, min, max) => {
    expect(calculateDailyGoals(70, "kg", load)?.carbs).toEqual({ min, max });
  });
  test("pounds convert to kilograms before calculating", () => {
    expect(calculateDailyGoals(154.3235835, "lb", "high")).toEqual(calculateDailyGoals(70, "kg", "high"));
  });
  test.each([0, -1, NaN, Infinity])("invalid weight %s has no goals", (weight) => {
    expect(calculateDailyGoals(weight, "kg", "moderate")).toBeNull();
  });
});