import { apiFetch } from "../api-client";

export type VendorInvoice = {
  id: number;
  invoice_number: string;
  vendor_company_id: number;
  shipment_id: number;
  job_order?: {
    id: number;
    shipment_no: string;
    shipment_number: string;
  };
  invoice_date: string;
  due_date: string;
  invoice_amount: number;
  tax_amount: number;
  total_amount: number;
  paid_amount: number;
  outstanding_amount: number;
  status: "draft" | "submitted" | "approved" | "rejected" | "paid";
  status_label: string;
  notes: string | null;
  file_path: string | null;
  file_url: string | null;
  tax_invoice_path: string | null;
  tax_invoice_url: string | null;
  rejection_reason: string | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  created_at: string;
  is_editable: boolean;
  is_submittable: boolean;
  attachments?: Array<{
    id: number;
    file_path: string;
    file_url: string;
    original_name: string;
    mime_type: string;
    size: number;
    kind: string;
  }>;
};

export type VendorInvoiceStats = {
  draft: number;
  submitted: number;
  approved: number;
  rejected: number;
  paid: number;
};

export type VendorInvoiceListResponse = {
  data: VendorInvoice[];
  meta: { total: number; per_page: number; current_page: number; last_page: number };
};

export type EligibleJobOrder = {
  id: number;
  shipment_number: string;
  jo_number: string;
  customer_name: string;
  completion_verified_at: string;
};

export function fetchVendorInvoices(params: Record<string, unknown> = {}) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") q.append(k, String(v));
  }
  const qs = q.toString();
  return apiFetch<VendorInvoiceListResponse>(`/vendor/invoices${qs ? `?${qs}` : ""}`);
}

export function fetchVendorInvoiceStats() {
  return apiFetch<{ data: VendorInvoiceStats }>("/vendor/invoices/stats");
}

export function fetchVendorInvoice(id: number) {
  return apiFetch<{
    data: VendorInvoice & {
      activities: Array<{ id: number; event_key: string; description: string; actor_name: string | null; occurred_at: string }>;
    };
  }>(`/vendor/invoices/${id}`);
}

export function fetchEligibleJobOrders() {
  return apiFetch<{ data: EligibleJobOrder[] }>("/vendor/invoices/eligible-job-orders");
}

export function createVendorInvoice(payload: FormData) {
  return apiFetch<{ message: string; data: VendorInvoice }>("/vendor/invoices", {
    method: "POST",
    body: payload,
  });
}

export function updateVendorInvoice(id: number, payload: FormData) {
  return apiFetch<{ message: string; data: VendorInvoice }>(`/vendor/invoices/${id}`, {
    method: "POST",
    body: payload,
  });
}

export function submitVendorInvoice(id: number) {
  return apiFetch<{ message: string; data: VendorInvoice }>(`/vendor/invoices/${id}/submit`, {
    method: "POST",
  });
}

export function getVendorInvoiceDownloadUrl(id: number): string {
  return `${process.env.NEXT_PUBLIC_API_URL ?? ""}/api/vendor/invoices/${id}/download`;
}
