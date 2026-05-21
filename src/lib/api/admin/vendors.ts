import { apiFetch } from "../../api-client";
import { buildListQuery, normalizeListParams, type ListQueryParams } from "../../list-query";
import type { LaravelPaginated } from "../../types-api";

export async function fetchAdminVendors(input?: number | ListQueryParams) {
  const params = normalizeListParams(input);
  return apiFetch<LaravelPaginated<Record<string, unknown>>>(
    `/admin/vendors${buildListQuery(params)}`,
    { method: "GET" }
  );
}

export async function fetchAdminVendor(id: number) {
  return apiFetch<{ data: Record<string, unknown> }>(`/admin/vendors/${id}`, { method: "GET" });
}

export async function createAdminVendor(body: Record<string, unknown>) {
  return apiFetch(`/admin/vendors`, { method: "POST", body: JSON.stringify(body) });
}

export async function updateAdminVendor(id: number, body: Record<string, unknown>) {
  return apiFetch(`/admin/vendors/${id}`, { method: "PUT", body: JSON.stringify(body) });
}

export async function deleteAdminVendor(id: number) {
  return apiFetch(`/admin/vendors/${id}`, { method: "DELETE" });
}

export async function createAdminVendorService(vendorId: number, body: Record<string, unknown>) {
  return apiFetch(`/admin/vendors/${vendorId}/services`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function createAdminVendorPricing(vendorServiceId: number, body: Record<string, unknown>) {
  return apiFetch(`/admin/vendor-services/${vendorServiceId}/pricings`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function updateAdminPricing(pricingId: number, body: Record<string, unknown>) {
  return apiFetch(`/admin/pricings/${pricingId}`, { method: "PUT", body: JSON.stringify(body) });
}

export async function deleteAdminPricing(pricingId: number) {
  return apiFetch(`/admin/pricings/${pricingId}`, { method: "DELETE" });
}
