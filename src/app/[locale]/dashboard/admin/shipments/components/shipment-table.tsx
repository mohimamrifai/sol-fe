"use client";

import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { shipmentStatusBadgeClass, shipmentStatusLabel } from "@/lib/shipment-status";
import { cn } from "@/lib/utils";
import { Eye, MoreHorizontal } from "lucide-react";
import { useRouter } from "@/i18n/routing";
import { rowNumber } from "@/lib/list-query";
import { Skeleton } from "@/components/ui/skeleton";

interface ShipmentTableProps {
  rows: Array<{
    id?: number | string;
    status?: string;
    waybill_number?: string;
    shipment_number?: string;
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
  "w-12 max-md:sticky max-md:right-0 max-md:z-20 max-md:border-l max-md:border-border max-md:bg-card max-md:shadow-[-8px_0_12px_-8px_rgba(0,0,0,0.08)] md:static md:z-auto md:border-l-0 md:bg-transparent md:shadow-none text-right";

const actionsCellClass =
  "max-md:sticky max-md:right-0 max-md:z-10 max-md:border-l max-md:border-border max-md:bg-card max-md:shadow-[-8px_0_12px_-8px_rgba(0,0,0,0.08)] max-md:group-hover:bg-muted/50 md:static md:z-auto md:border-l-0 md:shadow-none md:group-hover:bg-transparent";

function ShipmentActionsMenu({ shipmentId, cnNumber }: { shipmentId: number; cnNumber: string }) {
  const router = useRouter();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), "shrink-0")}
      >
        <MoreHorizontal className="h-4 w-4" />
        <span className="sr-only">Menu aksi CN {cnNumber}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-52">
        <DropdownMenuItem
          className="cursor-pointer"
          onClick={() => router.push(`/dashboard/admin/shipments/${shipmentId}`)}
        >
          <Eye className="h-4 w-4" />
          Lihat detail shipment
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function ShipmentTable({ rows, meta, perPage, loading }: ShipmentTableProps) {
  const preparedRows = useMemo(
    () =>
      rows.map((shipment) => {
        const st = String(shipment.status ?? "");
        const company = (shipment.company ?? shipment.Company) as { name?: string } | undefined;
        const origin = (shipment.origin_location ?? shipment.originLocation) as { name?: string } | undefined;
        const dest = (shipment.destination_location ?? shipment.destinationLocation) as
          | { name?: string }
          | undefined;
        const svc = (shipment.service_type ?? shipment.serviceType) as { name?: string } | undefined;
        const cnNum = String(shipment.waybill_number ?? shipment.shipment_number ?? "");
        const route = [origin?.name, dest?.name].filter(Boolean).join(" → ") || "—";

        return {
          shipment,
          st,
          company,
          svc,
          cnNum,
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
          <TableHead className="w-14 pl-4">No</TableHead>
          <TableHead className="w-[180px]">CN Number</TableHead>
          <TableHead>Customer</TableHead>
          <TableHead>Service</TableHead>
          <TableHead>Rute</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className={actionsHeadClass}>
            <span className="max-md:sr-only">Aksi</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {preparedRows.map(({ shipment, st, company, svc, cnNum, route }, index) => {
          return (
            <TableRow key={cnNum || String(shipment.id)} className="group">
              <TableCell className="tabular-nums text-muted-foreground pl-4">
                {rowNumber(meta?.current_page ?? 1, perPage, index)}
              </TableCell>
              <TableCell className="font-mono text-xs font-bold text-zinc-900">{cnNum}</TableCell>
              <TableCell className="font-medium">{company?.name ?? "—"}</TableCell>
              <TableCell>{svc?.name ?? "—"}</TableCell>
              <TableCell className="text-xs">{route}</TableCell>
              <TableCell>
                <Badge variant="outline" className={cn("font-normal", shipmentStatusBadgeClass(st))}>
                  {shipmentStatusLabel(st)}
                </Badge>
              </TableCell>
              <TableCell className={cn(actionsCellClass, "p-2 text-right pr-4")}>
                <div className="flex justify-end">
                  <ShipmentActionsMenu
                    shipmentId={Number(shipment.id)}
                    cnNumber={cnNum}
                  />
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
      {preparedRows.length === 0 ? (
        <TableCaption className="text-xs py-10">Belum ada shipment ditemukan.</TableCaption>
      ) : (
        <TableCaption className="text-[10px] text-muted-foreground uppercase tracking-widest pb-4">
          Data Shipment Terupdate
        </TableCaption>
      )}
    </Table>
  );
}
