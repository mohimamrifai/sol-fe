import { apiFetch } from "../../api-client";
import { buildListQuery, normalizeListParams, type ListQueryParams } from "../../list-query";
import type { LaravelPaginated } from "../../types-api";

type ContainerQuery = ListQueryParams & Record<string, string | number | undefined>;

function buildContainerQuery(params?: ContainerQuery): string {
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

export async function fetchAdminContainerStats() {
  return apiFetch<{ data: Record<string, number> }>(`/admin/containers/stats`);
}

export async function fetchAdminContainers(params?: ContainerQuery) {
  return apiFetch<LaravelPaginated<Record<string, unknown>>>(
    `/admin/containers${buildContainerQuery(normalizeListParams(params))}`
  );
}

export async function fetchAdminContainer(id: number) {
  return apiFetch<{ data: Record<string, unknown> }>(`/admin/containers/${id}`);
}

export async function createAdminContainer(body: Record<string, unknown>) {
  return apiFetch(`/admin/containers`, { method: "POST", body: JSON.stringify(body) });
}

export async function updateAdminContainer(id: number, body: Record<string, unknown>) {
  return apiFetch(`/admin/containers/${id}`, { method: "PUT", body: JSON.stringify(body) });
}

export async function fetchAdminContainerMovements(params?: ContainerQuery) {
  return apiFetch<LaravelPaginated<Record<string, unknown>>>(
    `/admin/container-movements${buildContainerQuery(normalizeListParams(params))}`
  );
}
