import { SELECT_EMPTY_VALUE } from "@/lib/select-field";

/** Turn snake_case API codes into readable title-case labels (fallback only). */
export function humanizeSnakeCase(code: string | null | undefined): string {
  const c = String(code ?? "").trim();
  if (!c || c === "—" || c === SELECT_EMPTY_VALUE) return "—";
  if (!c.includes("_")) return c;
  return c
    .split("_")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}
