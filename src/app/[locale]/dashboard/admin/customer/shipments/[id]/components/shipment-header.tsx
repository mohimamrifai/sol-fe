"use client";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/routing";
import { fsdShipmentStatusBadgeClass } from "@/lib/shipment-status";
import { useShipmentStatusLabel } from "@/hooks/use-shipment-status-label";
import { cn } from "@/lib/utils";
import { ArrowLeft, Download, FileText } from "lucide-react";
import type { FsdShipmentStatus } from "@/lib/shipment-fsd-status";
import { canPrintConsignmentNote, canGenerateConsignmentNote, isFsdPlanningStatus } from "@/lib/shipment-fsd-status";

interface ShipmentHeaderProps {
  shipmentNo: string;
  cnNumber: string;
  fsdStatus: FsdShipmentStatus;
  bookingNumber?: string;
  bookingId?: number | string;
  customerName?: string;
  createdAt?: string;
  onPrintCn?: () => void;
  onGenerateCn?: () => void;
  generatingCn?: boolean;
  onEditPlanning?: () => void;
  onAssignContainer?: () => void;
  onReadyForDeparture?: () => void;
  onCancelShipment?: () => void;
  canModifyContainer?: boolean;
  printing?: boolean;
}

function formatDateTime(value?: string) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("id-ID", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ShipmentHeader({
  shipmentNo,
  cnNumber,
  fsdStatus,
  bookingNumber,
  bookingId,
  customerName,
  createdAt,
  onPrintCn,
  onGenerateCn,
  onEditPlanning,
  onAssignContainer,
  onReadyForDeparture,
  onCancelShipment,
  canModifyContainer,
  printing,
  generatingCn,
}: ShipmentHeaderProps) {
  const shipmentStatusLabel = useShipmentStatusLabel();
  const isPlanning = isFsdPlanningStatus(fsdStatus);
  const showPrint = canPrintConsignmentNote(fsdStatus);
  const showGenerateCn = canGenerateConsignmentNote(fsdStatus, Boolean(cnNumber && cnNumber !== "—"));
  const showAssign = Boolean(canModifyContainer && onAssignContainer);

  return (
    <div className="space-y-4 rounded-xl border border-zinc-200/80 bg-white p-5 shadow-[0_1px_2px_0_rgb(0_0_0/0.04)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2 min-w-0">
          <Link
            href="/dashboard/admin/customer/shipments"
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-1 -ml-2")}
          >
            <ArrowLeft className="h-4 w-4" />
            Daftar shipment
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight">{shipmentNo}</h1>
            <Badge variant="outline" className={cn(fsdShipmentStatusBadgeClass(fsdStatus, fsdStatus))}>
              {shipmentStatusLabel(fsdStatus)}
            </Badge>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {isPlanning && onEditPlanning ? (
            <Button type="button" size="sm" variant="outline" onClick={onEditPlanning}>
              Edit Planning
            </Button>
          ) : null}
          {showAssign ? (
            <Button type="button" size="sm" variant="secondary" onClick={onAssignContainer}>
              Assign/Change Container
            </Button>
          ) : null}
          {isPlanning && onReadyForDeparture ? (
            <Button type="button" size="sm" onClick={onReadyForDeparture}>
              Ready for Departure
            </Button>
          ) : null}
          {isPlanning && onCancelShipment ? (
            <Button type="button" size="sm" variant="destructive" onClick={onCancelShipment}>
              Cancel Shipment
            </Button>
          ) : null}
          {showGenerateCn && onGenerateCn ? (
            <Button type="button" size="sm" variant="secondary" className="gap-1.5" onClick={onGenerateCn} disabled={generatingCn}>
              <FileText className="h-4 w-4" />
              Generate Consignment Note
            </Button>
          ) : null}
          {showPrint && onPrintCn ? (
            <Button type="button" size="sm" variant="outline" className="gap-1.5" onClick={onPrintCn} disabled={printing}>
              <Download className="h-4 w-4" />
              Print Consignment Note
            </Button>
          ) : null}
        </div>
      </div>

      <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm">
        <div>
          <dt className="text-xs font-medium text-muted-foreground">Consignment Note No</dt>
          <dd className="mt-0.5 font-mono text-sm">{cnNumber || "—"}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-muted-foreground">Booking No</dt>
          <dd className="mt-0.5">
            {bookingId && bookingNumber ? (
              <Link
                href={`/dashboard/admin/customer/bookings/${bookingId}`}
                className="font-medium text-sky-700 hover:text-sky-900 hover:underline"
              >
                {bookingNumber}
              </Link>
            ) : (
              bookingNumber ?? "—"
            )}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-muted-foreground">Customer</dt>
          <dd className="mt-0.5 font-medium">{customerName ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-muted-foreground">Created Date</dt>
          <dd className="mt-0.5">{formatDateTime(createdAt)}</dd>
        </div>
      </dl>
    </div>
  );
}
