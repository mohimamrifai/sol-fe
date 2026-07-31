"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { ArrowRight, Inbox } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PaginationBar } from "@/components/data-table/pagination-bar";
import { cn } from "@/lib/utils";
import { shipmentStatusBadgeClass, shipmentStatusCardLabelKey } from "@/lib/shipment-status";
import { usePathname } from "@/i18n/routing";

export interface ShipmentRow {
  id: number | string;
  display_number?: string;
  shipment_number?: string;
  waybill_number?: string;
  high_level_status?: string;
  estimated_arrival?: string | null;
  origin_location?: { name?: string; code?: string } | null;
  destination_location?: { name?: string; code?: string } | null;
  service_type?: { name?: string; code?: string } | null;
  booking?: { booking_number?: string } | null;
}

interface Props {
  rows: ShipmentRow[];
  page: number;
  perPage: number;
  total: number;
  onPageChange: (page: number) => void;
  loading?: boolean;
}

export function ShipmentTable({ rows, page, perPage, total, onPageChange, loading }: Props) {
  const t = useTranslations("Shipments.table");
  const tCard = useTranslations("Shipments.card");
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
              <th className="px-4 py-3 font-semibold">{t("columns.shipmentNo")}</th>
              <th className="px-4 py-3 font-semibold">{t("columns.bookingNo")}</th>
              <th className="px-4 py-3 font-semibold">{t("columns.cnNo")}</th>
              <th className="px-4 py-3 font-semibold">{t("columns.origin")}</th>
              <th className="px-4 py-3 font-semibold">{t("columns.destination")}</th>
              <th className="px-4 py-3 font-semibold">{t("columns.service")}</th>
              <th className="px-4 py-3 font-semibold">{t("columns.eta")}</th>
              <th className="px-4 py-3 font-semibold">{t("columns.status")}</th>
              <th className="px-4 py-3 text-right font-semibold">{t("columns.action")}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className="border-b border-zinc-100">
                  {Array.from({ length: 9 }).map((__, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 w-full max-w-[120px] animate-pulse rounded bg-zinc-100" />
                    </td>
                  ))}
                </tr>
              ))
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-10 text-center">
                  <div className="mx-auto flex max-w-xs flex-col items-center gap-2 text-zinc-500">
                    <Inbox className="h-8 w-8" />
                    <p className="text-sm">{t("empty")}</p>
                  </div>
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const status = row.high_level_status ?? "planning";
                const labelKey = shipmentStatusCardLabelKey(status).split(".")[1] ?? "planning";
                return (
                  <tr key={row.id} className="border-b border-zinc-100 last:border-0">
                    <td className="px-4 py-3 font-medium text-zinc-900">
                      {row.display_number ?? row.shipment_number ?? `SHP-${row.id}`}
                    </td>
                    <td className="px-4 py-3 text-zinc-700">
                      {row.booking?.booking_number ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-zinc-700">
                      {row.waybill_number ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-zinc-700">
                      {row.origin_location?.code ?? row.origin_location?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-zinc-700">
                      {row.destination_location?.code ?? row.destination_location?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-zinc-700">
                      {row.service_type?.code ?? row.service_type?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-zinc-700 tabular-nums">
                      {row.estimated_arrival ? new Date(row.estimated_arrival).toLocaleDateString("id-ID") : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
                          shipmentStatusBadgeClass(status)
                        )}
                      >
                        {tCard(labelKey)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`${pathname}/${row.id}`)}
                        className="h-8 gap-1 px-2 text-xs"
                      >
                        {t("actionDetail")}
                        <ArrowRight className="h-3 w-3" />
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
