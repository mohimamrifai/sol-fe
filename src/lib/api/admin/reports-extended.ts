import { apiFetch } from "../../api-client";
import { buildListQuery, normalizeListParams, type ListQueryParams } from "../../list-query";
import type { LaravelPaginated } from "../../types-api";

/** Default page size for admin report tables. */
export const ADMIN_REPORT_PER_PAGE = 10;

type ReportQuery = ListQueryParams & Record<string, string | number | undefined>;

function buildReportQuery(params?: ReportQuery): string {
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

export async function fetchAdminShipmentReport(params?: ReportQuery) {
  return apiFetch<LaravelPaginated<Record<string, unknown>>>(
    `/admin/reports/shipments${buildReportQuery(normalizeListParams(params))}`
  );
}

export function adminShipmentReportExportUrl(params?: ReportQuery): string {
  return `/admin/reports/shipments/export${buildReportQuery(normalizeListParams(params))}`;
}

export async function fetchAdminBookingReport(params?: ReportQuery) {
  return apiFetch<LaravelPaginated<Record<string, unknown>>>(
    `/admin/reports/bookings${buildReportQuery(normalizeListParams(params))}`
  );
}

export function adminBookingReportExportUrl(params?: ReportQuery): string {
  return `/admin/reports/bookings/export${buildReportQuery(normalizeListParams(params))}`;
}

export async function fetchAdminCustomerInvoiceReport(params?: ReportQuery) {
  return apiFetch<LaravelPaginated<Record<string, unknown>>>(
    `/admin/reports/customer-invoices${buildReportQuery(normalizeListParams(params))}`
  );
}

export function adminCustomerInvoiceReportExportUrl(params?: ReportQuery): string {
  return `/admin/reports/customer-invoices/export${buildReportQuery(normalizeListParams(params))}`;
}

export async function fetchAdminCustomerPaymentReport(params?: ReportQuery) {
  return apiFetch<LaravelPaginated<Record<string, unknown>>>(
    `/admin/reports/customer-payments${buildReportQuery(normalizeListParams(params))}`
  );
}

export function adminCustomerPaymentReportExportUrl(params?: ReportQuery): string {
  return `/admin/reports/customer-payments/export${buildReportQuery(normalizeListParams(params))}`;
}

export async function fetchAdminContainerReport(params?: ReportQuery) {
  return apiFetch<LaravelPaginated<Record<string, unknown>>>(
    `/admin/reports/containers${buildReportQuery(normalizeListParams(params))}`
  );
}

export function adminContainerReportExportUrl(params?: ReportQuery): string {
  return `/admin/reports/containers/export${buildReportQuery(normalizeListParams(params))}`;
}
