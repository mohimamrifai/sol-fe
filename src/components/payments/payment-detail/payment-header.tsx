"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { ArrowLeft, Download, RefreshCw, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "@/i18n/routing";
import { downloadCustomerPaymentReceipt } from "@/lib/customer-api";
import { downloadBlob } from "@/lib/download-blob";
import { formatIdr } from "@/lib/format";
import {
  paymentStatusBadgeClass,
  paymentStatusLabelFromApi,
} from "@/lib/payment-status";
import { paymentMethodKey } from "@/lib/payment-utils";
import { ensureMidtransSnapLoaded, openMidtransSnap } from "@/lib/midtrans-client";
import { ApiError } from "@/lib/api-client";
import { usePayInvoice } from "@/hooks/use-pay-invoice";
import type { PaymentDetail } from "@/lib/payment-types";

interface Props {
  payment: PaymentDetail;
  onSynced?: () => void;
  onPaid?: () => void;
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

export function PaymentHeader({ payment, onSynced, onPaid }: Props) {
  const t = useTranslations("Payments.detail.header");
  const tStatus = useTranslations("Payments.status");
  const tMethod = useTranslations("Payments.paymentMethod");
  const router = useRouter();
  const [downloading, setDownloading] = React.useState(false);
  const [paying, setPaying] = React.useState(false);
  const payMutation = usePayInvoice();

  async function onDownloadReceipt() {
    setDownloading(true);
    try {
      const blob = await downloadCustomerPaymentReceipt(payment.id, "download");
      const filename = `payment-receipt-${payment.payment_no || payment.id}.pdf`;
      downloadBlob(blob, filename);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Gagal mengunduh receipt.");
    } finally {
      setDownloading(false);
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
        onSuccess: () => onPaid?.(),
        onPending: () => onPaid?.(),
      });
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Gagal membuka pembayaran.");
    } finally {
      setPaying(false);
    }
  }

  const canPay = payment.actions?.can_pay_now;
  const showSync = payment.payment_method === "midtrans" && payment.status === "pending";
  const methodKey = paymentMethodKey(payment.payment_method);
  const methodLabel = methodKey ? tMethod(methodKey) : (payment.payment_method || "—");
  const rawStatus = String(payment.status);
  const badgeKey = rawStatus;

  return (
    <div className="space-y-4 rounded-xl border border-zinc-200/80 bg-white p-5 shadow-[0_1px_2px_0_rgb(0_0_0/0.04)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard/payments")}
            className="h-7 -ml-2 gap-1 px-2 text-xs text-zinc-600"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {t("backToList")}
          </Button>

          <div className="flex items-center gap-2">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-900 text-white">
              <Wallet className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
                {t("title")}
              </h1>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-zinc-500">
                <span className="font-mono text-xs text-zinc-900 tabular-nums">{payment.payment_no}</span>
                <span className="text-zinc-300">·</span>
                <button
                  type="button"
                  onClick={() => router.push(`/dashboard/invoices/${payment.invoice.id}`)}
                  className="font-mono text-xs text-blue-600 hover:underline"
                >
                  {payment.invoice.invoice_number}
                </button>
                <span className="text-zinc-300">·</span>
                <Badge variant="outline" className={paymentStatusBadgeClass(rawStatus)}>
                  {tStatus.has(badgeKey as never) ? tStatus(badgeKey as never) : paymentStatusLabelFromApi(rawStatus)}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {showSync ? (
            <Button variant="outline" size="sm" onClick={onSynced} className="h-9 gap-2">
              <RefreshCw className="h-4 w-4" />
              {t("syncMidtrans")}
            </Button>
          ) : null}
          {payment.status === "success" || payment.status === "settlement" ? (
            <Button
              variant="outline"
              size="sm"
              onClick={onDownloadReceipt}
              disabled={downloading}
              className="h-9 gap-2"
            >
              <Download className="h-4 w-4" />
              {t("downloadReceipt")}
            </Button>
          ) : null}
          {canPay ? (
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
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 border-t border-zinc-200 pt-4 md:grid-cols-3 lg:grid-cols-6">
        <Field label={t("paymentNo")} value={payment.payment_no} />
        <Field label={t("invoiceNo")} value={payment.invoice.invoice_number} />
        <Field label={t("paymentStatus")} value={tStatus.has(badgeKey as never) ? tStatus(badgeKey as never) : paymentStatusLabelFromApi(rawStatus)} />
        <Field label={t("createdDate")} value={formatDate(payment.created_date)} />
        <Field label={t("method")} value={methodLabel} />
        <Field label={t("amount")} value={`Rp ${formatIdr(payment.amount)}`} />
      </div>
    </div>
  );
}
