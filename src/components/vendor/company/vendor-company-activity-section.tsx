"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { History } from "lucide-react";
import { useVendorCompanyActivities } from "@/hooks/use-vendor-company";

export function VendorCompanyActivitySection() {
  const t = useTranslations("Vendor.company.sections");
  const { data, isLoading } = useVendorCompanyActivities();
  const items = data?.data ?? [];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-zinc-500" />
          <CardTitle className="text-base">{t("activity")}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-6 w-full" />)}
          </div>
        ) : items.length === 0 ? (
          <p className="text-sm text-zinc-500">No activity yet.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {items.map((a) => (
              <li key={a.id} className="flex items-center justify-between border-b border-zinc-100 pb-2 last:border-0">
                <span>{a.description}</span>
                <span className="text-xs text-zinc-500">
                  {new Date(a.occurred_at).toLocaleString("id-ID")} · {a.actor_name ?? "—"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
