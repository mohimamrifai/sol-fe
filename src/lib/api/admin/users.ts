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

export async function changeAdminUserStatus(id: number, status: string) {
  return apiFetch(`/admin/users/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function resetAdminUserPassword(id: number, password: string, passwordConfirmation: string) {
  return apiFetch(`/admin/users/${id}/reset-password`, {
    method: "POST",
    body: JSON.stringify({ password, password_confirmation: passwordConfirmation }),
  });
}

export async function fetchAdminRoles(params?: { search?: string; status?: string }) {
  const query = new URLSearchParams();
  if (params?.search) query.set("search", params.search);
  if (params?.status && params.status !== "all") query.set("status", params.status);
  const qs = query.toString();
  return apiFetch<{ data: Record<string, unknown>[] }>(`/admin/roles${qs ? `?${qs}` : ""}`, { method: "GET" });
}

export async function fetchAdminRoleStats() {
  return apiFetch<{ data: { total: number; active: number; inactive: number } }>(`/admin/roles/stats`, { method: "GET" });
}

export async function fetchAdminRole(id: number) {
  return apiFetch<{ data: Record<string, unknown> }>(`/admin/roles/${id}`, { method: "GET" });
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

export async function storeAdminRole(body: Record<string, unknown>) {
  return apiFetch(`/admin/roles`, { method: "POST", body: JSON.stringify(body) });
}

export async function updateAdminRole(id: number, body: Record<string, unknown>) {
  return apiFetch(`/admin/roles/${id}`, { method: "PUT", body: JSON.stringify(body) });
}

export async function deactivateAdminRole(id: number) {
  return apiFetch(`/admin/roles/${id}/deactivate`, { method: "POST" });
}
