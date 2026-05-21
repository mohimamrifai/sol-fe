
export type AdminRole = "super_admin" | "operations" | "finance" | "sales";

export interface AdminDashboardSummary {
  // Super admin global metrics
  bookingsToday: number;
  activeShipments: number;
  rackUtilization: number;
  overdueInvoices: number;
  activeCompanies: number;
  pendingCompanyApprovals: number;
  unpaidInvoices: number;
  paymentsToday: number;

  // Ops-specific metrics
  departuresToday?: number;
  arrivalsToday?: number;

  // Sales-specific metrics
  activeCustomers?: number;
  newCustomersThisWeek?: number;
  pendingProspects?: number;
}

export interface AdminBookingPendingItem {
  code: string;
  customer: string;
  route: string;
  serviceType: string;
}

export interface AdminShipmentItem {
  id: string;
  customer?: string;
  route: string;
  status: string;
}

export interface AdminInvoiceItem {
  number: string;
  customer: string;
  status: "unpaid" | "overdue" | "paid";
  dueDate: string;
  amount: number;
}

export interface AdminPaymentItem {
  ref: string;
  customer: string;
  method: string;
  amount: number;
}

export interface AdminDashboardResponse {
  role: AdminRole;
  summary: AdminDashboardSummary;
  pendingBookings: AdminBookingPendingItem[];
  activeShipments: AdminShipmentItem[];
  overdueInvoices: AdminInvoiceItem[];
  recentPayments: AdminPaymentItem[];
}

export type CustomerRole = "company_admin" | "ops_pic" | "finance_pic";

export interface CustomerDashboardSummary {
  // Company-level summary (company_admin)
  activeBookings: number;
  activeShipments: number;
  unpaidInvoices: number;
  overdueInvoices: number;

  // PIC-level can reuse subset of these fields depending on role
}

export interface CustomerShipmentItem {
  id: string;
  route: string;
  status: string;
}

export interface CustomerInvoiceItem {
  number: string;
  status: "unpaid" | "overdue" | "paid";
  dueDate: string;
  amount: number;
}

export interface CustomerPaymentItem {
  ref: string;
  method: string;
  amount: number;
}

export interface CustomerDashboardResponse {
  role: CustomerRole;
  summary: CustomerDashboardSummary;
  shipments: CustomerShipmentItem[];
  invoices: CustomerInvoiceItem[];
  recentPayments: CustomerPaymentItem[];
}

