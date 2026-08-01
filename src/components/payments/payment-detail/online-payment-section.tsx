"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { CheckCircle2, Copy, RefreshCw, Wallet, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSyncMidtransPayment } from "@/hooks/use-sync-midtrans-payment";
import { usePayInvoice } from "@/hooks/use-pay-invoice";
import { ensureMidtransSnapLoaded, openMidtransSnap } from "@/lib/midtrans-client";
import { ApiError } from "@/lib/api-client";
import type { PaymentDetail } from "@/lib/payment-types";

interface Props {
  payment: PaymentDetail;
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("id-ID", { year: "numeric", month: "short", day: "2-digit" });
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">{label}</div>
      <div className="text-sm text-zinc-900 tabular-nums">{value}</div>
    </div>
  );
}

export function OnlinePaymentSection({ payment }: Props) {
  const t = useTranslations("Payments.detail.section3");
  const tActions = useTranslations("Payments.actions");
  const syncMutation = useSyncMidtransPayment();
  const payMutation = usePayInvoice();
  const [paying, setPaying] = React.useState(false);
  const info = payment.online_payment;

  async function onSync() {
    try {
      await syncMutation.mutateAsync(payment.id);
      toast.success(tActions("syncSuccess"));
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : tActions("syncError"));
    }
  }

  async function onCopy() {
    if (!info.link) return;
    try {
      await navigator.clipboard.writeText(info.link);
      toast.success(t("copied"));
    } catch {
      toast.error("Gagal menyalin link.");
    }
  }

  async function onPayNow() {
    setPaying(true);
    try {
      await ensureMidtransSnapLoaded();
      const res = await payMutation.mutateAsync(payment.invoice.id);
      const token = res.data?.token;
      if (!token) {
        toast.error("Token pembayaran tidak tersedia.");
        return;
      }
      openMidtransSnap(token, {
        onSuccess: () => onSync(),
        onPending: () => onSync(),
      });
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Gagal membuka pembayaran.");
    } finally {
      setPaying(false);
    }
  }

  const canPayNow = payment.actions?.can_pay_now && (info.active || !info.link);

  if (payment.invoice.outstanding_amount <= 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-semibold tracking-tight">
          {t("title")}
          {info.active ? (
            <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
              <CheckCircle2 className="mr-1 h-3 w-3" />
              {t("active")}
            </Badge>
          ) : (
            <Badge variant="outline" className="border-stone-200 bg-stone-50 text-stone-700">
              <XCircle className="mr-1 h-3 w-3" />
              {t("inactive")}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Field label={t("paymentGateway")} value={info.payment_gateway} />
          <Field label={t("transactionId")} value={info.transaction_id ?? "—"} />
          <Field label={t("paymentStatus")} value={info.payment_status} />
          <Field label={t("expiredAt")} value={formatDate(info.expired_at)} />
          <div className="space-y-1 md:col-span-2">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Payment Link</div>
            {info.link ? (
              <p className="break-all font-mono text-xs text-zinc-700">{info.link}</p>
            ) : (
              <p className="text-sm text-zinc-500">{t("noLink")}</p>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {canPayNow ? (
            <Button
              variant="default"
              size="sm"
              onClick={() => void onPayNow()}
              disabled={paying || payMutation.isPending}
              className="h-9 gap-2"
            >
              <Wallet className="h-4 w-4" />
              {t("payNow")}
            </Button>
          ) : null}
          {info.link ? (
            <Button
              variant="outline"
              size="sm"
              onClick={onCopy}
              className="h-9 gap-2"
            >
              <Copy className="h-4 w-4" />
              {t("copyLink")}
            </Button>
          ) : null}
          <Button
            variant="ghost"
            size="sm"
            onClick={onSync}
            disabled={syncMutation.isPending || !payment.midtrans_order_id}
            className="h-9 gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            {t("refreshStatus")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
