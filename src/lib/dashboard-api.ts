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

export type CustomerDashboardPayload = {
  bookings: {
    total: number;
    by_status: Record<string, number>;
    submitted: number;
  };
  shipments: { total: number; active: number };
  invoices: { total: number; unpaid: number; overdue: number };
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
