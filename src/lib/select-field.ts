/** Internal select value for optional fields — never show this string in the UI. */
export const SELECT_EMPTY_VALUE = "__none__";

export function normalizeSelectField(value: unknown): string {
  const s = String(value ?? "").trim();
  return s === SELECT_EMPTY_VALUE ? "" : s;
}

export function toSelectFieldValue(value: string | undefined | null): string {
  return normalizeSelectField(value) || SELECT_EMPTY_VALUE;
}

export function fromSelectFieldValue(value: string | null | undefined): string {
  if (value == null || value === SELECT_EMPTY_VALUE) return "";
  return value;
}

export function optionLabel(
  value: string | undefined | null,
  options: readonly { value: string; label: string }[],
  emptyLabel = "—"
): string {
  const normalized = normalizeSelectField(value);
  if (!normalized) return emptyLabel;
  return options.find((o) => o.value === normalized)?.label ?? normalized;
}
