import { apiFetch } from "./api-client";

export type AdminDashboardPeriod = "today" | "week" | "month" | "custom";

export type AdminDashboardFilters = {
  period?: AdminDashboardPeriod;
  businessDate?: string;
  dateFrom?: string;
  dateTo?: string;
};

export type AdminDashboardSummary = {
  totalCustomers: number;
  activeShipments: number;
  bookingsToday: number;
  revenueThisMonth: number;
  outstandingReceivable: number;
  outstandingPayable: number;
  activeCompanies?: number;
  overdueInvoices?: number;
  pendingCompanyApprovals?: number;
  paymentsToday?: number;
  rackUtilization?: number;
};

export type AdminDashboardStatusBreakdown = Record<string, number>;

export type AdminDashboardTodayOperations = {
  pickupToday: number;
  trainDepartureToday: number;
  trainArrivalToday: number;
  deliveryToday: number;
  podWaitingUpload: number;
};

export type AdminDashboardFinanceSummary = {
  customerInvoice: number;
  customerPayment: number;
  outstandingCustomer: number;
  vendorInvoice: number;
  vendorPayment: number;
  outstandingVendor: number;
};

export type AdminDashboardContainerSummary = {
  available: number;
  reserved: number;
  inTransit: number;
  maintenance: number;
  inactive: number;
};

export type AdminDashboardActivity = {
  time: string;
  module: string;
  activity: string;
  user: string;
};

export type AdminDashboardNotification = {
  key: string;
  count: number;
  link?: string;
};

export type AdminDashboardPayload = {
  filters?: {
    period: AdminDashboardPeriod;
    businessDate: string;
    dateFrom: string;
    dateTo: string;
  };
  summary: AdminDashboardSummary;
  bookingStatusBreakdown: AdminDashboardStatusBreakdown;
  shipmentStatusBreakdown: AdminDashboardStatusBreakdown;
  todayOperations: AdminDashboardTodayOperations;
  financeSummary: AdminDashboardFinanceSummary;
  containerSummary: AdminDashboardContainerSummary;
  recentActivity: AdminDashboardActivity[];
  notifications: AdminDashboardNotification[];
  pendingBookings?: unknown[];
  activeShipments?: unknown[];
  overdueInvoices?: unknown[];
  recentPayments?: unknown[];
  shipmentVolumeByWeek?: unknown[];
};

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

function buildDashboardQuery(filters?: AdminDashboardFilters): string {
  if (!filters) return "";
  const params = new URLSearchParams();
  if (filters.period) params.set("period", filters.period);
  if (filters.businessDate) params.set("business_date", filters.businessDate);
  if (filters.dateFrom) params.set("date_from", filters.dateFrom);
  if (filters.dateTo) params.set("date_to", filters.dateTo);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export async function fetchAdminDashboard(filters?: AdminDashboardFilters) {
  return apiFetch<{ data: AdminDashboardPayload }>(`/admin/dashboard${buildDashboardQuery(filters)}`, {
    method: "GET",
  });
}

export async function fetchCustomerDashboard() {
  return apiFetch<{ data: CustomerDashboardPayload }>("/customer/dashboard", {
    method: "GET",
  });
}

export type CustomerNotificationsMeta = {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
};

export async function fetchCustomerNotifications(page = 1, perPage = 15) {
  const params = new URLSearchParams({
    page: String(page),
    per_page: String(perPage),
  });
  return apiFetch<{
    data: CustomerDashboardNotification[];
    meta: CustomerNotificationsMeta;
  }>(`/customer/dashboard/notifications?${params.toString()}`, {
    method: "GET",
  });
}

export function formatDashboardCurrency(value: number, locale = "id-ID"): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value ?? 0);
}
