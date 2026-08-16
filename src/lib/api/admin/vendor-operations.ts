import { apiFetch, apiFetchBlob } from "../../api-client";
import { buildListQuery, normalizeListParams, type ListQueryParams } from "../../list-query";
import type { LaravelPaginated } from "../../types-api";

type VendorOpsQuery = ListQueryParams & Record<string, string | number | undefined>;

function buildVendorOpsQuery(params?: VendorOpsQuery): string {
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

// Job Orders
export async function fetchAdminVendorJobOrderStats() {
  return apiFetch<{ data: Record<string, number> }>(`/admin/vendor-job-orders/stats`);
}

export async function fetchAdminVendorJobOrders(params?: VendorOpsQuery) {
  return apiFetch<LaravelPaginated<Record<string, unknown>>>(`/admin/vendor-job-orders${buildVendorOpsQuery(normalizeListParams(params))}`);
}

export async function fetchAdminVendorJobOrder(id: number) {
  return apiFetch<{ data: Record<string, unknown> }>(`/admin/vendor-job-orders/${id}`);
}

export async function updateAdminVendorJobOrder(id: number, body: Record<string, unknown>) {
  return apiFetch(`/admin/vendor-job-orders/${id}`, { method: "PUT", body: JSON.stringify(body) });
}

export async function sendAdminVendorJobOrder(id: number) {
  return apiFetch(`/admin/vendor-job-orders/${id}/send`, { method: "POST" });
}

export async function verifyAdminVendorJobOrderCompletion(id: number) {
  return apiFetch(`/admin/vendor-job-orders/${id}/verify-completion`, { method: "POST" });
}

export async function uploadAdminVendorJobOrderDocument(id: number, formData: FormData) {
  return apiFetch(`/admin/vendor-job-orders/${id}/documents`, { method: "POST", body: formData });
}

export async function fetchAdminVendorJobOrderPdf(id: number) {
  return apiFetchBlob(`/admin/vendor-job-orders/${id}/pdf`, { method: "GET" });
}

// Invoices
export async function fetchAdminVendorInvoiceStats() {
  return apiFetch<{ data: Record<string, number> }>(`/admin/vendor-invoices/stats`);
}

export async function fetchAdminVendorInvoices(params?: VendorOpsQuery) {
  return apiFetch<LaravelPaginated<Record<string, unknown>>>(`/admin/vendor-invoices${buildVendorOpsQuery(normalizeListParams(params))}`);
}

export async function fetchAdminVendorInvoiceEligibleJobOrders(vendorId: number) {
  return apiFetch<{ data: Record<string, unknown>[] }>(`/admin/vendor-invoices/eligible-job-orders?vendor_id=${vendorId}`);
}

export async function fetchAdminVendorInvoice(id: number) {
  return apiFetch<{ data: Record<string, unknown> }>(`/admin/vendor-invoices/${id}`);
}

export async function receiveAdminVendorInvoice(formData: FormData) {
  return apiFetch(`/admin/vendor-invoices`, { method: "POST", body: formData });
}

export async function verifyAdminVendorInvoice(id: number, body: Record<string, unknown>) {
  return apiFetch(`/admin/vendor-invoices/${id}/verify`, { method: "POST", body: JSON.stringify(body) });
}

export async function startVerificationAdminVendorInvoice(id: number) {
  return apiFetch(`/admin/vendor-invoices/${id}/start-verification`, { method: "POST" });
}

export async function rejectAdminVendorInvoice(id: number, body: Record<string, unknown>) {
  return apiFetch(`/admin/vendor-invoices/${id}/reject`, { method: "POST", body: JSON.stringify(body) });
}

export async function uploadAdminVendorInvoiceAttachment(id: number, formData: FormData) {
  return apiFetch(`/admin/vendor-invoices/${id}/attachments`, { method: "POST", body: formData });
}

// Payments
export async function fetchAdminVendorPaymentStats() {
  return apiFetch<{ data: Record<string, number> }>(`/admin/vendor-payments/stats`);
}

export async function fetchAdminVendorPayments(params?: VendorOpsQuery) {
  return apiFetch<LaravelPaginated<Record<string, unknown>>>(`/admin/vendor-payments${buildVendorOpsQuery(normalizeListParams(params))}`);
}

export async function fetchAdminVendorPayment(id: number) {
  return apiFetch<{ data: Record<string, unknown> }>(`/admin/vendor-payments/${id}`);
}

export async function approveAdminVendorPayment(id: number, body: Record<string, unknown>) {
  return apiFetch(`/admin/vendor-payments/${id}/approve`, { method: "POST", body: JSON.stringify(body) });
}

export async function rejectAdminVendorPayment(id: number, body: Record<string, unknown>) {
  return apiFetch(`/admin/vendor-payments/${id}/reject`, { method: "POST", body: JSON.stringify(body) });
}

export async function recordAdminVendorPayment(id: number, formData: FormData) {
  return apiFetch(`/admin/vendor-payments/${id}/record-payment`, { method: "POST", body: formData });
}

export async function fetchAdminVendorPaymentCompanyBanks() {
  return apiFetch<{ data: string[] }>(`/admin/vendor-payments/company-banks`);
}

export async function fetchAdminVendorPaymentVoucher(id: number) {
  return apiFetch<{ data: { html: string; payment_number: string } }>(`/admin/vendor-payments/${id}/voucher`);
}

export async function uploadAdminVendorPaymentDocument(id: number, formData: FormData) {
  return apiFetch(`/admin/vendor-payments/${id}/documents`, { method: "POST", body: formData });
}

// Reports
export async function fetchAdminVendorInvoiceReport(params?: VendorOpsQuery) {
  return apiFetch<LaravelPaginated<Record<string, unknown>>>(`/admin/reports/vendor-invoices${buildVendorOpsQuery(normalizeListParams(params))}`);
}

export async function fetchAdminVendorPaymentReport(params?: VendorOpsQuery) {
  return apiFetch<LaravelPaginated<Record<string, unknown>>>(`/admin/reports/vendor-payments${buildVendorOpsQuery(normalizeListParams(params))}`);
}

export function adminVendorInvoiceReportExportUrl(params?: VendorOpsQuery): string {
  return `/api/admin/reports/vendor-invoices/export${buildVendorOpsQuery(normalizeListParams(params))}`;
}

export function adminVendorPaymentReportExportUrl(params?: VendorOpsQuery): string {
  return `/api/admin/reports/vendor-payments/export${buildVendorOpsQuery(normalizeListParams(params))}`;
}
