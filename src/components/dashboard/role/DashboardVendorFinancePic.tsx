"use client";

import { VendorDashboardStatsCards } from "@/components/vendor/dashboard/vendor-dashboard-stats-cards";
import { VendorPerformanceSummary } from "@/components/vendor/dashboard/vendor-performance-summary";
import { VendorQuickActions } from "@/components/vendor/dashboard/vendor-quick-actions";
import { VendorRecentActivities } from "@/components/vendor/dashboard/vendor-recent-activities";

export function DashboardVendorFinancePic() {
  return (
    <div className="flex min-w-0 w-full flex-1 flex-col gap-6">
      <VendorDashboardStatsCards />
      <VendorQuickActions />
      <div className="grid gap-6 lg:grid-cols-2">
        <VendorPerformanceSummary />
        <VendorRecentActivities />
      </div>
    </div>
  );
}
