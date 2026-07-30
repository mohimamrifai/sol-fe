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
import { Button } from "@/components/ui/button";
import { CreditCard, Eye } from "lucide-react";
import { Link } from "@/i18n/routing";
import { formatIdr, formatShortDate } from "../format";
import { useTWithFallback } from "../use-t-fallback";
import { invoiceStatusBadgeClass } from "@/lib/invoice-status";
import type { CustomerDashboardInvoice } from "@/lib/dashboard-api";

interface Props {
  rows: CustomerDashboardInvoice[];
  locale: string;
  emptyText: string;
}

export function InvoiceTable({ rows, locale, emptyText }: Props) {
  const t = useTranslations("Dashboard");
  const tf = useTWithFallback();
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="min-w-[140px]">{t("table.invoiceNo")}</TableHead>
          <TableHead>{t("table.dueDate")}</TableHead>
          <TableHead className="text-right">{t("table.amount")}</TableHead>
          <TableHead className="text-right">{t("table.outstanding")}</TableHead>
          <TableHead>{t("table.status")}</TableHead>
          <TableHead className="w-32 text-right">{t("table.view")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6} className="text-center text-sm text-zinc-500">
              {emptyText}
            </TableCell>
          </TableRow>
        ) : (
          rows.map((i) => (
            <TableRow key={i.id}>
              <TableCell className="font-mono text-xs">{i.invoice_number}</TableCell>
              <TableCell className="text-sm tabular-nums text-zinc-600">
                {formatShortDate(i.due_date ?? null, locale)}
              </TableCell>
              <TableCell className="text-right text-sm tabular-nums">
                {formatIdr(i.amount)}
              </TableCell>
              <TableCell className="text-right text-sm font-semibold tabular-nums text-amber-700">
                {formatIdr(i.outstanding)}
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={invoiceStatusBadgeClass(i.status)}
                >
                  {tf(`Dashboard.status.invoice.${i.status}`, i.status)}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    nativeButton={false}
                    aria-label={t("table.view")}
                    render={
                      <Link
                        href={`/dashboard/invoices/${i.id}` as never}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-md text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Link>
                    }
                  />
                  {i.outstanding > 0 ? (
                    <Button
                      variant="outline"
                      size="xs"
                      nativeButton={false}
                      className="h-7 gap-1 border-emerald-200 bg-emerald-50 px-2 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800"
                      render={
                        <Link
                          href={`/dashboard/invoices/${i.id}?pay=now` as never}
                          className="inline-flex h-7 items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
                        >
                          <CreditCard className="h-3 w-3" />
                          {t("table.payNow")}
                        </Link>
                      }
                    />
                  ) : null}
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
