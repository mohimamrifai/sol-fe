import { apiFetch } from "./api-client";

export type AdminDashboardSummary = {
  bookingsToday: number;
  activeShipments: number;
  rackUtilization: number;
  overdueInvoices: number;
  activeCompanies: number;
  pendingCompanyApprovals: number;
  unpaidInvoices: number;
  paymentsToday: number;
  departuresToday?: number;
  arrivalsToday?: number;
  activeCustomers?: number;
  newCustomersThisWeek?: number;
  pendingProspects?: number;
};

export type AdminDashboardPayload = {
  summary: AdminDashboardSummary;
  pendingBookings: Array<{
    id?: number;
    code?: string;
    booking_number?: string;
    customer?: string;
    route?: string;
    serviceType?: string;
    status?: string;
  }>;
  activeShipments: Array<{
    id: string;
    customer?: string;
    route: string;
    status: string;
  }>;
  overdueInvoices: Array<{
    number: string;
    customer?: string;
    status: string;
    dueDate?: string;
    amount: number;
  }>;
  recentPayments: Array<{
    ref: string;
    customer?: string;
    method: string;
    amount: number;
    status?: string;
  }>;
  /** Shipment baru per minggu (4 minggu), FCL vs LCL — dari API admin dashboard */
  shipmentVolumeByWeek?: Array<{ week: string; fcl: number; lcl: number }>;
};

// ── Customer dashboard payload (per prompt.md brief) ──────────────────────
export type CustomerDashboardCards = {
  booking_draft: number;
  booking_submitted: number;
  shipment_active: number;
  shipment_completed: number;
  invoice_unpaid: number;
  invoice_outstanding_amount: number;
};

export type CustomerDashboardShipment = {
  id: number;
  shipment_number: string;
  waybill_number?: string;
  route: string;
  service: string;
  service_code?: string | null;
  current_status: string;
  eta?: string | null;
};

export type CustomerDashboardBooking = {
  id: number;
  booking_number: string;
  booking_date?: string | null;
  route: string;
  service: string;
  service_code?: string | null;
  status: string;
};

export type CustomerDashboardInvoice = {
  id: number;
  invoice_number: string;
  due_date?: string | null;
  amount: number;
  outstanding: number;
  status: string;
  shipment_id?: number | null;
  shipment_number?: string | null;
};

export type CustomerDashboardPayment = {
  id: number;
  invoice_id: number;
  invoice_number: string;
  amount: number;
  method: string;
  status: string;
  paid_at?: string | null;
  paid_at_date?: string | null;
};

export type CustomerDashboardRecent = {
  shipments: CustomerDashboardShipment[];
  bookings: CustomerDashboardBooking[];
  invoices: CustomerDashboardInvoice[];
  payments: CustomerDashboardPayment[];
};

export type CustomerDashboardNotification = {
  id: string;
  type:
    | "booking_submitted"
    | "booking_approved"
    | "shipment_departed"
    | "shipment_arrived"
    | "invoice_issued"
    | "payment_received";
  ref_id: number;
  ref_type: "booking" | "shipment" | "invoice";
  ref_number?: string | null;
  destination?: string;
  occurred_at: string;
  link: string;
};

export type CustomerDashboardPayload = {
  cards: CustomerDashboardCards;
  recent: CustomerDashboardRecent;
  notifications: CustomerDashboardNotification[];
};

export async function fetchAdminDashboard() {
  return apiFetch<{ data: AdminDashboardPayload }>("/admin/dashboard", {
    method: "GET",
  });
}

export async function fetchCustomerDashboard() {
  return apiFetch<{ data: CustomerDashboardPayload }>("/customer/dashboard", {
    method: "GET",
  });
}
