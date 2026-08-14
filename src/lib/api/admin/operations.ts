import { apiFetch } from "../../api-client";
import { buildListQuery, normalizeListParams, type ListQueryParams } from "../../list-query";
import type { LaravelPaginated } from "../../types-api";

type OperationQuery = ListQueryParams & Record<string, string | number | undefined>;

function buildOperationQuery(params?: OperationQuery): string {
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

export async function fetchAdminOperationTaskStats(type: string) {
  return apiFetch<{ data: Record<string, number> }>(`/admin/operation-tasks/${type}/stats`);
}

export async function fetchAdminOperationTasks(type: string, params?: OperationQuery) {
  return apiFetch<LaravelPaginated<Record<string, unknown>>>(
    `/admin/operation-tasks/${type}${buildOperationQuery(normalizeListParams(params))}`
  );
}

export async function fetchAdminOperationTask(id: number) {
  return apiFetch<{ data: Record<string, unknown> }>(`/admin/operation-tasks/task/${id}`);
}

export async function startAdminOperationTask(id: number) {
  return apiFetch(`/admin/operation-tasks/${id}/start`, { method: "POST" });
}

export async function completeAdminOperationTask(id: number) {
  return apiFetch(`/admin/operation-tasks/${id}/complete`, { method: "POST" });
}

export async function updateAdminOperationTaskRemark(id: number, body: Record<string, unknown>) {
  return apiFetch(`/admin/operation-tasks/${id}/remark`, { method: "PUT", body: JSON.stringify(body) });
}

export async function uploadAdminOperationTaskDocument(id: number, file: File, documentType?: string) {
  const form = new FormData();
  form.append("file", file);
  if (documentType) form.append("document_type", documentType);
  return apiFetch(`/admin/operation-tasks/${id}/documents`, { method: "POST", body: form });
}
