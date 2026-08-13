import { apiFetch, apiFetchBlob, type BlobDownloadProgress } from "../../api-client";
import { buildListQuery, normalizeListParams, type ListQueryParams } from "../../list-query";
import type { LaravelPaginated } from "../../types-api";

export async function generateAdminInvoiceFromShipment(shipmentId: number, body?: Record<string, unknown>) {
  return apiFetch<{ message: string; data: Record<string, unknown> }>(
    `/admin/shipments/${shipmentId}/generate-invoice`,
    { method: "POST", body: JSON.stringify(body ?? { status: "draft" }) }
  );
}

export async function previewAdminInvoiceLineItems(shipmentId: number) {
  return apiFetch<{
    data: { items: Array<Record<string, unknown>>; subtotal: number; tax_amount: number; total_amount: number };
  }>(`/admin/shipments/${shipmentId}/invoice-preview`, { method: "GET" });
}

export async function fetchAdminInvoices(input?: number | ListQueryParams) {
  const params = normalizeListParams(input);
  return apiFetch<LaravelPaginated<Record<string, unknown>>>(
    `/admin/invoices${buildListQuery(params)}`,
    { method: "GET" }
  );
}

export async function fetchAdminInvoice(id: number) {
  return apiFetch<{ data: Record<string, unknown> }>(`/admin/invoices/${id}`, { method: "GET" });
}

export async function createAdminInvoice(body: Record<string, unknown>) {
  return apiFetch(`/admin/invoices`, { method: "POST", body: JSON.stringify(body) });
}

export async function updateAdminInvoice(id: number, body: Record<string, unknown>) {
  return apiFetch(`/admin/invoices/${id}`, { method: "PUT", body: JSON.stringify(body) });
}

export async function deleteAdminInvoice(id: number) {
  return apiFetch(`/admin/invoices/${id}`, { method: "DELETE" });
}

export async function downloadAdminInvoicePdf(
  invoiceId: number,
  opts?: { onProgress?: (p: BlobDownloadProgress) => void }
) {
  return apiFetchBlob(`/admin/invoices/${invoiceId}/pdf`, {
    method: "GET",
    onProgress: opts?.onProgress,
  });
}

export async function fetchAdminPayments(input?: number | ListQueryParams) {
  const params = normalizeListParams(input);
  return apiFetch<LaravelPaginated<Record<string, unknown>>>(
    `/admin/payments${buildListQuery(params)}`,
    { method: "GET" }
  );
}

export async function fetchAdminPayment(id: number) {
  return apiFetch<{ data: Record<string, unknown> }>(`/admin/payments/${id}`, { method: "GET" });
}

export async function syncAdminPaymentMidtrans(id: number) {
  return apiFetch<{ message: string; data: Record<string, unknown> }>(
    `/admin/payments/${id}/sync-midtrans`,
    { method: "POST" }
  );
}

export async function verifyAdminPaymentManual(id: number, body?: { note?: string | null }) {
  return apiFetch<{ message: string; data: Record<string, unknown> }>(
    `/admin/payments/${id}/verify-manual`,
    { method: "POST", body: JSON.stringify(body ?? {}) }
  );
}

export async function fetchAdminOverdueInvoices() {
  return apiFetch(`/admin/payments/overdue-invoices`, { method: "GET" });
}

export async function generateAdminMidtransLink(invoiceId: number) {
  return apiFetch<{ message: string; data: { payment_url: string } }>(
    `/admin/invoices/${invoiceId}/generate-payment-link`,
    { method: "POST" }
  );
}

export async function fetchAdminInvoiceStats() {
  return apiFetch<{ data: Record<string, number> }>(`/admin/invoices/stats`, { method: "GET" });
}

export async function fetchAdminEligibleShipments(input?: ListQueryParams) {
  const params = normalizeListParams(input);
  return apiFetch<LaravelPaginated<Record<string, unknown>>>(
    `/admin/invoices/eligible-shipments${buildListQuery(params)}`,
    { method: "GET" }
  );
}

export async function issueAdminInvoice(id: number, body?: Record<string, unknown>) {
  return apiFetch(`/admin/invoices/${id}/issue`, {
    method: "POST",
    body: JSON.stringify(body ?? {}),
  });
}

export async function fetchAdminPaymentStats() {
  return apiFetch<{ data: Record<string, number> }>(`/admin/payments/stats`, { method: "GET" });
}

export async function fetchAdminEligibleInvoices(input?: ListQueryParams) {
  const params = normalizeListParams(input);
  return apiFetch<LaravelPaginated<Record<string, unknown>>>(
    `/admin/payments/eligible-invoices${buildListQuery(params)}`,
    { method: "GET" }
  );
}

export async function recordAdminPayment(invoiceId: number, body: Record<string, unknown>) {
  return apiFetch(`/admin/invoices/${invoiceId}/record-payment`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function fetchAdminPaymentOptions() {
  return apiFetch<{ data: { company_banks: string[]; vehicle_types: string[] } }>(
    `/admin/payments/options`,
    { method: "GET" }
  );
}

export async function downloadAdminPaymentReceipt(paymentId: number, download = false) {
  return apiFetchBlob(`/admin/payments/${paymentId}/receipt${download ? "?download=1" : ""}`, {
    method: "GET",
  });
}
