"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, CheckCircle2, XCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useVendorUserStats } from "@/hooks/use-vendor-users";

const STATS_CONFIG = [
  { key: "total", icon: Users, tone: "neutral" },
  { key: "active", icon: CheckCircle2, tone: "emerald" },
  { key: "inactive", icon: XCircle, tone: "red" },
] as const;

const TONE_CLASS = {
  neutral: "bg-zinc-50 text-zinc-700 border-zinc-200",
  emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
  red: "bg-red-50 text-red-600 border-red-100",
};

export function VendorUsersStatsCards() {
  const t = useTranslations("Vendor.users.stats");
  const { data, isLoading } = useVendorUserStats();
  const stats = data?.data;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[...Array(3)].map((_, i) => (
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

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {STATS_CONFIG.map(({ key, icon: Icon, tone }) => (
        <Card key={key} className="border-zinc-200/60">
          <CardContent className="flex items-center gap-3 p-4">
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${TONE_CLASS[tone]}`}>
              <Icon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-500">{t(key)}</p>
              <p className="text-xl font-semibold text-zinc-900">
                {stats?.[key as keyof typeof stats] ?? 0}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
