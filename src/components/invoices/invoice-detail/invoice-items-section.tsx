"use client";

import { useTranslations } from "next-intl";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import type { CustomerInvoiceDetail } from "@/lib/invoice-types";

interface Props {
  invoice: CustomerInvoiceDetail;
}

function formatIdr(value: number): string {
  return new Intl.NumberFormat("id-ID").format(value);
}

export function InvoiceItemsSection({ invoice }: Props) {
  const t = useTranslations("Invoices.detail.section3");
  const tSum = useTranslations("Invoices.detail.section3.summary");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold tracking-tight text-zinc-900">
          {t("title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 text-left text-[11px] uppercase tracking-wider text-zinc-500">
              <th className="px-3 py-2 font-semibold">{t("columns.description")}</th>
              <th className="px-3 py-2 text-right font-semibold">{t("columns.qty")}</th>
              <th className="px-3 py-2 text-right font-semibold">{t("columns.unitPrice")}</th>
              <th className="px-3 py-2 text-right font-semibold">{t("columns.amount")}</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-sm text-zinc-500">
                  —
                </td>
              </tr>
            ) : (
              invoice.items.map((it) => (
                <tr key={it.id} className="border-b border-zinc-100 last:border-0">
                  <td className="px-3 py-3 font-medium text-zinc-900">{it.description}</td>
                  <td className="px-3 py-3 text-right tabular-nums text-zinc-700">{it.qty}</td>
                  <td className="px-3 py-3 text-right tabular-nums text-zinc-700">
                    Rp {formatIdr(it.unit_price)}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums font-medium text-zinc-900">
                    Rp {formatIdr(it.amount)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="text-sm font-semibold text-zinc-900">{tSum("title")}</div>
          <div className="space-y-2 rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-zinc-600">{tSum("subtotal")}</span>
              <span className="font-medium tabular-nums text-zinc-900">
                Rp {formatIdr(invoice.summary.subtotal)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-zinc-600">{tSum("discount")}</span>
              <span className="font-medium tabular-nums text-zinc-900">
                Rp {formatIdr(invoice.summary.discount)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-zinc-600">{tSum("additionalCharge")}</span>
              <span className="font-medium tabular-nums text-zinc-900">
                Rp {formatIdr(invoice.summary.additional_charge)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-zinc-600">{tSum("ppn")}</span>
              <span className="font-medium tabular-nums text-zinc-900">
                Rp {formatIdr(invoice.summary.ppn)}
              </span>
            </div>
            <div className="mt-3 border-t border-zinc-200 pt-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-zinc-900 font-semibold">{tSum("grandTotal")}</span>
                <span className="font-bold tabular-nums text-zinc-900">
                  Rp {formatIdr(invoice.summary.grand_total)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
