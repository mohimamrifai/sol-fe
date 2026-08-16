"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useVendorDashboard } from "@/hooks/use-vendor-dashboard";
import { ArrowRight } from "lucide-react";

const STATUS_BADGE: Record<string, string> = {
  pending_acceptance: "bg-amber-100 text-amber-700 border-amber-200",
  accepted: "bg-blue-100 text-blue-700 border-blue-200",
  in_progress: "bg-indigo-100 text-indigo-700 border-indigo-200",
  waiting_verification: "bg-purple-100 text-purple-700 border-purple-200",
  completed: "bg-emerald-100 text-emerald-700 border-emerald-200",
  rejected: "bg-red-100 text-red-700 border-red-200",
};

export function VendorMyJobOrders() {
  const t = useTranslations("Vendor.dashboard.myJobOrders");
  const tStatus = useTranslations("Vendor.jobOrders.stats");
  const router = useRouter();
  const { data, isLoading } = useVendorDashboard();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  const jobs = data?.data?.my_job_orders ?? [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">{t("title")}</CardTitle>
        <button
          onClick={() => router.push("/dashboard/vendor/job-orders")}
          className="text-xs font-medium text-zinc-600 hover:text-zinc-900"
        >
          {t("viewAll")} <ArrowRight className="ml-1 inline-block h-3 w-3" />
        </button>
      </CardHeader>
      <CardContent>
        {jobs.length === 0 ? (
          <p className="py-8 text-center text-sm text-zinc-500">{t("empty")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 text-left text-xs font-medium text-zinc-500">
                  <th className="py-2 pr-4 font-medium">{t("columns.jo")}</th>
                  <th className="py-2 pr-4 font-medium">{t("columns.customer")}</th>
                  <th className="py-2 pr-4 font-medium">{t("columns.service")}</th>
                  <th className="py-2 pr-4 font-medium">{t("columns.assigned")}</th>
                  <th className="py-2 pr-4 font-medium">{t("columns.due")}</th>
                  <th className="py-2 pr-4 font-medium">{t("columns.status")}</th>
                  <th className="py-2 font-medium">{t("columns.action")}</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((j) => (
                  <tr
                    key={j.id}
                    className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50"
                  >
                    <td className="py-3 pr-4 font-mono text-xs text-zinc-700">{j.jo_number}</td>
                    <td className="py-3 pr-4 text-zinc-900">{j.customer_name}</td>
                    <td className="py-3 pr-4 text-zinc-600">{j.service}</td>
                    <td className="py-3 pr-4 text-zinc-600">{j.assigned_date ?? "—"}</td>
                    <td className="py-3 pr-4 text-zinc-600">{j.due_date}</td>
                    <td className="py-3 pr-4">
                      <Badge className={`${STATUS_BADGE[j.vendor_status as keyof typeof STATUS_BADGE] ?? ""} border text-xs`}>
                        {tStatus(j.vendor_status as never)}
                      </Badge>
                    </td>
                    <td className="py-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs"
                        onClick={() => router.push(`/dashboard/vendor/job-orders/${j.id}`)}
                      >
                        {t("columns.detail")}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
