"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock } from "lucide-react";
import { useVendorDashboard } from "@/hooks/use-vendor-dashboard";

const STATUS_BADGE: Record<string, string> = {
  pending_acceptance: "bg-amber-100 text-amber-700 border-amber-200",
  accepted: "bg-blue-100 text-blue-700 border-blue-200",
  in_progress: "bg-indigo-100 text-indigo-700 border-indigo-200",
  waiting_verification: "bg-purple-100 text-purple-700 border-purple-200",
  completed: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

export function VendorUpcomingDeadlines() {
  const t = useTranslations("Vendor.dashboard");
  const tStatus = useTranslations("Vendor.jobOrders.stats");
  const router = useRouter();
  const { data, isLoading } = useVendorDashboard();
  const items = data?.data?.upcoming_deadlines ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Clock className="h-4 w-4 text-zinc-600" />
          {t("upcomingDeadlines.title")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-9 w-full" />)}
          </div>
        ) : items.length === 0 ? (
          <p className="text-sm text-zinc-500">{t("upcomingDeadlines.empty")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 text-left text-xs font-medium text-zinc-500">
                  <th className="px-2 py-2 font-medium">{t("upcomingDeadlines.joNo")}</th>
                  <th className="px-2 py-2 font-medium">{t("upcomingDeadlines.customer")}</th>
                  <th className="px-2 py-2 font-medium">{t("upcomingDeadlines.dueDate")}</th>
                  <th className="px-2 py-2 font-medium">{t("upcomingDeadlines.remaining")}</th>
                  <th className="px-2 py-2 font-medium">{t("upcomingDeadlines.status")}</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it) => (
                  <tr
                    key={it.id}
                    onClick={() => router.push(`/dashboard/vendor/job-orders/${it.id}`)}
                    className="cursor-pointer border-b border-zinc-100 last:border-0 hover:bg-zinc-50"
                  >
                    <td className="px-2 py-2 font-mono text-xs">{it.jo_number}</td>
                    <td className="px-2 py-2 text-zinc-700">{it.customer_name ?? "—"}</td>
                    <td className="px-2 py-2 text-zinc-600">{it.due_date ?? "—"}</td>
                    <td className="px-2 py-2">
                      {it.remaining_days !== null ? (
                        <span className={it.remaining_days <= 1 ? "font-semibold text-red-600" : "text-zinc-700"}>
                          {it.remaining_days === 0 ? t("upcomingDeadlines.remainingToday") : t("upcomingDeadlines.remainingDays", { count: it.remaining_days })}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="px-2 py-2">
                      <Badge className={`${STATUS_BADGE[it.vendor_status as keyof typeof STATUS_BADGE] ?? ""} border text-xs`}>
                        {tStatus(it.vendor_status as never)}
                      </Badge>
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
