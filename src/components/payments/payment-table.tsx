"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Eye, Inbox, Wallet } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PaginationBar } from "@/components/data-table/pagination-bar";
import { usePathname } from "@/i18n/routing";
import {
  paymentStatusBadgeClass,
  paymentStatusLabelFromApi,
} from "@/lib/payment-status";
import { paymentMethodKey } from "@/lib/payment-utils";
import type { PaymentListItem, PaymentMethod, PaymentStatus } from "@/lib/payment-types";

interface Props {
  rows: PaymentListItem[];
  page: number;
  perPage: number;
  total: number;
  onPageChange: (page: number) => void;
  loading?: boolean;
}

function formatIdr(value: number): string {
  return new Intl.NumberFormat("id-ID").format(value);
}

export function PaymentTable({ rows, page, perPage, total, onPageChange, loading }: Props) {
  const t = useTranslations("Payments.table");
  const tStatus = useTranslations("Payments.status");
  const tMethod = useTranslations("Payments.paymentMethod");
  const router = useRouter();
  const pathname = usePathname();

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
              <th className="px-4 py-3 font-semibold">{t("columns.paymentNo")}</th>
              <th className="px-4 py-3 font-semibold">{t("columns.invoiceNo")}</th>
              <th className="px-4 py-3 text-right font-semibold">{t("columns.invoiceAmount")}</th>
              <th className="px-4 py-3 text-right font-semibold">{t("columns.paidAmount")}</th>
              <th className="px-4 py-3 text-right font-semibold">{t("columns.outstanding")}</th>
              <th className="px-4 py-3 font-semibold">{t("columns.paymentMethod")}</th>
              <th className="px-4 py-3 font-semibold">{t("columns.status")}</th>
              <th className="px-4 py-3 text-right font-semibold">{t("columns.action")}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className="border-b border-zinc-100">
                  {Array.from({ length: 8 }).map((__, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 w-full max-w-[120px] animate-pulse rounded bg-zinc-100" />
                    </td>
                  ))}
                </tr>
              ))
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center">
                  <div className="mx-auto flex max-w-xs flex-col items-center gap-2 text-zinc-500">
                    <Inbox className="h-8 w-8" />
                    <p className="text-sm">{t("empty")}</p>
                  </div>
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const rawStatus = String(row.status ?? "").toLowerCase();
                const badgeKey: PaymentStatus = (["unpaid", "pending", "success", "failed", "expired", "refunded"].includes(
                  rawStatus
                )
                  ? rawStatus
                  : "pending") as PaymentStatus;
                const methodKey = paymentMethodKey(row.payment_method) as PaymentMethod | null;
                const methodLabel = methodKey ? tMethod(methodKey) : (row.payment_method || "—");

                return (
                  <tr key={row.id} className="border-b border-zinc-100 last:border-0">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-zinc-100 text-zinc-600">
                          <Wallet className="h-3.5 w-3.5" />
                        </span>
                        <span className="font-mono text-xs text-zinc-900">{row.payment_no}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-zinc-700">
                      {row.invoice_number ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-medium tabular-nums text-zinc-900">
                      Rp {formatIdr(row.invoice_amount)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-zinc-700">
                      Rp {formatIdr(row.paid_amount)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium tabular-nums text-rose-700">
                      Rp {formatIdr(row.outstanding_amount)}
                    </td>
                    <td className="px-4 py-3 text-zinc-700">{methodLabel}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={paymentStatusBadgeClass(rawStatus)}>
                        {tStatus.has(badgeKey) ? tStatus(badgeKey) : paymentStatusLabelFromApi(rawStatus)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`${pathname}/${row.id}`)}
                        className="h-7 gap-1 px-2 text-xs"
                      >
                        <Eye className="h-3 w-3" />
                        {t("detail")}
                      </Button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        {rows.length > 0 ? (
          <div className="px-4 py-3">
            <PaginationBar
              currentPage={page}
              lastPage={Math.max(1, Math.ceil(total / Math.max(1, perPage)))}
              total={total}
              from={total > 0 ? (page - 1) * perPage + 1 : null}
              to={Math.min(page * perPage, total)}
              onPageChange={onPageChange}
            />
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
