import { apiFetch } from "../../api-client";
import { buildListQuery, normalizeListParams, type ListQueryParams } from "../../list-query";
import type { LaravelPaginated } from "../../types-api";

type PodQuery = ListQueryParams & Record<string, string | number | undefined>;

function buildPodQuery(params?: PodQuery): string {
  const base = buildListQuery(params);
  const extra = new URLSearchParams();
  if (!params) return base;
  for (const [key, value] of Object.entries(params)) {
    if (["page", "perPage", "search", "status"].includes(key)) continue;
    if (value != null && value !== "") extra.set(key, String(value));
  }
  const suffix = extra.toString();
  if (!suffix) return base;
  return `${base}${base.includes("?") ? "&" : "?"}${suffix}`;
}

export async function fetchAdminProofOfDeliveryStats() {
  return apiFetch<{ data: Record<string, number> }>(`/admin/proof-of-deliveries/stats`);
}

export async function fetchAdminProofOfDeliveries(params?: PodQuery) {
  return apiFetch<LaravelPaginated<Record<string, unknown>>>(
    `/admin/proof-of-deliveries${buildPodQuery(normalizeListParams(params))}`
  );
}

export async function fetchAdminProofOfDelivery(id: number) {
  return apiFetch<{ data: Record<string, unknown> }>(`/admin/proof-of-deliveries/${id}`);
}

export async function submitAdminProofOfDelivery(id: number, form: FormData) {
  return apiFetch(`/admin/proof-of-deliveries/${id}/submit`, { method: "POST", body: form });
}

export async function verifyAdminProofOfDelivery(id: number, body?: Record<string, unknown>) {
  return apiFetch(`/admin/proof-of-deliveries/${id}/verify`, {
    method: "POST",
    body: JSON.stringify(body ?? {}),
  });
}

export async function rejectAdminProofOfDelivery(id: number, body?: Record<string, unknown>) {
  return apiFetch(`/admin/proof-of-deliveries/${id}/reject`, {
    method: "POST",
    body: JSON.stringify(body ?? {}),
  });
}
