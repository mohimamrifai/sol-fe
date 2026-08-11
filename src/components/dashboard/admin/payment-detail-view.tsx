"use client";

import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { invoiceStatusBadgeClass } from "@/lib/invoice-status";
import { paymentStatusBadgeClass } from "@/lib/payment-status";
import { cn } from "@/lib/utils";
import { useInvoiceStatusLabel, usePaymentStatusLabel } from "@/hooks/use-admin-status-labels";
import { useTranslations } from "next-intl";

type Row = Record<string, unknown>;

function fmtIdr(v: unknown): string {
  const n = Number(v);
  if (!Number.isFinite(n)) return "—";
  return `Rp ${n.toLocaleString("id-ID")}`;
}

function fmtDateTime(v: unknown): string {
  if (v == null || v === "") return "—";
  const s = String(v);
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function rowDt(label: string, value: ReactNode) {
  return (
    <div className="grid gap-0.5 sm:grid-cols-[140px_1fr] sm:gap-3">
      <dt className="text-xs font-medium text-muted-foreground sm:pt-0.5">{label}</dt>
      <dd className="text-sm text-foreground">{value}</dd>
    </div>
  );
}

export function PaymentDetailView({ data }: { data: Row | null }) {
  const t = useTranslations("AdminPayments");
  const tc = useTranslations("AdminCommon");
  const paymentStatusLabel = usePaymentStatusLabel();
  const invoiceStatusLabel = useInvoiceStatusLabel();

  if (!data) {
    return <p className="text-sm text-muted-foreground">—</p>;
  }

  const orderId = String(data.midtrans_order_id ?? "—");
  const txnId = String(data.midtrans_transaction_id ?? "—");
  const st = String(data.status ?? "");
  const payType = String(data.payment_type ?? "—");
  const amount = data.amount;

  const inv = (data.invoice ?? data.Invoice) as Row | undefined;
  const company = (inv?.company ?? inv?.Company) as { name?: string } | undefined;
  const ship = (inv?.shipment ?? inv?.Shipment) as {
    waybill_number?: string;
    shipment_number?: string;
  } | undefined;
  const waybill = ship?.waybill_number ?? ship?.shipment_number ?? "—";
  const invNo = inv != null ? String(inv.invoice_number ?? "—") : "—";
  const invSt = inv != null ? String(inv.status ?? "") : "";
  const invTotal = inv?.total_amount;

  const rawMidtrans = data.midtrans_response;
  let midtransJson = "";
  if (rawMidtrans != null) {
    try {
      midtransJson =
        typeof rawMidtrans === "string"
          ? rawMidtrans
          : JSON.stringify(rawMidtrans, null, 2);
    } catch {
      midtransJson = String(rawMidtrans);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-sm font-semibold tracking-tight">{orderId}</p>
          <p className="text-xs text-muted-foreground">{t("detail.orderIdLabel")}</p>
        </div>
        {st ? (
          <Badge variant="outline" className={paymentStatusBadgeClass(st)}>
            {paymentStatusLabel(st)}
          </Badge>
        ) : null}
      </div>

      <Separator />

      <div className="space-y-3">
        {rowDt(t("detail.transactionId"), <span className="font-mono text-xs break-all">{txnId}</span>)}
        {rowDt(t("detail.method"), payType)}
        {rowDt(t("detail.amount"), <span className="font-medium tabular-nums">{fmtIdr(amount)}</span>)}
        {rowDt(t("detail.paidAt"), fmtDateTime(data.paid_at))}
        {rowDt(t("detail.recordedAt"), fmtDateTime(data.created_at))}
      </div>

      {inv != null ? (
        <>
          <Separator />
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">{t("detail.relatedInvoice")}</p>
            <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
              {rowDt(t("detail.invoiceNo"), <span className="font-mono text-xs">{invNo}</span>)}
              {rowDt(tc("table.customer"), company?.name ?? "—")}
              {rowDt(t("detail.shipment"), <span className="font-mono text-xs">{waybill}</span>)}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <span className="text-xs text-muted-foreground">{t("detail.invoiceTotal")}</span>
                <span className="text-sm font-medium tabular-nums">{fmtIdr(invTotal)}</span>
              </div>
              {invSt ? (
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-xs text-muted-foreground">{t("detail.invoiceStatus")}</span>
                  <Badge variant="outline" className={cn("text-xs", invoiceStatusBadgeClass(invSt))}>
                    {invoiceStatusLabel(invSt)}
                  </Badge>
                </div>
              ) : null}
            </div>
          </div>
        </>
      ) : null}

      {midtransJson ? (
        <>
          <Separator />
          <details className="group rounded-md border bg-muted/20">
            <summary className="cursor-pointer list-none px-3 py-2 text-xs font-medium text-muted-foreground marker:hidden [&::-webkit-details-marker]:hidden">
              <span className="underline-offset-2 group-open:underline">
                {t("detail.midtransPayload")}
              </span>
            </summary>
            <pre className="max-h-48 overflow-auto border-t bg-muted/40 p-3 text-[11px] leading-relaxed">
              {midtransJson}
            </pre>
          </details>
        </>
      ) : null}
    </div>
  );
}
