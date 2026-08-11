"use client";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/routing";
import { shipmentStatusBadgeClass } from "@/lib/shipment-status";
import { useShipmentStatusLabel } from "@/hooks/use-shipment-status-label";
import { cn } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";

interface ShipmentHeaderProps {
  cnNumber: string;
  status: string;
}

export function ShipmentHeader({ cnNumber, status }: ShipmentHeaderProps) {
  const shipmentStatusLabel = useShipmentStatusLabel();

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Link
        href="/dashboard/admin/customer/shipments"
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-1")}
      >
        <ArrowLeft className="h-4 w-4" />
        Daftar shipment
      </Link>
      <h1 className="text-xl font-semibold tracking-tight">
        CN: {cnNumber}
      </h1>
      <Badge variant="outline" className={cn(shipmentStatusBadgeClass(status))}>
        {shipmentStatusLabel(status)}
      </Badge>
    </div>
  );
}
