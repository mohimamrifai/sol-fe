"use client";

import { useTranslations, useLocale } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { History } from "lucide-react";
import { useVendorDashboard } from "@/hooks/use-vendor-dashboard";

export function VendorRecentActivities() {
  const t = useTranslations("Vendor.dashboard");
  const tAct = useTranslations("Vendor.dashboard.activities");
  const locale = useLocale();
  const { data, isLoading } = useVendorDashboard();
  const items = data?.data?.recent_activities ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <History className="h-4 w-4 text-zinc-600" />
          {t("recentActivities.title")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-7 w-full" />)}
          </div>
        ) : items.length === 0 ? (
          <p className="text-sm text-zinc-500">{t("recentActivities.empty")}</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {items.map((a) => {
              let label: string;
              try {
                label = tAct(a.event_key as never);
              } catch {
                label = a.event_key;
              }
              return (
                <li key={a.id} className="flex items-center justify-between border-b border-zinc-100 pb-2 last:border-0">
                  <span className="text-zinc-700">{label}</span>
                  <span className="text-xs text-zinc-500">
                    {a.occurred_at
                      ? new Date(a.occurred_at).toLocaleString(locale, {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "—"}
                    {a.actor_name ? ` · ${a.actor_name}` : ""}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
