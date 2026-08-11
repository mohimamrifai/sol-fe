import { DashboardSuperAdmin } from "./DashboardSuperAdmin";
import type { AdminDashboardFilters, AdminDashboardPayload } from "@/lib/dashboard-api";

export function DashboardSales(props: {
  data: AdminDashboardPayload | null;
  loading?: boolean;
  filters?: AdminDashboardFilters;
  onFiltersChange?: (filters: AdminDashboardFilters) => void;
}) {
  return <DashboardSuperAdmin {...props} />;
}
