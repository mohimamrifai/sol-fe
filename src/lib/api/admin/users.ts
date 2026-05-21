import { apiFetch } from "../../api-client";
import { buildListQuery, normalizeListParams, type ListQueryParams } from "../../list-query";
import type { LaravelPaginated } from "../../types-api";

export async function fetchAdminUsers(input?: number | ListQueryParams) {
  const params = normalizeListParams(input);
  return apiFetch<LaravelPaginated<Record<string, unknown>>>(
    `/admin/users${buildListQuery(params)}`,
    { method: "GET" }
  );
}

export async function fetchAdminUser(id: number) {
  return apiFetch<{ data: Record<string, unknown> }>(`/admin/users/${id}`, { method: "GET" });
}

export async function createAdminUser(body: Record<string, unknown>) {
  return apiFetch(`/admin/users`, { method: "POST", body: JSON.stringify(body) });
}

export async function updateAdminUser(id: number, body: Record<string, unknown>) {
  return apiFetch(`/admin/users/${id}`, { method: "PUT", body: JSON.stringify(body) });
}

export async function deleteAdminUser(id: number) {
  return apiFetch(`/admin/users/${id}`, { method: "DELETE" });
}

export async function fetchAdminRoles() {
  return apiFetch<{ data: Record<string, unknown>[] }>(`/admin/roles`, { method: "GET" });
}

export async function fetchAdminPermissions() {
  return apiFetch<{ data: Record<string, unknown>[] }>(`/admin/permissions`, { method: "GET" });
}

export async function updateAdminRolePermissions(roleId: number, permissions: string[]) {
  return apiFetch(`/admin/roles/${roleId}/permissions`, {
    method: "PUT",
    body: JSON.stringify({ permissions }),
  });
}
