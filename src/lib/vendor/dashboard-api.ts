import { apiFetch } from "../api-client";

export type VendorDashboardStats = {
  pending_acceptance: number;
  in_progress: number;
  completed: number;
  pending_invoice: number;
};

export type VendorDashboardMyJob = {
  id: number;
  jo_number: string;
  shipment_number: string;
  customer_name: string;
  service: string;
  assigned_date?: string;
  origin: string;
  destination: string;
  due_date: string;
  vendor_status: string;
};

export type VendorDashboardPerformance = {
  active_job_orders: number;
  completed_this_month: number;
  pending_acceptance: number;
  invoice_outstanding: number;
};

export type VendorDashboardPayload = {
  stats: VendorDashboardStats;
  quick_actions: {
    view_pending_jobs: number;
    create_invoice: number;
  };
  my_job_orders: VendorDashboardMyJob[];
  performance: VendorDashboardPerformance;
  upcoming_deadlines: Array<{
    id: number;
    jo_number: string;
    customer_name: string;
    due_date: string;
    remaining_days: number;
    vendor_status: string;
  }>;
  recent_activities: Array<{
    id: number;
    event_key: string;
    description?: string;
    actor_name: string | null;
    occurred_at: string;
  }>;
  pending_documents: Array<{
    id: number;
    jo_number: string;
    document_key: string;
    status_key: string;
    action_key: string;
    action_url: string;
  }>;
  vendor_company: {
    id: number;
    name: string;
    company_code: string;
    status: string;
    service_categories: string[];
  } | null;
};

export function fetchVendorDashboard() {
  return apiFetch<{ data: VendorDashboardPayload }>("/vendor/dashboard");
}
