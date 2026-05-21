import { apiFetch } from "../../api-client";
import { buildListQuery, normalizeListParams, type ListQueryParams } from "../../list-query";
import type { LaravelPaginated } from "../../types-api";

export async function fetchAdminCompanies(input?: number | ListQueryParams) {
  const params = normalizeListParams(input);
  return apiFetch<LaravelPaginated<Record<string, unknown>>>(
    `/admin/companies${buildListQuery(params)}`,
    { method: "GET" }
  );
}

export async function fetchAdminCompany(id: number) {
  return apiFetch<{ data: Record<string, unknown> }>(`/admin/companies/${id}`, { method: "GET" });
}

export async function createAdminCompany(body: Record<string, unknown>) {
  return apiFetch<{ data: Record<string, unknown>; message?: string }>(`/admin/companies`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function updateAdminCompany(id: number, body: Record<string, unknown>) {
  return apiFetch<{ data: Record<string, unknown>; message?: string }>(`/admin/companies/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export async function deleteAdminCompany(id: number) {
  return apiFetch(`/admin/companies/${id}`, { method: "DELETE" });
}

export async function approveAdminCompany(id: number) {
  return apiFetch(`/admin/companies/${id}/approve`, { method: "POST", body: JSON.stringify({}) });
}

export async function rejectAdminCompany(id: number, reason: string) {
  return apiFetch(`/admin/companies/${id}/reject`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

export async function fetchAdminCompanyBranches(companyId: number, input?: number | ListQueryParams) {
  const params = normalizeListParams(input);
  return apiFetch<LaravelPaginated<Record<string, unknown>>>(
    `/admin/companies/${companyId}/branches${buildListQuery(params)}`,
    { method: "GET" }
  );
}

export async function createAdminBranch(companyId: number, body: Record<string, unknown>) {
  return apiFetch(`/admin/companies/${companyId}/branches`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function updateAdminBranch(companyId: number, branchId: number, body: Record<string, unknown>) {
  return apiFetch(`/admin/companies/${companyId}/branches/${branchId}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export async function deleteAdminBranch(companyId: number, branchId: number) {
  return apiFetch(`/admin/companies/${companyId}/branches/${branchId}`, { method: "DELETE" });
}

export async function fetchAdminCustomerDiscounts(companyId: number, input?: number | ListQueryParams) {
  const params = normalizeListParams(input);
  return apiFetch<LaravelPaginated<Record<string, unknown>>>(
    `/admin/companies/${companyId}/customer-discounts${buildListQuery(params)}`,
    { method: "GET" }
  );
}

export async function createAdminCustomerDiscount(companyId: number, body: Record<string, unknown>) {
  return apiFetch(`/admin/companies/${companyId}/customer-discounts`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function updateAdminCustomerDiscount(
  companyId: number,
  discountId: number,
  body: Record<string, unknown>
) {
  return apiFetch(`/admin/companies/${companyId}/customer-discounts/${discountId}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export async function deleteAdminCustomerDiscount(companyId: number, discountId: number) {
  return apiFetch(`/admin/companies/${companyId}/customer-discounts/${discountId}`, { method: "DELETE" });
}
