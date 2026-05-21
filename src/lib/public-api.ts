import { apiFetch } from "./api-client";
import type { LaravelPaginated } from "./types-api";

/** Master data & estimasi untuk pengunjung (tanpa token). */
export async function fetchPublicMasterLocations() {
  return apiFetch<LaravelPaginated<Record<string, unknown>>>(
    `/public/master/locations?per_page=500`,
    { method: "GET", token: null }
  );
}

export async function fetchPublicMasterTransportModes() {
  return apiFetch<{ data: unknown[] }>(`/public/master/transport-modes`, {
    method: "GET",
    token: null,
  });
}

export async function fetchPublicMasterServiceTypes(transportModeId?: number) {
  const q = transportModeId ? `?transport_mode_id=${transportModeId}` : "";
  return apiFetch<{ data: unknown[] }>(`/public/master/service-types${q}`, {
    method: "GET",
    token: null,
  });
}

export async function fetchPublicMasterContainerTypes() {
  return apiFetch<{ data: unknown[] }>(`/public/master/container-types`, {
    method: "GET",
    token: null,
  });
}

export async function fetchPublicMasterAdditionalServices() {
  return apiFetch<{ data: unknown[] }>(`/public/master/additional-services`, {
    method: "GET",
    token: null,
  });
}

export async function fetchPublicMasterCargoCategories() {
  return apiFetch<{ data: unknown[] }>(`/public/master/cargo-categories`, {
    method: "GET",
    token: null,
  });
}

export async function fetchPublicMasterDgClasses() {
  return apiFetch<{ data: unknown[] }>(`/public/master/dg-classes`, {
    method: "GET",
    token: null,
  });
}

export async function publicEstimateBookingPrice(payload: Record<string, unknown>) {
  return apiFetch<{ data: unknown }>(`/public/bookings/estimate-price`, {
    method: "POST",
    body: JSON.stringify(payload),
    token: null,
  });
}
