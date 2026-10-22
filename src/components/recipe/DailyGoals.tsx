import { useState } from "react";
import { Activity, Target } from "lucide-react";
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
      <div className="mx-auto max-w-6xl px-6 py-10 sm:py-12">
        <div className="flex items-center gap-3">
          <Target className="size-7 shrink-0 text-primary" aria-hidden />
          <h2 id="daily-goals-heading" className="text-3xl sm:text-4xl">Your daily fuel goals</h2>
        </div>
        <p className="mt-2 text-muted-foreground">Daily protein and carbohydrate ranges for your body weight and today’s training.</p>
        <div className="mt-7 grid gap-8 lg:grid-cols-2 lg:gap-12">
          <div className="space-y-5">
            <div>
              <Label htmlFor="goal-weight">Body weight</Label>
              <div className="mt-2 flex max-w-sm gap-2">
                <Input id="goal-weight" type="number" inputMode="decimal" min="0.1" step="any" placeholder="Enter weight" value={weight} onChange={(event) => setWeight(event.target.value)} aria-invalid={invalid} aria-describedby={invalid ? "weight-error" : undefined} className="h-11 min-w-0 bg-background" />
                <div role="group" aria-label="Weight unit" className="flex shrink-0 gap-1">
                  {(["kg", "lb"] as const).map((value) => (
                    <Button key={value} variant={unit === value ? "default" : "outline"} onClick={() => changeUnit(value)} aria-pressed={unit === value} className="h-11 w-12 px-0">{value}</Button>
                  ))}
                </div>
              </div>
              {invalid && <p id="weight-error" className="mt-2 text-sm text-destructive">Enter a weight greater than zero.</p>}
            </div>
            <div>
              <Label htmlFor="training-load">Today’s training load</Label>
              <Select value={load} onValueChange={(value) => {
                const selected = TRAINING_LOADS.find((item) => item.id === value);
                if (selected) setLoad(selected.id);
              }}>
                <SelectTrigger id="training-load" className="mt-2 h-11 bg-background"><SelectValue /></SelectTrigger>
                <SelectContent>{TRAINING_LOADS.map((item) => <SelectItem key={item.id} value={item.id}>{item.label}</SelectItem>)}</SelectContent>
              </Select>
              <p className="mt-2 flex items-start gap-2 text-sm text-muted-foreground"><Activity className="mt-0.5 size-4 shrink-0" aria-hidden />{training?.duration}</p>
            </div>
          </div>
          <div aria-live="polite" aria-atomic="true" className="grid grid-cols-2 gap-4 self-center sm:gap-8">
            <div className="border-t-2 border-protein pt-4">
              <h3 className="text-xl text-protein">Protein</h3>
              <p data-testid="protein-goal" className="mt-3 min-h-12 font-display text-3xl leading-none sm:text-5xl">{goals ? `${goals.protein.min}–${goals.protein.max}` : "—"}<span className="ml-1 font-sans text-base text-muted-foreground">g/day</span></p>
              <p className="mt-3 text-sm text-muted-foreground">1.2–2.0 g per kg daily</p>
            </div>
            <div className="border-t-2 border-carb pt-4">
              <h3 className="text-xl text-carb">Carbohydrates</h3>
              <p data-testid="carb-goal" className="mt-3 min-h-12 font-display text-3xl leading-none sm:text-5xl">{goals ? `${goals.carbs.min}–${goals.carbs.max}` : "—"}<span className="ml-1 font-sans text-base text-muted-foreground">g/day</span></p>
              <p className="mt-3 text-sm text-muted-foreground">{training?.carbs[0]}–{training?.carbs[1]} g per kg daily</p>
            </div>
          </div>
        </div>
        <p className="mt-7 max-w-3xl text-xs leading-relaxed text-muted-foreground">General adult athlete guidelines, not a personal prescription or calorie target. Needs vary with training, recovery and health; a sports dietitian can tailor your plan. <a href="https://doi.org/10.1249/MSS.0000000000000852" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">Source: Nutrition and Athletic Performance (ACSM, 2016).</a></p>
      </div>
    </section>
  );
}