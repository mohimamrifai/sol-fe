"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslations } from "next-intl";
import { useVendorInvoice } from "@/hooks/use-vendor-invoices";
import { History } from "lucide-react";

type Props = { invoiceId: number };

export function VendorInvoiceActivitiesSection({ invoiceId }: Props) {
  const t = useTranslations("Vendor.invoices.detail.sections");
  const { data } = useVendorInvoice(invoiceId);
  const activities = data?.data?.activities ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <History className="h-4 w-4 text-zinc-600" />
          {t("activity")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <p className="text-sm text-zinc-500">No activities yet.</p>
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
