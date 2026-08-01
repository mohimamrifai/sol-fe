"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Inbox } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { paymentStatusBadgeClass, paymentStatusLabelFromApi } from "@/lib/payment-status";
import { paymentMethodKey } from "@/lib/payment-utils";
import type { PaymentDetail } from "@/lib/payment-types";

interface Props {
  payment: PaymentDetail;
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("id-ID", { year: "numeric", month: "short", day: "2-digit" });
}

function formatIdr(value: number): string {
  return new Intl.NumberFormat("id-ID").format(value);
}

export function PaymentHistorySection({ payment }: Props) {
  const t = useTranslations("Payments.detail.section2");
  const tStatus = useTranslations("Payments.status");
  const tMethod = useTranslations("Payments.paymentMethod");
  const rows = payment.payment_history;
  const tSummary = useTranslations("Payments.detail.section2.summary");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold tracking-tight">{t("title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 p-0">
        <div className="overflow-x-auto">
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
                  <td colSpan={5} className="px-4 py-8 text-center">
                    <div className="mx-auto flex max-w-xs flex-col items-center gap-2 text-zinc-500">
                      <Inbox className="h-6 w-6" />
                      <p className="text-sm">{t("empty")}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                rows.map((r) => {
                  const method = paymentMethodKey(r.payment_method);
                  return (
                    <tr key={r.id} className="border-b border-zinc-100 last:border-0">
                      <td className="px-4 py-3 text-zinc-700 tabular-nums">{formatDate(r.payment_date)}</td>
                      <td className="px-4 py-3 text-right font-medium tabular-nums text-zinc-900">
                        Rp {formatIdr(r.amount)}
                      </td>
                      <td className="px-4 py-3 text-zinc-700">
                        {method ? tMethod(method) : (r.payment_method || "—")}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-zinc-700">{r.reference_no ?? "—"}</td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={paymentStatusBadgeClass(String(r.status))}>
                          {tStatus.has(r.status as never) ? tStatus(r.status as never) : paymentStatusLabelFromApi(String(r.status))}
                        </Badge>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-zinc-200 bg-zinc-50/50 px-4 py-3">
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
            {tSummary("title")}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">{tSummary("totalPaid")}</div>
              <div className="text-base font-semibold tabular-nums text-zinc-900">
                Rp {formatIdr(payment.payment_summary.total_paid)}
              </div>
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">{tSummary("outstandingAmount")}</div>
              <div className="text-base font-semibold tabular-nums text-rose-700">
                Rp {formatIdr(payment.payment_summary.outstanding_amount)}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
