export function getApiBaseUrl(): string {
  const base = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "";
  if (!base && typeof window !== "undefined") {
    console.warn("NEXT_PUBLIC_API_URL is not set; API calls will fail.");
  }
  return base;
}

export function apiUrl(path: string): string {
  const base = getApiBaseUrl();
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}/api${p}`;
}
