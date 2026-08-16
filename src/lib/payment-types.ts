export type PaymentStatusFilter =
  | "unpaid"
  | "partially_paid"
  | "paid"
  | "overdue";

export type PaymentStatus =
  | "unpaid"
  | "partially_paid"
  | "paid"
  | "overdue"
  | "pending"
  | "success"
  | "failed"
  | "expired"
  | "refunded";

export type PaymentMethod =
  | "midtrans"
  | "transfer"
  | "giro"
  | "cash"
  | "virtual_account";

export type ManualPaymentStatus =
  | "unsubmitted"
  | "submitted"
  | "verified"
  | "rejected";

export interface PaymentListItem {
  id: number | null;
  payment_id?: number | null;
  payment_no?: string | null;
  payment_number?: number | null;
  invoice_id: number;
  invoice_number?: string | null;
  customer_name?: string | null;
  shipment_number?: string | null;
  invoice_amount: number;
  paid_amount: number;
  outstanding_amount: number;
  amount: number;
  payment_method?: string | null;
  payment_type?: string | null;
  payment_date?: string | null;
  status: PaymentStatusFilter | PaymentStatus;
  payment_status?: string | null;
  has_payment_record?: boolean;
  actions?: {
    can_view?: boolean;
    detail_invoice_only?: boolean;
  };
}

export interface PaymentListResponse {
  data: PaymentListItem[];
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  from?: number | null;
  to?: number | null;
}

export interface PaymentStats {
  unpaid: number;
  partially_paid: number;
  paid: number;
  overdue: number;
}

export interface PaymentInvoiceSummary {
  id: number;
  invoice_number: string;
  invoice_date?: string | null;
  due_date?: string | null;
  currency: string;
  invoice_amount: number;
  paid_amount: number;
  outstanding_amount: number;
  status: string;
}

export interface PaymentHistoryEntry {
  id: number;
  payment_date?: string | null;
  amount: number;
  payment_method: string;
  reference_no?: string | null;
  status: PaymentStatus | string;
}

export interface OnlinePaymentInfo {
  active: boolean;
  link_status?: "active" | "expired";
  link?: string | null;
  token?: string | null;
  expired_at?: string | null;
  payment_gateway: string;
  transaction_id?: string | null;
  payment_status: string;
}

export interface BankAccount {
  bank_name?: string | null;
  account_number?: string | null;
  account_name?: string | null;
}

export interface ManualPaymentInfo {
  enabled: boolean;
  bank_account?: BankAccount | null;
}

export interface ManualPaymentMeta {
  status: ManualPaymentStatus;
  payment_date?: string | null;
  bank_name?: string | null;
  reference_number?: string | null;
  remark?: string | null;
  submitted_at?: string | null;
  verified_at?: string | null;
}

export interface SupportingDocument {
  key: string;
  label: string;
  available: boolean;
  view_path: string;
  download_path: string;
  meta?: Record<string, unknown>;
}

export interface ActivityTimelineEntry {
  occurred_at: string;
  activity: string;
}

export interface PaymentDetail {
  id: number;
  payment_no: string;
  payment_number?: number | null;
  midtrans_order_id?: string | null;
  invoice: PaymentInvoiceSummary;
  status: PaymentStatus | string;
  payment_record_status?: string | null;
  created_date?: string | null;
  paid_at?: string | null;
  payment_method?: string | null;
  amount: number;
  manual: ManualPaymentMeta;
  payment_history: PaymentHistoryEntry[];
  payment_summary: {
    total_paid: number;
    outstanding_amount: number;
  };
  online_payment: OnlinePaymentInfo;
  manual_payment: ManualPaymentInfo;
  supporting_documents: SupportingDocument[];
  activity_timeline: ActivityTimelineEntry[];
  actions: {
    can_pay_now: boolean;
    can_sync_midtrans?: boolean;
    can_submit_manual?: boolean;
  };
}

export interface PaymentFilters {
  search?: string;
  status?: PaymentStatusFilter | "";
  payment_method?: PaymentMethod | "";
  paymentDateFrom?: string;
  paymentDateTo?: string;
  page?: number;
  per_page?: number;
}
