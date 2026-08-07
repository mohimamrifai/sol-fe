"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslations } from "next-intl";
import { useVendorPayment } from "@/hooks/use-vendor-payments";

type Props = { paymentId: number };

export function VendorPaymentActivitiesSection({ paymentId }: Props) {
  const t = useTranslations("Vendor.payments.detail.sections");
  const { data, isLoading } = useVendorPayment(paymentId);
  const activities = data?.data?.activities ?? [];

  if (isLoading) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-base">{t("activity")}</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-7 w-full" />)}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">{t("activity")}</CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <p className="text-sm text-zinc-500">No activity yet.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {activities.map((a) => (
              <li key={a.id} className="flex items-center justify-between border-b border-zinc-100 pb-2 last:border-0">
                <span className="text-zinc-700">{a.description}</span>
                <span className="text-xs text-zinc-500">
                  {a.occurred_at ? new Date(a.occurred_at).toLocaleString("id-ID") : "—"}
                  {a.actor_name ? ` · ${a.actor_name}` : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
