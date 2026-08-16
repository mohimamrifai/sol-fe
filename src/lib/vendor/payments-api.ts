import { apiFetch } from "../api-client";

export type VendorPayment = {
  id: number;
  payment_number: string;
  vendor_invoice_id: number;
  vendor_invoice?: {
    id: number;
    invoice_number: string;
    total_amount: number;
    shipment_id?: number;
    jo_number?: string;
  };
  shipment_number?: string;
  payment_date: string;
  amount: number;
  payment_method: string;
  payment_method_label: string;
  reference_no: string | null;
  status: "pending_payment" | "partially_paid" | "paid";
  status_label: string;
  receipt_path: string | null;
  receipt_url: string | null;
  transfer_receipt_path: string | null;
  transfer_receipt_url: string | null;
  withholding_tax_path: string | null;
  withholding_tax_url: string | null;
  notes: string | null;
  paid_by: string | null;
  created_at: string;
  invoice?: {
    id: number;
    invoice_number: string;
    total_amount: number;
    shipment_id?: number;
    jo_number?: string;
  };
  activities?: Array<{
    id: number;
    event_key: string;
    description: string;
    actor_name: string | null;
    occurred_at: string;
  }>;
  history?: Array<{
    payment_number: string;
    payment_date: string;
    amount: number;
    status: string;
  }>;
};

export type VendorPaymentStats = {
  pending_payment: number;
  partially_paid: number;
  paid: number;
};

export type VendorPaymentListResponse = {
  data: VendorPayment[];
  meta: { total: number; per_page: number; current_page: number; last_page: number };
};

export function fetchVendorPayments(params: Record<string, unknown> = {}) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") q.append(k, String(v));
  }
  const qs = q.toString();
  return apiFetch<VendorPaymentListResponse>(`/vendor/payments${qs ? `?${qs}` : ""}`);
}

export function fetchVendorPaymentStats() {
  return apiFetch<{ data: VendorPaymentStats }>("/vendor/payments/stats");
}

export function fetchVendorPayment(id: number) {
  return apiFetch<{ data: VendorPayment }>(`/vendor/payments/${id}`);
}

export function getVendorPaymentReceiptUrl(id: number): string {
  return `${process.env.NEXT_PUBLIC_API_URL ?? ""}/api/vendor/payments/${id}/receipt`;
}
