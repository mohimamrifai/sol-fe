import { apiUrl, getApiBaseUrl } from "./api-config";

const TOKEN_KEY = "sol_token";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public body?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string | null): void {
  if (typeof window === "undefined") return;
  if (token) sessionStorage.setItem(TOKEN_KEY, token);
  else sessionStorage.removeItem(TOKEN_KEY);
}

export type LaravelValidationErrors = Record<string, string[]>;

const MISSING_BASE_MSG =
  "NEXT_PUBLIC_API_URL belum di-set. Buat file sol-frontend/.env.local berisi NEXT_PUBLIC_API_URL=http://localhost:8000 lalu restart server Next.js (pnpm dev).";

function assertApiBaseConfigured(): void {
  if (!getApiBaseUrl()) {
    throw new ApiError(MISSING_BASE_MSG, 0);
  }
}

function networkFailureMessage(path: string, err: unknown): string {
  const url = apiUrl(path);
  const detail = err instanceof Error ? err.message : String(err);
  return [
    "Tidak dapat terhubung ke API Laravel.",
    `URL: ${url}`,
    "Pastikan: (1) php artisan serve di folder Laravel, (2) NEXT_PUBLIC_API_URL di .env.local sama dengan origin API, (3) di .env Laravel, FRONTEND_URLS memuat origin Next (mis. http://localhost:3000).",
    `Detail: ${detail}`,
  ].join(" ");
}

export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit & { token?: string | null } = {}
): Promise<T> {
  assertApiBaseConfigured();

  const { token = getStoredToken(), ...init } = options;
  const headers = new Headers(init.headers);

  if (!headers.has("Content-Type") && init.body && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  headers.set("Accept", "application/json");

  let res: Response;
  try {
    res = await fetch(apiUrl(path), {
      ...init,
      headers,
      signal: init.signal, // Pass the AbortSignal
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw err; // Re-throw AbortError to be handled by TanStack Query
    }
    throw new ApiError(networkFailureMessage(path, err), 0, err);
  }

  const contentType = res.headers.get("content-type");
  const isJson = contentType?.includes("application/json");
  const body = isJson ? await res.json().catch(() => null) : await res.text();

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("sol_token");
        sessionStorage.removeItem("sol_profile_cached_at");
        // We use window.location.href instead of router.push to force a full reload
        // clearing any in-memory state.
        window.location.href = "/login";
      }
    }
    const msg =
      typeof body === "object" && body !== null && "message" in body
        ? String((body as { message: string }).message)
        : res.statusText;
    throw new ApiError(msg || "Request failed", res.status, body);
  }

  return body as T;
}

export type BlobDownloadProgress = {
  loaded: number;
  total: number | null;
};

/** For PDF/binary responses (e.g. invoice download). Streams body when possible so `onProgress` can update UI. */
export async function apiFetchBlob(
  path: string,
  options: RequestInit & {
    token?: string | null;
    onProgress?: (p: BlobDownloadProgress) => void;
  } = {}
): Promise<Blob> {
  assertApiBaseConfigured();

  const { token = getStoredToken(), onProgress, ...init } = options;
  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  headers.set("Accept", "application/pdf, */*");

  let res: Response;
  try {
    res = await fetch(apiUrl(path), { ...init, headers });
  } catch (err) {
    throw new ApiError(networkFailureMessage(path, err), 0, err);
  }
  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("sol_token");
        sessionStorage.removeItem("sol_profile_cached_at");
        window.location.href = "/login";
      }
    }
    const text = await res.text();
    let msg = text || res.statusText;
    try {
      const j = JSON.parse(text) as { message?: string };
      if (j?.message) msg = j.message;
    } catch {
      /* keep text */
    }
    throw new ApiError(msg, res.status);
  }

  if (!res.body) {
    const blob = await res.blob();
    onProgress?.({ loaded: blob.size, total: blob.size > 0 ? blob.size : null });
    return blob;
  }

  const len = res.headers.get("content-length");
  const parsed = len != null && len !== "" ? Number(len) : NaN;
  const total = Number.isFinite(parsed) && parsed > 0 ? parsed : null;

  const reader = res.body.getReader();
  const chunks: BlobPart[] = [];
  let loaded = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value?.byteLength) {
      chunks.push(value);
      loaded += value.byteLength;
      onProgress?.({ loaded, total });
    }
  }

  return new Blob(chunks);
}
