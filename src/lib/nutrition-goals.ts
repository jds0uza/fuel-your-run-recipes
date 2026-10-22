export type WeightUnit = "kg" | "lb";

// Academy of Nutrition and Dietetics / Dietitians of Canada / ACSM (2016).
export const TRAINING_LOADS = [
  { id: "light", label: "Light / recovery", duration: "Low-intensity or skill-based activity", carbs: [3, 5] },
  { id: "moderate", label: "Moderate", duration: "About 1 hour of exercise per day", carbs: [5, 7] },
  { id: "high", label: "High", duration: "1–3 hours of moderate-to-high intensity per day", carbs: [6, 10] },
  { id: "very-high", label: "Very high", duration: "4–5+ hours of moderate-to-high intensity per day", carbs: [8, 12] },
] as const;

export type TrainingLoad = (typeof TRAINING_LOADS)[number]["id"];

export function calculateDailyGoals(weight: number, unit: WeightUnit, load: TrainingLoad) {
  if (!Number.isFinite(weight) || weight <= 0) return null;
  const training = TRAINING_LOADS.find((item) => item.id === load);
  if (!training) return null;
  const kilograms = unit === "lb" ? weight * 0.45359237 : weight;
  return {
    protein: { min: Math.round(kilograms * 1.2), max: Math.round(kilograms * 2) },
    carbs: { min: Math.round(kilograms * training.carbs[0]), max: Math.round(kilograms * training.carbs[1]) },
  };
}