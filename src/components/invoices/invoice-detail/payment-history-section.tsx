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

function formatIdr(value: number): string {
  return new Intl.NumberFormat("id-ID").format(value);
}

export function PaymentHistorySection({ invoice }: Props) {
  const t = useTranslations("Invoices.detail.section6");
  const rows = invoice.payment_history;

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
              <th className="px-4 py-3 font-semibold">{t("columns.paymentDate")}</th>
              <th className="px-4 py-3 text-right font-semibold">{t("columns.amount")}</th>
              <th className="px-4 py-3 font-semibold">{t("columns.paymentMethod")}</th>
              <th className="px-4 py-3 font-semibold">{t("columns.referenceNo")}</th>
              <th className="px-4 py-3 font-semibold">{t("columns.status")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-sm text-zinc-500">
                  {t("empty")}
                </td>
              </tr>
            ) : (
              rows.map((p) => (
                <tr key={p.id} className="border-b border-zinc-100 last:border-0">
                  <td className="px-4 py-3 tabular-nums text-zinc-700">
                    {formatDateTime(p.payment_date)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums font-medium text-zinc-900">
                    Rp {formatIdr(p.amount)}
                  </td>
                  <td className="px-4 py-3 text-zinc-700">{p.payment_method ?? "—"}</td>
                  <td className="px-4 py-3 font-mono text-xs text-zinc-700 tabular-nums">
                    {p.reference_no ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-zinc-700">{p.status}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
