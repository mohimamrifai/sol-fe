// NPWP formatter. Accepts any string containing digits, dots, dashes, spaces.
// Returns canonical Indonesian NPWP format: 99.999.999.9-999.999 (15 digits).
// 16-digit version (with KPP code suffix) is also supported.

export const NPWP_DIGIT_COUNT = 15;

export function formatNpwp(raw: string): string {
  const digits = (raw.match(/\d/g) ?? []).slice(0, 16).join("");
  if (digits.length === 0) return "";

  // Apply canonical NPWP grouping as the user types.
  // 15-digit standard: AA.BBB.CCC.D-EEE.FFF
  // 16-digit with KPP suffix: AA.BBB.CCC.D-EEE.FFF.G
  const a = digits.slice(0, 2);
  const b = digits.slice(2, 5);
  const c = digits.slice(5, 8);
  const d = digits.slice(8, 9);
  const e = digits.slice(9, 12);
  const f = digits.slice(12, 15);
  const g = digits.slice(15, 16);

  let out = a;
  if (digits.length > 2) out += "." + b;
  if (digits.length > 5) out += "." + c;
  if (digits.length > 8) out += "." + d;
  if (digits.length > 9) out += "-" + e;
  if (digits.length > 12) out += "." + f;
  if (digits.length > 15) out += "." + g;
  return out;
}

export function isValidNpwp(raw: string): boolean {
  const digits = (raw.match(/\d/g) ?? []).join("");
  return digits.length === NPWP_DIGIT_COUNT || digits.length === 16;
}
