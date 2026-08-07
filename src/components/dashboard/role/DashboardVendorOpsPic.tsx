"use client";

import { VendorDashboardStatsCards } from "@/components/vendor/dashboard/vendor-dashboard-stats-cards";
import { VendorMyJobOrders } from "@/components/vendor/dashboard/vendor-my-job-orders";
import { VendorQuickActions } from "@/components/vendor/dashboard/vendor-quick-actions";
import { VendorUpcomingDeadlines } from "@/components/vendor/dashboard/vendor-upcoming-deadlines";
import { VendorRecentActivities } from "@/components/vendor/dashboard/vendor-recent-activities";

export function DashboardVendorOpsPic() {
  return (
    <div className="flex min-w-0 w-full flex-1 flex-col gap-6">
      <VendorDashboardStatsCards />
      <VendorQuickActions />
      <div className="grid gap-6 lg:grid-cols-2">
        <VendorUpcomingDeadlines />
        <VendorRecentActivities />
      </div>
      <VendorMyJobOrders />
    </div>
  );
}
