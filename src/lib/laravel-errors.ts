import type { LaravelValidationErrors } from "./api-client";

/** Ambil pesan error pertama dari body validasi Laravel (422). */
export function firstLaravelError(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  const o = body as { message?: string; errors?: LaravelValidationErrors };
  if (o.errors && typeof o.errors === "object") {
    for (const key of Object.keys(o.errors)) {
      const arr = o.errors[key];
      if (Array.isArray(arr) && arr[0]) return String(arr[0]);
    }
  }
  if (typeof o.message === "string") return o.message;
  return null;
}
