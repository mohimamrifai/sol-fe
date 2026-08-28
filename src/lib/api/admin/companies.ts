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

export async function fetchAdminPostalCodes(input: {
  province?: string;
  city: string;
  district?: string;
}) {
  const query = new URLSearchParams();
  if (input.province) query.set("province", input.province);
  query.set("city", input.city);
  if (input.district) query.set("district", input.district);

  return apiFetch<{ data: Array<{ value: string; label: string }> }>(
    `/admin/customer-postal-codes?${query.toString()}`,
    { method: "GET" },
  );
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

export async function fetchAdminCompanyStats() {
  return apiFetch<{ data: Record<string, number> }>(`/admin/companies/stats`, { method: "GET" });
}

export async function suspendAdminCompany(id: number) {
  return apiFetch(`/admin/companies/${id}/suspend`, { method: "POST", body: JSON.stringify({}) });
}

export async function fetchAdminCompanyLocations(companyId: number, input?: ListQueryParams) {
  const params = normalizeListParams(input);
  return apiFetch<LaravelPaginated<Record<string, unknown>>>(
    `/admin/companies/${companyId}/locations${buildListQuery(params)}`,
    { method: "GET" }
  );
}

export async function createAdminCompanyLocation(companyId: number, body: Record<string, unknown>) {
  return apiFetch(`/admin/companies/${companyId}/locations`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function updateAdminCompanyLocation(
  companyId: number,
  locationId: number,
  body: Record<string, unknown>
) {
  return apiFetch(`/admin/companies/${companyId}/locations/${locationId}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export async function changeAdminCompanyLocationStatus(
  companyId: number,
  locationId: number,
  status: "active" | "inactive"
) {
  return apiFetch(`/admin/companies/${companyId}/locations/${locationId}/status`, {
    method: "POST",
    body: JSON.stringify({ status }),
  });
}

export async function deleteAdminCompanyLocation(companyId: number, locationId: number) {
  return apiFetch(`/admin/companies/${companyId}/locations/${locationId}`, { method: "DELETE" });
}
