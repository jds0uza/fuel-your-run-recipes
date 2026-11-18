import { useState } from "react";
import { Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { calculateDailyGoals, TRAINING_LOADS, type TrainingLoad, type WeightUnit } from "@/lib/nutrition-goals";

export function DailyGoals() {
  const [weight, setWeight] = useState("");
  const [unit, setUnit] = useState<WeightUnit>("kg");
  const [load, setLoad] = useState<TrainingLoad>("moderate");
  const goals = calculateDailyGoals(Number(weight), unit, load);
  const training = TRAINING_LOADS.find((item) => item.id === load);
  const invalid = weight !== "" && !goals;

  function changeUnit(next: WeightUnit) {
    if (next === unit) return;
    if (Number(weight) > 0) {
      setWeight(String(Math.round((next === "lb" ? Number(weight) / 0.45359237 : Number(weight) * 0.45359237) * 10) / 10));
    }
    setUnit(next);
  }

  return (
    <section aria-labelledby="daily-goals-heading" className="border-y border-border bg-secondary/50">
      <div className="mx-auto max-w-6xl px-6 py-5">
        <div className="flex flex-wrap items-end gap-x-6 gap-y-4">
          <div className="mr-auto min-w-48">
            <h2 id="daily-goals-heading" className="flex items-center gap-2 text-lg sm:text-xl">
              <Target className="size-5 shrink-0 text-primary" aria-hidden /> Your daily fuel goals
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">Protein and carb ranges for your weight and today’s training.</p>
          </div>

          <div>
            <Label htmlFor="goal-weight" className="text-xs text-muted-foreground">Body weight</Label>
            <div className="mt-1.5 flex gap-1.5">
              <Input id="goal-weight" type="number" inputMode="decimal" min="0.1" step="any" placeholder="e.g. 70" value={weight} onChange={(event) => setWeight(event.target.value)} aria-invalid={invalid} aria-describedby={invalid ? "weight-error" : undefined} className="h-9 w-24 min-w-0 bg-background" />
              <div role="group" aria-label="Weight unit" className="flex shrink-0 gap-1">
                {(["kg", "lb"] as const).map((value) => (
                  <Button key={value} variant={unit === value ? "default" : "outline"} size="sm" onClick={() => changeUnit(value)} aria-pressed={unit === value} className="h-9 w-9 px-0 text-xs">{value}</Button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="training-load" className="text-xs text-muted-foreground">Today’s training</Label>
            <Select value={load} onValueChange={(value) => {
              const selected = TRAINING_LOADS.find((item) => item.id === value);
              if (selected) setLoad(selected.id);
            }}>
              <SelectTrigger id="training-load" className="mt-1.5 h-9 w-44 bg-background text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>{TRAINING_LOADS.map((item) => <SelectItem key={item.id} value={item.id}>{item.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <div aria-live="polite" aria-atomic="true" className="flex items-end gap-5 sm:gap-8">
            <div className="border-t-2 border-protein pt-1.5">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-protein">Protein</h3>
              <p data-testid="protein-goal" className="mt-1 min-h-8 font-display text-2xl leading-none sm:text-3xl">{goals ? `${goals.protein.min}–${goals.protein.max}` : "—"}<span className="ml-1 font-sans text-xs text-muted-foreground">g/day</span></p>
            </div>
            <div className="border-t-2 border-carb pt-1.5">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-carb">Carbs</h3>
              <p data-testid="carb-goal" className="mt-1 min-h-8 font-display text-2xl leading-none sm:text-3xl">{goals ? `${goals.carbs.min}–${goals.carbs.max}` : "—"}<span className="ml-1 font-sans text-xs text-muted-foreground">g/day</span></p>
            </div>
          </div>
        </div>

        {invalid && <p id="weight-error" className="mt-2 text-sm text-destructive">Enter a weight greater than zero.</p>}

        <details className="mt-3 max-w-3xl text-xs text-muted-foreground">
          <summary className="cursor-pointer select-none">How these numbers are set</summary>
          <p className="mt-1.5 leading-relaxed">
            {training?.label}: {training?.duration}. Protein {goals ? `${goals.protein.min}–${goals.protein.max}` : "—"} g/day is 1.2–2.0 g per kg; carbs follow {training?.carbs[0]}–{training?.carbs[1]} g per kg for this load.
            General adult athlete guidelines, not a personal prescription or calorie target — needs vary with training, recovery and health, and a sports dietitian can tailor your plan.
            <a href="https://doi.org/10.1249/MSS.0000000000000852" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2"> Source: Nutrition and Athletic Performance (ACSM, 2016).</a>
          </p>
        </details>
      </div>
    </section>
  );
}
