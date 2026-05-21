"use client";

import { useEffect, useRef, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { buttonVariants } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Eye, Loader2, MoreHorizontal, RefreshCw, CreditCard } from "lucide-react";
import { toast } from "sonner";
import {
  fetchAdminPayment,
  syncAdminPaymentMidtrans,
  verifyAdminPaymentManual,
} from "@/lib/admin-api";
import { ApiError } from "@/lib/api-client";
import { PaymentDetailView } from "@/components/dashboard/admin/payment-detail-view";
import { PayRow } from "./types";

interface PaymentActionsMenuProps {
  payment: PayRow;
  paymentRef: string;
  canManageAR: boolean;
  onPaymentsChanged: () => void;
}

export function PaymentActionsMenu({
  payment,
  paymentRef,
  canManageAR,
  onPaymentsChanged,
}: PaymentActionsMenuProps) {
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailData, setDetailData] = useState<PayRow | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const paymentRowRef = useRef(payment);
  paymentRowRef.current = payment;
  const detailOpenRef = useRef(detailOpen);
  detailOpenRef.current = detailOpen;

  const [syncLoading, setSyncLoading] = useState(false);
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [verifyNote, setVerifyNote] = useState("");
  const [verifyLoading, setVerifyLoading] = useState(false);

  const paymentId = Number(payment.id);
  const orderIdRaw = String(payment.midtrans_order_id ?? "").trim();
  const canSyncMidtrans = orderIdRaw.length > 0;
  const payStatus = String(payment.status ?? "").toLowerCase();
  const canManualVerify = payStatus !== "success";

  useEffect(() => {
    if (!detailOpen) {
      setDetailData(null);
      setDetailError(null);
      return;
    }
    if (!Number.isFinite(paymentId)) {
      setDetailError("ID pembayaran tidak valid.");
      setDetailData(null);
      return;
    }
    setDetailLoading(true);
    setDetailError(null);
    void (async () => {
      try {
        const res = await fetchAdminPayment(paymentId);
        setDetailData((res as { data: PayRow }).data ?? null);
      } catch (e) {
        setDetailError(e instanceof ApiError ? e.message : "Gagal memuat detail.");
        setDetailData(paymentRowRef.current);
      } finally {
        setDetailLoading(false);
      }
    })();
  }, [detailOpen, paymentId]);

  async function refetchDetailIfOpen(opts?: { showLoading?: boolean }) {
    if (!detailOpenRef.current || !Number.isFinite(paymentId)) return;
    const showLoading = opts?.showLoading === true;
    if (showLoading) setDetailLoading(true);
    try {
      const res = await fetchAdminPayment(paymentId);
      setDetailData((res as { data: PayRow }).data ?? null);
    } catch {
      /* biarkan tampilan lama */
    } finally {
      if (showLoading) setDetailLoading(false);
    }
  }

  async function handleSyncMidtrans() {
    if (!Number.isFinite(paymentId)) return;
    const toastId = toast.loading("Menyinkronkan status dari Midtrans…");
    setSyncLoading(true);
    try {
      const res = await syncAdminPaymentMidtrans(paymentId);
      toast.success(res.message, { id: toastId, duration: 4000 });
      onPaymentsChanged();
      await refetchDetailIfOpen({ showLoading: true });
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Gagal menyinkronkan dari Midtrans.", {
        id: toastId,
        duration: 6000,
      });
    } finally {
      setSyncLoading(false);
    }
  }

  async function handleVerifyManual() {
    if (!Number.isFinite(paymentId)) return;
    const toastId = toast.loading("Memverifikasi pembayaran…");
    setVerifyLoading(true);
    try {
      const res = await verifyAdminPaymentManual(paymentId, {
        note: verifyNote.trim() || undefined,
      });
      toast.success(res.message, { id: toastId, duration: 4000 });
      setVerifyOpen(false);
      setVerifyNote("");
      onPaymentsChanged();
      await refetchDetailIfOpen({ showLoading: true });
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Gagal verifikasi manual.", {
        id: toastId,
        duration: 6000,
      });
    } finally {
      setVerifyLoading(false);
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), "shrink-0")}
          disabled={syncLoading || verifyLoading}
          aria-busy={syncLoading || verifyLoading}
          aria-label="Menu aksi pembayaran"
        >
          {syncLoading || verifyLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <MoreHorizontal className="h-4 w-4" aria-hidden />
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-52">
          <DropdownMenuItem className="cursor-pointer" onClick={() => setDetailOpen(true)}>
            <Eye className="h-4 w-4" />
            Lihat detail pembayaran
          </DropdownMenuItem>
          {canManageAR ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer"
                disabled={!canSyncMidtrans || syncLoading || verifyLoading || !Number.isFinite(paymentId)}
                onClick={() => void handleSyncMidtrans()}
              >
                {syncLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  <RefreshCw className="h-4 w-4" aria-hidden />
                )}
                {syncLoading ? "Menyinkronkan…" : "Refresh status Midtrans"}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer"
                disabled={!canManualVerify || verifyLoading}
                onClick={() => {
                  setVerifyNote("");
                  setVerifyOpen(true);
                }}
              >
                <CreditCard className="h-4 w-4" aria-hidden />
                Verifikasi manual
              </DropdownMenuItem>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog
        open={verifyOpen}
        onOpenChange={(open) => {
          if (!open && verifyLoading) return;
          setVerifyOpen(open);
          if (!open) setVerifyNote("");
        }}
      >
        <AlertDialogContent className="max-w-md sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Verifikasi manual pembayaran?</AlertDialogTitle>
            <AlertDialogDescription>
              Invoice terkait akan ditandai lunas. Hanya gunakan jika transfer/kas sudah diverifikasi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid gap-2">
            <label htmlFor={`pay-verify-note-${paymentId}`} className="text-sm font-medium">
              Catatan (opsional)
            </label>
            <Textarea
              id={`pay-verify-note-${paymentId}`}
              rows={3}
              placeholder="Contoh: Transfer masuk ke rek BCA 02/04/2026"
              value={verifyNote}
              onChange={(e) => setVerifyNote(e.target.value)}
              disabled={verifyLoading}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={verifyLoading}>Batal</AlertDialogCancel>
            <AlertDialogAction
              disabled={verifyLoading}
              className="gap-2"
              onClick={(e) => {
                e.preventDefault();
                void handleVerifyManual();
              }}
            >
              {verifyLoading ? (
                <>
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
                  Memproses…
                </>
              ) : (
                "Ya, verifikasi"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detail pembayaran {paymentRef || "—"}</DialogTitle>
            <DialogDescription>Ringkasan pembayaran Midtrans dan invoice terkait.</DialogDescription>
          </DialogHeader>
          {detailLoading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
              Memuat detail…
            </div>
          ) : (
            <>
              {detailError && (
                <p className="rounded-md border border-amber-200/80 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                  {detailError} Menampilkan data dari daftar.
                </p>
              )}
              <PaymentDetailView data={detailData} />
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
