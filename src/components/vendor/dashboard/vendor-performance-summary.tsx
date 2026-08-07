"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslations, useLocale } from "next-intl";
import { useVendorDashboard } from "@/hooks/use-vendor-dashboard";
import { Briefcase, CheckCircle2, Clock, Receipt } from "lucide-react";

const ICON_MAP = {
  active_job_orders: Briefcase,
  completed_this_month: CheckCircle2,
  pending_acceptance: Clock,
  invoice_outstanding: Receipt,
};

const TONE_CLASS: Record<string, string> = {
  active_job_orders: "border-blue-100 bg-blue-50 text-blue-600",
  completed_this_month: "border-emerald-100 bg-emerald-50 text-emerald-600",
  pending_acceptance: "border-amber-100 bg-amber-50 text-amber-600",
  invoice_outstanding: "border-violet-100 bg-violet-50 text-violet-600",
};

export function VendorPerformanceSummary() {
  const t = useTranslations("Vendor.dashboard.performance");
  const locale = useLocale();
  const { data, isLoading } = useVendorDashboard();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  const performance = data?.data?.performance;
  if (!performance) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {Object.entries(performance).map(([key, value]) => {
            const Icon = ICON_MAP[key as keyof typeof ICON_MAP] ?? Briefcase;
            const tone = TONE_CLASS[key] ?? "border-zinc-200 bg-zinc-50 text-zinc-700";
            return (
              <div key={key} className="flex items-start gap-3">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${tone}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs text-zinc-500">{t(`metrics.${key}`)}</p>
                  <p className="text-lg font-semibold text-zinc-900">
                    {key === "invoice_outstanding"
                      ? new Intl.NumberFormat(locale, { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(value))
                      : value}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
