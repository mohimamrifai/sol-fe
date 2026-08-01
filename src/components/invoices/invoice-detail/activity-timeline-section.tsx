"use client";

import { useTranslations } from "next-intl";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import type { CustomerInvoiceDetail } from "@/lib/invoice-types";

interface Props {
  invoice: CustomerInvoiceDetail;
}

function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString("id-ID", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ActivityTimelineSection({ invoice }: Props) {
  const t = useTranslations("Invoices.detail.section7");
  const rows = invoice.activity_timeline;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold tracking-tight text-zinc-900">
          {t("title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 text-left text-[11px] uppercase tracking-wider text-zinc-500">
              <th className="px-4 py-3 font-semibold">{t("columns.dateTime")}</th>
              <th className="px-4 py-3 font-semibold">{t("columns.activity")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={2} className="px-4 py-10 text-center text-sm text-zinc-500">
                  {t("empty")}
                </td>
              </tr>
            ) : (
              rows.map((e, i) => (
                <tr key={`${e.occurred_at}-${i}`} className="border-b border-zinc-100 last:border-0">
                  <td className="px-4 py-3 tabular-nums text-zinc-700">
                    {formatDateTime(e.occurred_at)}
                  </td>
                  <td className="px-4 py-3 text-zinc-900">{e.activity}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
