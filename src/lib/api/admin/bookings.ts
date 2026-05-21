import { apiFetch } from "../../api-client";
import { buildListQuery, normalizeListParams, type ListQueryParams } from "../../list-query";
import type { LaravelPaginated } from "../../types-api";

export async function fetchAdminBookings(
  input?: number | ListQueryParams,
  signal?: AbortSignal
) {
  const params = normalizeListParams(input);
  return apiFetch<LaravelPaginated<Record<string, unknown>>>(
    `/admin/bookings${buildListQuery(params)}`,
    { method: "GET", signal }
  );
}

export async function fetchAdminBooking(id: number) {
  return apiFetch<{ data: Record<string, unknown> }>(`/admin/bookings/${id}`, { method: "GET" });
}

export async function updateAdminBooking(id: number, payload: Record<string, unknown> | FormData) {
  const isFormData = payload instanceof FormData;
  return apiFetch<{ data: Record<string, unknown>; message?: string }>(`/admin/bookings/${id}`, {
    method: "POST", // Laravel uses POST with _method=PUT for multipart forms
    body: isFormData ? payload : JSON.stringify(payload),
  });
}

export async function estimateAdminBookingPrice(payload: Record<string, unknown>) {
  return apiFetch<{ data: unknown }>(`/admin/bookings/estimate-price`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function createAdminBooking(payload: Record<string, unknown> | FormData) {
  const isFormData = payload instanceof FormData;
  return apiFetch(`/admin/bookings`, {
    method: "POST",
    body: isFormData ? payload : JSON.stringify(payload),
  });
}

export async function approveBooking(id: number) {
  return apiFetch(`/admin/bookings/${id}/approve`, { method: "POST", body: JSON.stringify({}) });
}

export async function rejectBooking(id: number, reason: string) {
  return apiFetch(`/admin/bookings/${id}/reject`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

export async function convertBookingToShipment(id: number) {
  return apiFetch<{ data?: Record<string, unknown>; message?: string }>(
    `/admin/bookings/${id}/convert-to-shipment`,
    { method: "POST", body: JSON.stringify({}) }
  );
}
