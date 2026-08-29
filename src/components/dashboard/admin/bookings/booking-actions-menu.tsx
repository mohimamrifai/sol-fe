"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
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
  Eye,
  Loader2,
  MoreHorizontal,
  Send,
  Trash2,
  XCircle,
} from "lucide-react";
import {
  confirmAdminBooking,
  convertBookingToShipment,
  deleteAdminBooking,
  submitAdminBooking,
} from "@/lib/admin-api";
import { ApiError } from "@/lib/api-client";
import { resolveBookingDisplayStatus } from "@/lib/booking-status";
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
  onOpenReject: (id: number) => void;
  onDone: () => void;
}

export function BookingActionsMenu({
  booking,
  canProcessOperations,
  onOpenDetail,
  onOpenReject,
  onDone,
}: BookingActionsMenuProps) {
  const t = useTranslations("AdminBookings");
  const tc = useTranslations("AdminCommon");
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const st = booking.status.toLowerCase();
  const displayStatus = resolveBookingDisplayStatus(booking);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    try {
      await fn();
    } finally {
      setBusy(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), "shrink-0")}
        disabled={busy}
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-4 w-4" />}
        <span className="sr-only">{tc("actions.actionsMenu")}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-52">
        <DropdownMenuItem className="cursor-pointer" onClick={() => onOpenDetail(booking.id)}>
          <Eye className="h-4 w-4" />
          {t("actions.detail")}
        </DropdownMenuItem>

        {canProcessOperations && st === "draft" ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() =>
                void run(async () => {
                  try {
                    await submitAdminBooking(booking.id);
                    onDone();
                    toast.success(t("toasts.submitted"));
                  } catch (e) {
                    toast.error(e instanceof ApiError ? e.message : t("toasts.submitFailed"));
                  }
                })
              }
            >
              <Send className="h-4 w-4" />
              {t("actions.submit")}
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer text-destructive focus:text-destructive"
              onClick={() =>
                void run(async () => {
                  if (!confirm(t("confirm.deleteDraft"))) return;
                  try {
                    await deleteAdminBooking(booking.id);
                    onDone();
                    toast.success(t("toasts.deleted"));
                  } catch (e) {
                    toast.error(e instanceof ApiError ? e.message : t("toasts.deleteFailed"));
                  }
                })
              }
            >
              <Trash2 className="h-4 w-4" />
              {t("actions.delete")}
            </DropdownMenuItem>
          </>
        ) : null}

        {canProcessOperations && st === "submitted" ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() =>
                void run(async () => {
                  try {
                    await confirmAdminBooking(booking.id);
                    onDone();
                    toast.success(t("toasts.confirmed"));
                  } catch (e) {
                    toast.error(e instanceof ApiError ? e.message : t("toasts.confirmFailed"));
                  }
                })
              }
            >
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              {t("actions.confirm")}
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer" variant="destructive" onClick={() => onOpenReject(booking.id)}>
              <XCircle className="h-4 w-4" />
              {t("actions.reject")}
            </DropdownMenuItem>
          </>
        ) : null}

        {canProcessOperations && (displayStatus === "approved" || displayStatus === "confirmed") ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() =>
                void run(async () => {
                  try {
                    const res = await convertBookingToShipment(booking.id);
                    const payload = res as { data?: { id?: number } };
                    const sid = payload?.data?.id;
                    onDone();
                    toast.success(t("toasts.converted"));
                    if (typeof sid === "number") {
                      router.push(`/dashboard/admin/customer/shipments/${sid}`);
                    }
                  } catch (e) {
                    toast.error(e instanceof ApiError ? e.message : t("toasts.convertFailed"));
                  }
                })
              }
            >
              <ArrowRightLeft className="h-4 w-4" />
              {t("actions.convert")}
            </DropdownMenuItem>
          </>
        ) : null}

        {displayStatus === "converted" ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => {
                if (typeof booking.shipment_id === "number") {
                  router.push(`/dashboard/admin/customer/shipments/${booking.shipment_id}`);
                }
              }}
              disabled={typeof booking.shipment_id !== "number"}
            >
              <Eye className="h-4 w-4" />
              {t("actions.viewShipment")}
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
