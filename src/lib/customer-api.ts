import { apiFetch, apiFetchBlob, type BlobDownloadProgress } from "./api-client";
import { buildListQuery, normalizeListParams, type ListQueryParams } from "./list-query";
import type { LaravelPaginated } from "./types-api";

export type { ListQueryParams };

export async function fetchCustomerShipments(
  input?: number | (ListQueryParams & {
    service_type?: string;
    shipment_coverage?: string;
    origin_location_id?: number;
    destination_location_id?: number;
    shipment_date_from?: string;
    shipment_date_to?: string;
  }),
  signal?: AbortSignal
) {
  const params = normalizeListParams(input);
  return apiFetch<LaravelPaginated<Record<string, unknown>>>(
    `/customer/shipments${buildListQuery(params)}`,
    { method: "GET", signal }
  );
}

export async function fetchCustomerShipmentStats() {
  return apiFetch<{
    data: { planning: number; in_progress: number; completed: number; cancelled: number };
  }>(`/customer/shipments/stats`, { method: "GET" });
}

export async function fetchCustomerShipment(id: number) {
  return apiFetch<{ data: Record<string, unknown> }>(`/customer/shipments/${id}`, { method: "GET" });
}

export async function downloadCustomerConsignmentNotePdf(id: number) {
  return apiFetchBlob(`/customer/shipments/${id}/consignment-note-pdf`, { method: "GET" });
}

export async function downloadCustomerWaybillPdf(id: number) {
  return apiFetchBlob(`/customer/shipments/${id}/waybill-pdf`, { method: "GET" });
}

export async function fetchCustomerInvoices(input?: number | ListQueryParams) {
  const params = normalizeListParams(input);
  return apiFetch<LaravelPaginated<Record<string, unknown>>>(
    `/customer/invoices${buildListQuery(params)}`,
    { method: "GET" }
  );
}

export async function fetchCustomerPayments(input?: number | ListQueryParams) {
  const params = normalizeListParams(input);
  return apiFetch<LaravelPaginated<Record<string, unknown>>>(
    `/customer/payments${buildListQuery(params)}`,
    { method: "GET" }
  );
}

export async function fetchCustomerBookings(
  input?: number | ListQueryParams,
  signal?: AbortSignal
) {
  const params = normalizeListParams(input);
  return apiFetch<LaravelPaginated<Record<string, unknown>>>(
    `/customer/bookings${buildListQuery(params)}`,
    { method: "GET", signal }
  );
}

export async function fetchCustomerBookingStats() {
  return apiFetch<{ data: { draft: number; submitted: number; approved: number; rejected: number } }>(
    `/customer/bookings/stats`,
    { method: "GET" }
  );
}

export async function fetchCustomerMasterLocations(input?: { type?: string; perPage?: number; search?: string }) {
  const qs = new URLSearchParams();
  qs.set("per_page", String(input?.perPage ?? 500));
  if (input?.type) qs.set("type", input.type);
  if (input?.search) qs.set("search", input.search);
  return apiFetch<LaravelPaginated<Record<string, unknown>>>(
    `/customer/master/locations?${qs.toString()}`,
    { method: "GET" }
  );
}

export async function fetchCustomerMasterTransportModes() {
  return apiFetch<{ data: unknown[] }>(`/customer/master/transport-modes`, { method: "GET" });
}

export async function fetchCustomerMasterServiceTypes(transportModeId?: number) {
  const q = transportModeId ? `?transport_mode_id=${transportModeId}` : "";
  return apiFetch<{ data: unknown[] }>(`/customer/master/service-types${q}`, { method: "GET" });
}

export async function fetchCustomerMasterContainerTypes() {
  return apiFetch<{ data: unknown[] }>(`/customer/master/container-types`, { method: "GET" });
}

export async function fetchCustomerMasterAdditionalServices() {
  return apiFetch<{ data: unknown[] }>(`/customer/master/additional-services`, { method: "GET" });
}

export async function fetchCustomerMasterCargoCategories() {
  return apiFetch<{ data: unknown[] }>(`/customer/master/cargo-categories`, { method: "GET" });
}

export async function fetchCustomerMasterDgClasses() {
  return apiFetch<{ data: unknown[] }>(`/customer/master/dg-classes`, { method: "GET" });
}

export async function fetchCustomerMasterShipmentCoverages() {
  return apiFetch<{ data: Array<{ value: string }> }>(`/customer/master/shipment-coverages`, { method: "GET" });
}

export async function fetchCustomerBranches() {
  return apiFetch<{ data: unknown[] }>(`/customer/branches`, { method: "GET" });
}

export async function estimateBookingPrice(payload: Record<string, unknown>) {
  return apiFetch<{ data: unknown }>(`/customer/bookings/estimate-price`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function createCustomerBooking(payload: Record<string, unknown>) {
  return apiFetch(`/customer/bookings`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function createCustomerBookingMultipart(formData: FormData) {
  // Do NOT set Content-Type — browser sets it automatically with the correct boundary for multipart/form-data
  return apiFetch(`/customer/bookings`, {
    method: "POST",
    body: formData,
  });
}

export async function updateCustomerBooking(bookingId: number, payload: Record<string, unknown> | FormData) {
  const isFormData = payload instanceof FormData;
  return apiFetch(`/customer/bookings/${bookingId}`, {
    method: "POST", // Laravel uses POST with _method=PUT for multipart forms
    body: isFormData ? payload : JSON.stringify(payload),
  });
}

export async function fetchCustomerBookingDetail(bookingId: number) {
  return apiFetch<{ data: unknown }>(`/customer/bookings/${bookingId}`, {
    method: "GET",
  });
}

/** Alias matching the spec — single booking fetch. */
export const fetchCustomerBooking = fetchCustomerBookingDetail;

export async function cancelCustomerBooking(bookingId: number, reason: string) {
  return apiFetch(`/customer/bookings/${bookingId}/cancel`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

export async function submitCustomerBooking(bookingId: number) {
  return apiFetch(`/customer/bookings/${bookingId}/submit`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export async function duplicateCustomerBooking(bookingId: number) {
  return apiFetch<{ data: Record<string, unknown> }>(`/customer/bookings/${bookingId}/duplicate`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export async function fetchCustomerBookingActivities(bookingId: number) {
  return apiFetch<{ data: Array<Record<string, unknown>> }>(`/customer/bookings/${bookingId}/activities`, {
    method: "GET",
  });
}

export async function uploadCustomerBookingAttachment(bookingId: number, file: File) {
  const form = new FormData();
  form.append("file", file);
  return apiFetch<{ data: Record<string, unknown> }>(`/customer/bookings/${bookingId}/attachments`, {
    method: "POST",
    body: form,
  });
}

export async function deleteCustomerBookingAttachment(bookingId: number, attachmentId: number) {
  return apiFetch(`/customer/bookings/${bookingId}/attachments/${attachmentId}`, {
    method: "DELETE",
  });
}

export async function payInvoice(invoiceId: number) {
  return apiFetch<{ message: string; data: { token: string; redirect_url?: string | null; order_id: string } }>(
    `/customer/invoices/${invoiceId}/pay`,
    { method: "POST", body: JSON.stringify({}) }
  );
}

export async function downloadCustomerInvoicePdf(
  invoiceId: number,
  opts?: { onProgress?: (p: BlobDownloadProgress) => void }
) {
  return apiFetchBlob(`/customer/invoices/${invoiceId}/pdf`, {
    method: "GET",
    onProgress: opts?.onProgress,
  });
}
