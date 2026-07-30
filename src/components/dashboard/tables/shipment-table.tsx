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
import { Eye } from "lucide-react";
import { Link } from "@/i18n/routing";
import { formatShortDate } from "../format";
import { useTWithFallback } from "../use-t-fallback";
import { shipmentStatusBadgeClass } from "@/lib/shipment-status";
import type { CustomerDashboardShipment } from "@/lib/dashboard-api";

interface Props {
  rows: CustomerDashboardShipment[];
  locale: string;
  emptyText: string;
}

export function ShipmentTable({ rows, locale, emptyText }: Props) {
  const t = useTranslations("Dashboard");
  const tf = useTWithFallback();
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="min-w-[140px]">{t("table.shipmentNo")}</TableHead>
          <TableHead>{t("table.route")}</TableHead>
          <TableHead>{t("table.service")}</TableHead>
          <TableHead>{t("table.currentStatus")}</TableHead>
          <TableHead>{t("table.eta")}</TableHead>
          <TableHead className="w-20 text-right">{t("table.view")}</TableHead>
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
          rows.map((s) => (
            <TableRow key={s.id}>
              <TableCell className="font-mono text-xs">{s.shipment_number}</TableCell>
              <TableCell className="text-sm">{s.route}</TableCell>
              <TableCell className="text-sm text-zinc-600">{s.service}</TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={shipmentStatusBadgeClass(s.current_status)}
                >
                  {tf(`Dashboard.status.shipment.${s.current_status}`, s.current_status)}
                </Badge>
              </TableCell>
              <TableCell className="text-sm tabular-nums text-zinc-600">
                {formatShortDate(s.eta ?? null, locale)}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  nativeButton={false}
                  aria-label={t("table.view")}
                  render={
                    <Link
                      href={`/dashboard/shipments/${s.id}` as never}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </Link>
                  }
                />
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
