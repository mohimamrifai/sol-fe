"use client";

import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fsdShipmentStatusBadgeClass } from "@/lib/shipment-status";
import { resolveFsdShipmentStatus } from "@/lib/shipment-fsd-status";
import { cn } from "@/lib/utils";
import { Eye } from "lucide-react";
import { Link } from "@/i18n/routing";
import { Skeleton } from "@/components/ui/skeleton";
import { useShipmentStatusLabel } from "@/hooks/use-admin-status-labels";
import { useTranslations } from "next-intl";

interface ShipmentTableProps {
  rows: Array<{
    id?: number | string;
    status?: string;
    fsd_status?: string;
    waybill_number?: string;
    shipment_number?: string;
    display_number?: string;
    booking?: { booking_number?: string };
    company?: { name?: string };
    Company?: { name?: string };
    origin_location?: { name?: string };
    originLocation?: { name?: string };
    destination_location?: { name?: string };
    destinationLocation?: { name?: string };
    service_type?: { name?: string };
    serviceType?: { name?: string };
  }>;
  meta: { current_page?: number } | null;
  perPage: number;
  loading: boolean;
}

const actionsHeadClass =
  "w-24 max-md:sticky max-md:right-0 max-md:z-20 max-md:border-l max-md:border-border max-md:bg-card max-md:shadow-[-8px_0_12px_-8px_rgba(0,0,0,0.08)] md:static md:z-auto md:border-l-0 md:bg-transparent md:shadow-none text-right";

const actionsCellClass =
  "max-md:sticky max-md:right-0 max-md:z-10 max-md:border-l max-md:border-border max-md:bg-card max-md:shadow-[-8px_0_12px_-8px_rgba(0,0,0,0.08)] max-md:group-hover:bg-muted/50 md:static md:z-auto md:border-l-0 md:shadow-none md:group-hover:bg-transparent";

export function ShipmentTable({ rows, perPage, loading }: ShipmentTableProps) {
  const t = useTranslations("AdminShipments");
  const tc = useTranslations("AdminCommon");
  const shipmentStatusLabel = useShipmentStatusLabel();

  const preparedRows = useMemo(
    () =>
      rows.map((shipment) => {
        const st = String(shipment.status ?? "");
        const fsdStatus = resolveFsdShipmentStatus(st, shipment.fsd_status);
        const company = (shipment.company ?? shipment.Company) as { name?: string } | undefined;
        const origin = (shipment.origin_location ?? shipment.originLocation) as { name?: string } | undefined;
        const dest = (shipment.destination_location ?? shipment.destinationLocation) as
          | { name?: string }
          | undefined;
        const svc = (shipment.service_type ?? shipment.serviceType) as { name?: string } | undefined;
        const cnNum = String(shipment.waybill_number ?? "");
        const shpNum = String(shipment.display_number ?? shipment.shipment_number ?? "");
        const bookingNo = String(shipment.booking?.booking_number ?? "");
        const route = [origin?.name, dest?.name].filter(Boolean).join(" → ") || "—";

        return {
          shipment,
          st,
          fsdStatus,
          company,
          svc,
          cnNum,
          shpNum,
          bookingNo,
          route,
        };
      }),
    [rows]
  );

  if (loading) {
    return (
      <div className="space-y-3 p-4">
        {[...Array(perPage)].map((_, i) => (
          <div key={i} className="flex items-center space-x-4">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[300px]" />
              <Skeleton className="h-4 w-[250px]" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-zinc-50/50">
          <TableHead className="w-[120px] pl-4">{t("columns.shipmentNo")}</TableHead>
          <TableHead className="w-[140px]">{t("columns.cnNumber")}</TableHead>
          <TableHead className="w-[120px]">{t("columns.bookingNo")}</TableHead>
          <TableHead>{tc("table.customer")}</TableHead>
          <TableHead>{t("table.route")}</TableHead>
          <TableHead>{t("table.service")}</TableHead>
          <TableHead>{tc("table.status")}</TableHead>
          <TableHead className={cn(actionsHeadClass, "pr-4")}>{tc("actions.actions")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {preparedRows.map(({ shipment, st, fsdStatus, company, svc, cnNum, shpNum, bookingNo, route }) => {
          return (
            <TableRow key={String(shipment.id ?? cnNum ?? shpNum)} className="group">
              <TableCell className="font-mono text-xs pl-4">{shpNum || "—"}</TableCell>
              <TableCell className="font-mono text-xs font-medium text-zinc-900">{cnNum || "—"}</TableCell>
              <TableCell className="font-mono text-xs">{bookingNo || "—"}</TableCell>
              <TableCell className="font-medium">{company?.name ?? "—"}</TableCell>
              <TableCell className="text-xs">{route}</TableCell>
              <TableCell>{svc?.name ?? "—"}</TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={cn("font-normal", fsdShipmentStatusBadgeClass(st, fsdStatus))}
                >
                  {shipmentStatusLabel(fsdStatus)}
                </Badge>
              </TableCell>
              <TableCell className={cn(actionsCellClass, "p-2 text-right pr-4")}>
                <Link
                  href={`/dashboard/admin/customer/shipments/${shipment.id}`}
                  className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "h-8 gap-1.5 px-2")}
                >
                  <Eye className="h-4 w-4" />
                  {t("table.detail")}
                </Link>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
      {preparedRows.length === 0 ? (
        <TableCaption className="text-xs py-10">{t("table.empty")}</TableCaption>
      ) : (
        <TableCaption className="text-[10px] text-muted-foreground uppercase tracking-widest pb-4">
          {t("table.updatedCaption")}
        </TableCaption>
      )}
    </Table>
  );
}
