export const INVOICE_STATUSES = [
  "draft",
  "issued",
  "partially_paid",
  "paid",
  "overdue",
  "cancelled",
] as const;

export type InvoiceStatusKey = (typeof INVOICE_STATUSES)[number];

export interface CustomerInvoiceStats {
  draft: number;
  issued: number;
  partially_paid: number;
  paid: number;
  overdue: number;
}

export interface CustomerInvoiceRow {
  id: number;
  invoice_number: string;
  invoice_date: string | null;
  due_date: string | null;
  total_amount: number;
  paid_amount: number;
  outstanding_amount: number;
  status: InvoiceStatusKey;
  base_status: string;
  shipment: {
    id: number | null;
    shipment_number?: string | null;
    waybill_number?: string | null;
    booking_number?: string | null;
  } | null;
}

export interface CustomerInvoiceDetail {
  id: number;
  invoice_number: string;
  customer: string | null;
  status: InvoiceStatusKey;
  invoice_date: string | null;
  due_date: string | null;
  currency: string;
  payment_terms: string | null;
  remark: string | null;
  shipment: {
    id?: number | null;
    booking_id?: number | null;
    shipment_no: string | null;
    booking_no: string | null;
    cn_no: string | null;
    route: string | null;
    service_type: string | null;
    shipment_coverage: string | null;
  };
  items: Array<{
    id: number;
    description: string;
    qty: number;
    unit_price: number;
    amount: number;
  }>;
  summary: {
    subtotal: number;
    discount: number;
    additional_charge: number;
    ppn: number;
    grand_total: number;
  };
  supporting_documents: Array<{
    key: string;
    label: string;
    available: boolean;
    view_path?: string | null;
    download_path?: string | null;
    list_path?: string | null;
  }>;
  payment_summary: {
    invoice_amount: number;
    paid_amount: number;
    outstanding_amount: number;
    payment_status: InvoiceStatusKey;
  };
  payment_history: Array<{
    id: number;
    payment_date: string | null;
    amount: number;
    payment_method: string | null;
    reference_no: string | null;
    status: string;
  }>;
  activity_timeline: Array<{
    occurred_at: string;
    activity: string;
  }>;
  actions: {
    download_pdf_path: string;
    can_pay_now: boolean;
  };
}

