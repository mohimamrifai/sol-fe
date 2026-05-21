/** Opsi siklus penagihan (nilai API → label UI). */
export const BILLING_CYCLE_OPTIONS = [
  { value: "half_monthly_1", label: "Setengah bulan (tanggal 1–15)" },
  { value: "half_monthly_2", label: "Setengah bulan (tanggal 16–akhir bulan)" },
  { value: "both_half", label: "Dua periode (gabungan)" },
  { value: "end_of_month", label: "Akhir bulan" },
] as const;

const MAP: Record<string, string> = Object.fromEntries(
  BILLING_CYCLE_OPTIONS.map((o) => [o.value, o.label])
);

function humanizeSnake(code: string): string {
  return code
    .split("_")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

/** Label tampilan untuk kode billing_cycle dari API; tidak menampilkan snake_case mentah. */
export function billingCycleLabel(code: string | null | undefined): string {
  const c = String(code ?? "").trim();
  if (!c || c === "—") return "—";
  return MAP[c] ?? (c.includes("_") ? humanizeSnake(c) : c);
}
