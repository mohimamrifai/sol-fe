"use client";

import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { invoiceStatusBadgeClass, invoiceStatusLabelFromApi } from "@/lib/invoice-status";
import { paymentStatusBadgeClass, paymentStatusLabelFromApi } from "@/lib/payment-status";
import { cn } from "@/lib/utils";

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
          <p className="text-xs text-muted-foreground">Order ID Midtrans</p>
        </div>
        {st ? (
          <Badge variant="outline" className={paymentStatusBadgeClass(st)}>
            {paymentStatusLabelFromApi(st)}
          </Badge>
        ) : null}
      </div>

      <Separator />

      <div className="space-y-3">
        {rowDt("Transaction ID", <span className="font-mono text-xs break-all">{txnId}</span>)}
        {rowDt("Metode / tipe", payType)}
        {rowDt("Jumlah", <span className="font-medium tabular-nums">{fmtIdr(amount)}</span>)}
        {rowDt("Waktu bayar", fmtDateTime(data.paid_at))}
        {rowDt("Dicatat", fmtDateTime(data.created_at))}
      </div>

      {inv != null ? (
        <>
          <Separator />
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Invoice terkait</p>
            <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
              {rowDt("Nomor invoice", <span className="font-mono text-xs">{invNo}</span>)}
              {rowDt("Customer", company?.name ?? "—")}
              {rowDt("Shipment / waybill", <span className="font-mono text-xs">{waybill}</span>)}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <span className="text-xs text-muted-foreground">Total invoice</span>
                <span className="text-sm font-medium tabular-nums">{fmtIdr(invTotal)}</span>
              </div>
              {invSt ? (
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-xs text-muted-foreground">Status invoice</span>
                  <Badge variant="outline" className={cn("text-xs", invoiceStatusBadgeClass(invSt))}>
                    {invoiceStatusLabelFromApi(invSt)}
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
                Payload respons Midtrans (teknis)
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
