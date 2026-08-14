import { apiFetch } from "../../api-client";
import { buildListQuery, normalizeListParams, type ListQueryParams } from "../../list-query";
import type { LaravelPaginated } from "../../types-api";

type MasterFsdQuery = ListQueryParams & Record<string, string | number | undefined>;

function buildMasterFsdQuery(params?: MasterFsdQuery): string {
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

// Routes
export async function fetchAdminRouteStats() {
  return apiFetch<{ data: Record<string, number> }>(`/admin/routes/stats`);
}

export async function fetchAdminRoutes(params?: MasterFsdQuery) {
  return apiFetch<LaravelPaginated<Record<string, unknown>>>(
    `/admin/routes${buildMasterFsdQuery(normalizeListParams(params))}`
  );
}

export async function fetchAdminRoute(id: number) {
  return apiFetch<{ data: Record<string, unknown> }>(`/admin/routes/${id}`);
}

export async function createAdminRoute(body: Record<string, unknown>) {
  return apiFetch(`/admin/routes`, { method: "POST", body: JSON.stringify(body) });
}

export async function updateAdminRoute(id: number, body: Record<string, unknown>) {
  return apiFetch(`/admin/routes/${id}`, { method: "PUT", body: JSON.stringify(body) });
}

export async function deactivateAdminRoute(id: number) {
  return apiFetch(`/admin/routes/${id}/deactivate`, { method: "POST" });
}

// Stations
export async function fetchAdminStationStats() {
  return apiFetch<{ data: Record<string, number> }>(`/admin/stations/stats`);
}

export async function fetchAdminStations(params?: MasterFsdQuery) {
  return apiFetch<LaravelPaginated<Record<string, unknown>>>(
    `/admin/stations${buildMasterFsdQuery(normalizeListParams(params))}`
  );
}

export async function fetchAdminStation(id: number) {
  return apiFetch<{ data: Record<string, unknown> }>(`/admin/stations/${id}`);
}

export async function createAdminStation(body: Record<string, unknown>) {
  return apiFetch(`/admin/stations`, { method: "POST", body: JSON.stringify(body) });
}

export async function updateAdminStation(id: number, body: Record<string, unknown>) {
  return apiFetch(`/admin/stations/${id}`, { method: "PUT", body: JSON.stringify(body) });
}

export async function deactivateAdminStation(id: number) {
  return apiFetch(`/admin/stations/${id}/deactivate`, { method: "POST" });
}

// Yards
export async function fetchAdminYardStats() {
  return apiFetch<{ data: Record<string, number> }>(`/admin/yards/stats`);
}

export async function fetchAdminYards(params?: MasterFsdQuery) {
  return apiFetch<LaravelPaginated<Record<string, unknown>>>(
    `/admin/yards${buildMasterFsdQuery(normalizeListParams(params))}`
  );
}

export async function fetchAdminYard(id: number) {
  return apiFetch<{ data: Record<string, unknown> }>(`/admin/yards/${id}`);
}

export async function createAdminYard(body: Record<string, unknown>) {
  return apiFetch(`/admin/yards`, { method: "POST", body: JSON.stringify(body) });
}

export async function updateAdminYard(id: number, body: Record<string, unknown>) {
  return apiFetch(`/admin/yards/${id}`, { method: "PUT", body: JSON.stringify(body) });
}

export async function deactivateAdminYard(id: number) {
  return apiFetch(`/admin/yards/${id}/deactivate`, { method: "POST" });
}

// Additional charges
export async function fetchAdminAdditionalChargeStats() {
  return apiFetch<{ data: Record<string, number> }>(`/admin/additional-charges/stats`);
}

export async function fetchAdminAdditionalCharges(params?: MasterFsdQuery) {
  return apiFetch<LaravelPaginated<Record<string, unknown>>>(
    `/admin/additional-charges${buildMasterFsdQuery(normalizeListParams(params))}`
  );
}

export async function fetchAdminAdditionalCharge(id: number) {
  return apiFetch<{ data: Record<string, unknown> }>(`/admin/additional-charges/${id}`);
}

export async function createAdminAdditionalCharge(body: Record<string, unknown>) {
  return apiFetch(`/admin/additional-charges`, { method: "POST", body: JSON.stringify(body) });
}

export async function updateAdminAdditionalCharge(id: number, body: Record<string, unknown>) {
  return apiFetch(`/admin/additional-charges/${id}`, { method: "PUT", body: JSON.stringify(body) });
}

export async function deactivateAdminAdditionalCharge(id: number) {
  return apiFetch(`/admin/additional-charges/${id}/deactivate`, { method: "POST" });
}

// Customer pricings
export async function fetchAdminCustomerPricingStats() {
  return apiFetch<{ data: Record<string, number> }>(`/admin/customer-pricings/stats`);
}

export async function fetchAdminCustomerPricings(params?: MasterFsdQuery) {
  return apiFetch<LaravelPaginated<Record<string, unknown>>>(
    `/admin/customer-pricings${buildMasterFsdQuery(normalizeListParams(params))}`
  );
}

export async function fetchAdminCustomerPricing(id: number) {
  return apiFetch<{ data: Record<string, unknown> }>(`/admin/customer-pricings/${id}`);
}

export async function createAdminCustomerPricing(body: Record<string, unknown>) {
  return apiFetch(`/admin/customer-pricings`, { method: "POST", body: JSON.stringify(body) });
}

export async function updateAdminCustomerPricing(id: number, body: Record<string, unknown>) {
  return apiFetch(`/admin/customer-pricings/${id}`, { method: "PUT", body: JSON.stringify(body) });
}

export async function deactivateAdminCustomerPricing(id: number) {
  return apiFetch(`/admin/customer-pricings/${id}/deactivate`, { method: "POST" });
}

// Train schedules
export async function fetchAdminTrainScheduleStats() {
  return apiFetch<{ data: Record<string, number> }>(`/admin/train-schedules/stats`);
}

export async function fetchAdminTrainSchedules(params?: MasterFsdQuery) {
  return apiFetch<LaravelPaginated<Record<string, unknown>>>(
    `/admin/train-schedules${buildMasterFsdQuery(normalizeListParams(params))}`
  );
}

export async function fetchAdminTrainSchedule(id: number) {
  return apiFetch<{ data: Record<string, unknown> }>(`/admin/train-schedules/${id}`);
}

export async function createAdminTrainSchedule(body: Record<string, unknown>) {
  return apiFetch(`/admin/train-schedules`, { method: "POST", body: JSON.stringify(body) });
}

export async function updateAdminTrainSchedule(id: number, body: Record<string, unknown>) {
  return apiFetch(`/admin/train-schedules/${id}`, { method: "PUT", body: JSON.stringify(body) });
}

export async function cancelAdminTrainSchedule(id: number) {
  return apiFetch(`/admin/train-schedules/${id}/cancel`, { method: "POST" });
}
