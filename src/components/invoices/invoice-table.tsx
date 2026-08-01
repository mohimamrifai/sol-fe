"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Eye, Inbox, Receipt } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PaginationBar } from "@/components/data-table/pagination-bar";
import { usePathname } from "@/i18n/routing";
import { invoiceStatusBadgeClass } from "@/lib/invoice-status";
import type { CustomerInvoiceRow, InvoiceStatusKey } from "@/lib/invoice-types";

interface Props {
  rows: CustomerInvoiceRow[];
  page: number;
  perPage: number;
  total: number;
  onPageChange: (page: number) => void;
  loading?: boolean;
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

export function InvoiceTable({ rows, page, perPage, total, onPageChange, loading }: Props) {
  const t = useTranslations("Invoices.table");
  const tStatus = useTranslations("Invoices.status");
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
              <th className="px-4 py-3 font-semibold">{t("columns.invoiceNo")}</th>
              <th className="px-4 py-3 font-semibold">{t("columns.shipmentNo")}</th>
              <th className="px-4 py-3 font-semibold">{t("columns.invoiceDate")}</th>
              <th className="px-4 py-3 font-semibold">{t("columns.dueDate")}</th>
              <th className="px-4 py-3 text-right font-semibold">{t("columns.totalAmount")}</th>
              <th className="px-4 py-3 text-right font-semibold">{t("columns.outstanding")}</th>
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
                const shipmentNo = row.shipment?.shipment_number ?? "—";

                return (
                  <tr key={row.id} className="border-b border-zinc-100 last:border-0">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-zinc-100 text-zinc-600">
                          <Receipt className="h-3.5 w-3.5" />
                        </span>
                        <span className="font-mono text-xs text-zinc-900">{row.invoice_number}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-zinc-700 tabular-nums">
                      {shipmentNo}
                    </td>
                    <td className="px-4 py-3 text-zinc-700 tabular-nums">
                      {formatDate(row.invoice_date)}
                    </td>
                    <td className="px-4 py-3 text-zinc-700 tabular-nums">
                      {formatDate(row.due_date)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium tabular-nums text-zinc-900">
                      Rp {formatIdr(row.total_amount)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium tabular-nums text-zinc-900">
                      Rp {formatIdr(row.outstanding_amount)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={invoiceStatusBadgeClass(row.status)}>
                        {tStatus(row.status as InvoiceStatusKey)}
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
