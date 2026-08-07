"use client";

import { VendorDashboardStatsCards } from "@/components/vendor/dashboard/vendor-dashboard-stats-cards";
import { VendorMyJobOrders } from "@/components/vendor/dashboard/vendor-my-job-orders";
import { VendorPerformanceSummary } from "@/components/vendor/dashboard/vendor-performance-summary";
import { VendorQuickActions } from "@/components/vendor/dashboard/vendor-quick-actions";
import { VendorUpcomingDeadlines } from "@/components/vendor/dashboard/vendor-upcoming-deadlines";
import { VendorRecentActivities } from "@/components/vendor/dashboard/vendor-recent-activities";
import { VendorPendingDocuments } from "@/components/vendor/dashboard/vendor-pending-documents";

export function DashboardVendorCompanyAdmin() {
  return (
    <div className="flex min-w-0 w-full flex-1 flex-col gap-6">
      <VendorDashboardStatsCards />
      <VendorQuickActions />
      <VendorMyJobOrders />
      <VendorPerformanceSummary />
      <VendorUpcomingDeadlines />
      <VendorPendingDocuments />
      <VendorRecentActivities />
    </div>
  );
}
