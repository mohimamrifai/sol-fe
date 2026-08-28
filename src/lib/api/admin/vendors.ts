import { apiFetch } from "../../api-client";
import { buildListQuery, normalizeListParams, type ListQueryParams } from "../../list-query";
import type { LaravelPaginated } from "../../types-api";

export async function fetchAdminVendorStats() {
  return apiFetch<{ data: Record<string, number> }>(`/admin/vendors/stats`, { method: "GET" });
}

export async function fetchAdminVendors(input?: number | ListQueryParams & {
  business_entity?: string;
  vendor_type?: string;
  status?: string;
}) {
  const params = normalizeListParams(input);
  const q = buildListQuery(params);
  const extra = new URLSearchParams();
  if (params && typeof params === "object" && "business_entity" in params && params.business_entity) {
    extra.set("business_entity", String(params.business_entity));
  }
  if (params && typeof params === "object" && "vendor_type" in params && params.vendor_type) {
    extra.set("vendor_type", String(params.vendor_type));
  }
  if (params && typeof params === "object" && "status" in params && params.status) {
    extra.set("status", String(params.status));
  }
  const suffix = extra.toString() ? `${q}${q.includes("?") ? "&" : "?"}${extra}` : q;
  return apiFetch<LaravelPaginated<Record<string, unknown>>>(`/admin/vendors${suffix}`, { method: "GET" });
}

export async function fetchAdminVendor(id: number) {
  return apiFetch<{ data: Record<string, unknown> }>(`/admin/vendors/${id}`, { method: "GET" });
}

export async function fetchAdminVendorVehicleTypes(vendorId: number) {
  return apiFetch<{ data: string[] }>(`/admin/vendors/${vendorId}/vehicle-types`, { method: "GET" });
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

export async function deactivateAdminVendor(id: number) {
  return apiFetch(`/admin/vendors/${id}/deactivate`, { method: "POST" });
}

export async function createAdminVendorContact(vendorId: number, body: Record<string, unknown>) {
  return apiFetch(`/admin/vendors/${vendorId}/contacts`, { method: "POST", body: JSON.stringify(body) });
}

export async function updateAdminVendorContact(vendorId: number, contactId: number, body: Record<string, unknown>) {
  return apiFetch(`/admin/vendors/${vendorId}/contacts/${contactId}`, { method: "PUT", body: JSON.stringify(body) });
}

export async function deleteAdminVendorContact(vendorId: number, contactId: number) {
  return apiFetch(`/admin/vendors/${vendorId}/contacts/${contactId}`, { method: "DELETE" });
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

export async function fetchAdminPricingStats() {
  return apiFetch<{ data: Record<string, number> }>(`/admin/pricings/stats`, { method: "GET" });
}

export async function fetchAdminPricings(input?: ListQueryParams & {
  vendor_id?: number | string;
  service_category?: string;
  status?: string;
}) {
  const params = normalizeListParams(input);
  const q = buildListQuery(params);
  const extra = new URLSearchParams();
  if (input?.vendor_id) extra.set("vendor_id", String(input.vendor_id));
  if (input?.service_category) extra.set("service_category", input.service_category);
  if (input?.status) extra.set("status", input.status);
  const suffix = extra.toString() ? `${q}${q.includes("?") ? "&" : "?"}${extra}` : q;
  return apiFetch<LaravelPaginated<Record<string, unknown>>>(`/admin/pricings${suffix}`, { method: "GET" });
}

export async function fetchAdminPricing(id: number) {
  return apiFetch<{ data: Record<string, unknown> }>(`/admin/pricings/${id}`, { method: "GET" });
}

export async function createAdminPricing(body: Record<string, unknown>) {
  return apiFetch(`/admin/pricings`, { method: "POST", body: JSON.stringify(body) });
}

export async function deactivateAdminPricing(id: number) {
  return apiFetch(`/admin/pricings/${id}/deactivate`, { method: "POST" });
}
