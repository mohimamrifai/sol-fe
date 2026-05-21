import { DashboardSuperAdmin } from "./DashboardSuperAdmin";
import type { AdminDashboardPayload } from "@/lib/dashboard-api";

export function DashboardFinance(props: {
  data: AdminDashboardPayload | null;
  loading?: boolean;
}) {
  return <DashboardSuperAdmin {...props} />;
}
