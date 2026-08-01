"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Inbox } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import type { PaymentDetail } from "@/lib/payment-types";

interface Props {
  payment: PaymentDetail;
}

function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString("id-ID", { year: "numeric", month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export function ActivityTimelineSection({ payment }: Props) {
  const t = useTranslations("Payments.detail.section6");
  const rows = payment.activity_timeline;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold tracking-tight">{t("title")}</CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-6 text-zinc-500">
            <Inbox className="h-6 w-6" />
            <p className="text-sm">{t("empty")}</p>
          </div>
        ) : (
          <ol className="space-y-2 border-l border-zinc-200 pl-4">
            {rows.map((row, i) => (
              <li key={i} className="relative">
                <span className="absolute -left-[1.4rem] top-1.5 h-2 w-2 rounded-full bg-zinc-300" />
                <div className="text-sm font-medium text-zinc-900">{row.activity}</div>
                <div className="text-[11px] text-zinc-500">{formatDateTime(row.occurred_at)}</div>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
