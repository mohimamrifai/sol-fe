"use client";

import { useRouter } from "@/i18n/routing";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ArrowRightLeft,
  CheckCircle2,
  FilePenLine,
  Eye,
  MoreHorizontal,
  XCircle,
} from "lucide-react";
import { approveBooking, convertBookingToShipment } from "@/lib/admin-api";
import { ApiError } from "@/lib/api-client";
import { toast } from "sonner";

interface BookingActionsMenuProps {
  booking: {
    id: number;
    status: string;
    shipment_exists?: boolean;
    shipment_id?: number | null;
  };
  canProcessOperations: boolean;
  onOpenDetail: (id: number) => void;
  onOpenEdit: (id: number) => void;
  onOpenReject: (id: number) => void;
  onDone: () => void;
}

export function BookingActionsMenu({
  booking,
  canProcessOperations,
  onOpenDetail,
  onOpenEdit,
  onOpenReject,
  onDone,
}: BookingActionsMenuProps) {
  const router = useRouter();
  const st = booking.status.toLowerCase();
  const editDisabled = st === "cancelled" || st === "rejected" || booking.shipment_exists === true || typeof booking.shipment_id === "number";
  const editLabel =
    st === "cancelled"
      ? "Edit booking (tidak tersedia: dibatalkan)"
      : st === "rejected"
        ? "Edit booking (tidak tersedia: ditolak)"
        : booking.shipment_exists === true || typeof booking.shipment_id === "number"
          ? "Edit booking (tidak tersedia: sudah ada shipment)"
          : "Edit booking";
  const showApproveReject =
    canProcessOperations && (st === "submitted" || st === "confirmed");
  const showConvert = canProcessOperations && st === "approved";
  const showOpsDivider = showApproveReject || showConvert;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), "shrink-0")}
      >
        <MoreHorizontal className="h-4 w-4" />
        <span className="sr-only">Menu aksi</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-52">
        <DropdownMenuItem className="cursor-pointer" onClick={() => onOpenDetail(booking.id)}>
          <Eye className="h-4 w-4" />
          Lihat detail
        </DropdownMenuItem>
        {canProcessOperations ? (
          <DropdownMenuItem
            className={cn("cursor-pointer", editDisabled && "cursor-not-allowed opacity-50")}
            disabled={editDisabled}
            onClick={() => {
              if (editDisabled) return;
              onOpenEdit(booking.id);
            }}
          >
            <FilePenLine className="h-4 w-4" />
            {editLabel}
          </DropdownMenuItem>
        ) : null}
        {showOpsDivider ? <DropdownMenuSeparator /> : null}
        {showApproveReject ? (
          <>
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={async () => {
                try {
                  await approveBooking(booking.id);
                  onDone();
                  toast.success("Booking disetujui.");
                } catch (e) {
                  toast.error(e instanceof ApiError ? e.message : "Gagal");
                }
              }}
            >
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              Setujui booking
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer"
              variant="destructive"
              onClick={() => onOpenReject(booking.id)}
            >
              <XCircle className="h-4 w-4" />
              Tolak booking
            </DropdownMenuItem>
          </>
        ) : null}
        {showConvert ? (
          <DropdownMenuItem
            className="cursor-pointer"
            onClick={async () => {
              try {
                const res = await convertBookingToShipment(booking.id);
                const payload = res as { data?: { id?: number } };
                const sid = payload?.data?.id;
                if (typeof sid === "number") {
                  router.push(`/dashboard/admin/shipments/${sid}`);
                }
                onDone();
              } catch (e) {
                toast.error(e instanceof ApiError ? e.message : "Gagal");
              }
            }}
          >
            <ArrowRightLeft className="h-4 w-4" />
            Konversi ke shipment
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
