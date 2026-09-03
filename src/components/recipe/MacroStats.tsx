type Props = {
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  fiber_g?: number | null;
  compact?: boolean;
};

function fmt(value: number | null | undefined, suffix = "") {
  if (value === null || value === undefined) return "—";
  return `${Math.round(value * 10) / 10}${suffix}`;
}

export function proteinGrade(ratio: number | null) {
  if (ratio === null) return { label: "No data", tone: "muted" as const };
  if (ratio >= 10) return { label: "Protein dense", tone: "protein" as const };
  if (ratio >= 6) return { label: "Balanced", tone: "accent" as const };
  return { label: "Carb heavy", tone: "carb" as const };
}

export function ProteinRatioBadge({ ratio }: { ratio: number | null }) {
  const grade = proteinGrade(ratio);
  const toneClass =
    grade.tone === "protein"
      ? "border-protein/40 bg-protein/10 text-protein"
      : grade.tone === "carb"
        ? "border-carb/40 bg-carb/10 text-carb"
        : grade.tone === "accent"
          ? "border-accent/60 bg-accent/25 text-accent-foreground"
          : "border-border bg-muted text-muted-foreground";

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${toneClass}`}
      title="Grams of protein per 100 kcal"
    >
      <span className="stat-number text-base">{ratio === null ? "—" : ratio.toFixed(1)}</span>
      g protein / 100 kcal · {grade.label}
    </span>
  );
}

export function MacroStats({ calories, protein_g, carbs_g, fat_g, fiber_g, compact }: Props) {
  const items = [
    { label: "kcal", value: fmt(calories), color: "text-foreground" },
    { label: "protein", value: fmt(protein_g, "g"), color: "text-protein" },
    { label: "carbs", value: fmt(carbs_g, "g"), color: "text-carb" },
    { label: "fat", value: fmt(fat_g, "g"), color: "text-fat" },
  ];
  if (!compact) items.push({ label: "fiber", value: fmt(fiber_g, "g"), color: "text-muted-foreground" });

  return (
    <div className={`grid ${compact ? "grid-cols-4" : "grid-cols-5"} gap-2`}>
      {items.map((item) => (
        <div key={item.label} className="rounded-md border border-border bg-secondary/40 px-2 py-1.5 text-center">
          <div className={`stat-number text-xl ${item.color}`}>{item.value}</div>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {item.label}
          </div>
        </div>
      ))}
    </div>
  );
}

export function MacroSplitBar({
  protein_g,
  carbs_g,
  fat_g,
}: {
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
}) {
  const p = (protein_g ?? 0) * 4;
  const c = (carbs_g ?? 0) * 4;
  const f = (fat_g ?? 0) * 9;
  const total = p + c + f;
  if (total <= 0) return null;
  const pct = (v: number) => `${(v / total) * 100}%`;

  return (
    <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted">
      <div style={{ width: pct(p) }} className="bg-protein" title="Protein calories" />
      <div style={{ width: pct(c) }} className="bg-carb" title="Carb calories" />
      <div style={{ width: pct(f) }} className="bg-fat" title="Fat calories" />
    </div>
  );
}
