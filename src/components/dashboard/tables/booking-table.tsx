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
import { formatShortDate } from "../format";
import { useTWithFallback } from "@/hooks/use-t-fallback";
import type { CustomerDashboardBooking } from "@/lib/dashboard-api";

interface Props {
  rows: CustomerDashboardBooking[];
  locale: string;
  emptyText: string;
}

export function BookingTable({ rows, locale, emptyText }: Props) {
  const t = useTranslations("Dashboard");
  const tf = useTWithFallback();
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="min-w-[140px]">{t("table.bookingNo")}</TableHead>
          <TableHead>{t("table.bookingDate")}</TableHead>
          <TableHead>{t("table.route")}</TableHead>
          <TableHead>{t("table.service")}</TableHead>
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
          rows.map((b) => (
            <TableRow key={b.id}>
              <TableCell className="font-mono text-xs">{b.booking_number}</TableCell>
              <TableCell className="text-sm tabular-nums text-zinc-600">
                {formatShortDate(b.booking_date ?? null, locale)}
              </TableCell>
              <TableCell className="text-sm">{b.route}</TableCell>
              <TableCell className="text-sm text-zinc-600">{b.service}</TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={bookingStatusBadgeClass(b.status)}
                >
                  {tf(`Dashboard.status.booking.${b.status}`, b.status)}
                </Badge>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}

/**
 * Visual styling for booking status badges. Mirrors the tone of
 * `shipmentStatusBadgeClass` so the dashboard feels uniform.
 */
function bookingStatusBadgeClass(status: string): string {
  switch (status) {
    case "draft":
      return "border-zinc-200 bg-zinc-100 text-zinc-800";
    case "submitted":
      return "border-sky-200 bg-sky-50 text-sky-800";
    case "under_review":
      return "border-orange-200 bg-orange-50 text-orange-900";
    case "confirmed":
      return "border-indigo-200 bg-indigo-50 text-indigo-800";
    case "approved":
      return "border-emerald-200 bg-emerald-50 text-emerald-800";
    case "rejected":
      return "border-red-200 bg-red-50 text-red-800";
    case "cancelled":
      return "border-orange-200 bg-orange-50 text-orange-800";
    default:
      return "border-border bg-muted text-muted-foreground";
  }
}
