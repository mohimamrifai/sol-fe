"use client";

import { VendorDashboardStatsCards } from "@/components/vendor/dashboard/vendor-dashboard-stats-cards";

export function DashboardVendorViewer() {
  return (
    <div className="flex min-w-0 w-full flex-1 flex-col gap-6">
      <VendorDashboardStatsCards />
    </div>
  );
}
