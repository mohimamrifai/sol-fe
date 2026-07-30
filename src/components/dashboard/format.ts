/**
 * Format a number as Indonesian Rupiah (id-ID) without fractional digits.
 * Falls back gracefully when the value is null / undefined / non-numeric.
 */
export function formatIdr(value: number | string | null | undefined): string {
  const n = typeof value === "string" ? Number(value) : value;
  if (n == null || !Number.isFinite(n)) return "—";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);
}

/**
 * Render a date in `id-ID` short format, e.g. "30 Jul 2026".
 */
export function formatShortDate(value: string | null | undefined, locale: string): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}

/**
 * Render a date-time as a short relative label, e.g. "2 jam yang lalu"
 * / "2 hours ago". Falls back to absolute short date when the input is
 * invalid or in the future.
 */
export function formatRelative(
  value: string | null | undefined,
  locale: string,
  now: Date = new Date(),
): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (locale === "en") {
    if (diffSec < 60) return "just now";
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)} min ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} hr ago`;
    if (diffSec < 604800) return `${Math.floor(diffSec / 86400)} day${Math.floor(diffSec / 86400) === 1 ? "" : "s"} ago`;
    return formatShortDate(value, locale);
  }

  // Bahasa Indonesia
  if (diffSec < 60) return "baru saja";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} menit lalu`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} jam lalu`;
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)} hari lalu`;
  return formatShortDate(value, locale);
}
