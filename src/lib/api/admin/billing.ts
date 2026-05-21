import { apiFetch, apiFetchBlob, type BlobDownloadProgress } from "../../api-client";
import { buildListQuery, normalizeListParams, type ListQueryParams } from "../../list-query";
import type { LaravelPaginated } from "../../types-api";

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
