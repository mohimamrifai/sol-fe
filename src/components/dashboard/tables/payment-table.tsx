"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatIdr, formatShortDate } from "../format";
import { useTWithFallback } from "../use-t-fallback";
import type { CustomerDashboardPayment } from "@/lib/dashboard-api";

interface Props {
  rows: CustomerDashboardPayment[];
  locale: string;
  emptyText: string;
}

export function PaymentTable({ rows, locale, emptyText }: Props) {
  const t = useTranslations("Dashboard");
  const tf = useTWithFallback();
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("table.paymentDate")}</TableHead>
          <TableHead className="min-w-[140px]">{t("table.invoiceNo")}</TableHead>
          <TableHead className="text-right">{t("table.amount")}</TableHead>
          <TableHead>{t("table.method")}</TableHead>
          <TableHead>{t("table.status")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length === 0 ? (
          <TableRow>
            <TableCell colSpan={5} className="text-center text-sm text-zinc-500">
              {emptyText}
            </TableCell>
          </TableRow>
        ) : (
          rows.map((p) => (
            <TableRow key={p.id}>
              <TableCell className="text-sm tabular-nums text-zinc-600">
                {formatShortDate(p.paid_at_date ?? null, locale)}
              </TableCell>
              <TableCell className="font-mono text-xs">{p.invoice_number}</TableCell>
              <TableCell className="text-right text-sm tabular-nums">
                {formatIdr(p.amount)}
              </TableCell>
              <TableCell className="text-sm text-zinc-600">{p.method}</TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={paymentStatusBadgeClass(p.status)}
                >
                  {tf(`Dashboard.status.payment.${p.status}`, p.status)}
                </Badge>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}

function paymentStatusBadgeClass(status: string): string {
  switch (status) {
    case "success":
      return "border-emerald-200 bg-emerald-50 text-emerald-800";
    case "pending":
      return "border-sky-200 bg-sky-50 text-sky-800";
    case "failed":
    case "expired":
      return "border-red-200 bg-red-50 text-red-800";
    default:
      return "border-border bg-muted text-muted-foreground";
  }
}
