"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslations } from "next-intl";
import { ClipboardList, Loader2, CheckCircle2, FileText } from "lucide-react";
import { useVendorDashboard } from "@/hooks/use-vendor-dashboard";

const STATS_CONFIG = [
  { key: "pending_acceptance", icon: ClipboardList, tone: "amber" },
  { key: "in_progress", icon: Loader2, tone: "indigo" },
  { key: "completed", icon: CheckCircle2, tone: "emerald" },
  { key: "pending_invoice", icon: FileText, tone: "blue" },
] as const;

const TONE_CLASS = {
  amber: "bg-amber-50 text-amber-600 border-amber-100",
  indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
  emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
  blue: "bg-blue-50 text-blue-600 border-blue-100",
};

export function VendorDashboardStatsCards() {
  const t = useTranslations("Vendor.dashboard.stats");
  const { data, isLoading } = useVendorDashboard();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="border-zinc-200/60">
            <CardContent className="p-5">
              <Skeleton className="mb-2 h-4 w-1/2" />
              <Skeleton className="h-7 w-1/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const stats = data?.data?.stats;
  if (!stats) return null;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {STATS_CONFIG.map(({ key, icon: Icon, tone }) => (
        <Card key={key} className="border-zinc-200/60">
          <CardContent className="flex items-center gap-4 p-5">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${TONE_CLASS[tone]}`}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-zinc-500">{t(`${key}.label`)}</p>
              <p className="mt-0.5 text-2xl font-semibold tracking-tight text-zinc-900">
                {stats[key as keyof typeof stats] ?? 0}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
