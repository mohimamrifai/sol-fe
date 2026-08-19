"use client";

import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { invoiceStatusBadgeClass } from "@/lib/invoice-status";
import { resolvePaymentMethodLabel } from "@/lib/payment-utils";
import { cn } from "@/lib/utils";
import { useInvoiceStatusLabel, usePaymentStatusLabel } from "@/hooks/use-admin-status-labels";
import { useTranslations } from "next-intl";

type Inv = Record<string, unknown>;

function fmtIdr(v: unknown): string {
  const n = Number(v);
  if (!Number.isFinite(n)) return "—";
  return `Rp ${n.toLocaleString("id-ID")}`;
}

function fmtDate(v: unknown): string {
  if (v == null || v === "") return "—";
  const s = String(v);
  const d = s.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) {
    try {
      return new Date(`${d}T12:00:00`).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return d;
    }
  }
  return s;
}

function rowLabel(label: string, value: ReactNode, className?: string) {
  return (
    <div className={cn("grid gap-0.5 sm:grid-cols-[140px_1fr] sm:gap-3", className)}>
      <dt className="text-xs font-medium text-muted-foreground sm:pt-0.5">{label}</dt>
      <dd className="text-sm text-foreground">{value}</dd>
    </div>
  );
}

export function InvoiceDetailView({ data }: { data: Inv | null }) {
  const t = useTranslations("AdminInvoices");
  const tMethod = useTranslations("Payments.paymentMethod");
  const invoiceStatusLabel = useInvoiceStatusLabel();
  const paymentStatusLabel = usePaymentStatusLabel();

  if (!data) {
    return <p className="text-sm text-muted-foreground">—</p>;
  }

  const num = String(data.invoice_number ?? "—");
  const st = String(data.status ?? "");
  const company = (data.company ?? data.Company) as { name?: string; npwp?: string } | undefined;
  const ship = (data.shipment ?? data.Shipment) as {
    waybill_number?: string;
    shipment_number?: string;
    id?: number;
  } | undefined;
  const waybill = ship?.waybill_number ?? ship?.shipment_number ?? "—";
  const creator = (data.created_by_user ?? data.createdByUser) as { name?: string } | undefined;
  const notes = data.notes != null && String(data.notes).trim() !== "" ? String(data.notes) : null;

  const items = (data.items ?? data.Items) as Inv[] | undefined;
  const itemRows = Array.isArray(items) ? items : [];

  const payments = (data.payments ?? data.Payments) as Inv[] | undefined;
  const payRows = Array.isArray(payments) ? payments : [];
  const paidTotal = payRows.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
  const totalAmount = Number(data.total_amount) || 0;
  const outstanding = Math.max(0, totalAmount - paidTotal);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-lg font-semibold tracking-tight">{num}</p>
          <p className="text-xs text-muted-foreground">{t("detail.invoiceLabel")}</p>
        </div>
        {st ? (
          <Badge variant="outline" className={invoiceStatusBadgeClass(st)}>
            {invoiceStatusLabel(st)}
          </Badge>
        ) : null}
      </div>

      <Separator />

      <div className="space-y-3">
        {rowLabel(t("detail.company"), company?.name ?? "—")}
        {rowLabel(
          t("detail.shipment"),
          <span className="font-mono text-xs">{waybill}</span>
        )}
        {rowLabel(t("detail.issuedDate"), fmtDate(data.issued_date))}
        {rowLabel(t("detail.dueDate"), fmtDate(data.due_date))}
        {creator?.name ? rowLabel(t("detail.createdBy"), creator.name) : null}
      </div>

      <Separator />

      <div className="space-y-2 rounded-lg border bg-muted/30 p-3">
        <p className="text-xs font-medium text-muted-foreground">{t("detail.summary")}</p>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{t("detail.subtotal")}</span>
          <span className="tabular-nums">{fmtIdr(data.subtotal)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{t("detail.tax")}</span>
          <span className="tabular-nums">{fmtIdr(data.tax_amount)}</span>
        </div>
        <div className="flex justify-between border-t pt-2 text-sm font-semibold">
          <span>{t("detail.total")}</span>
          <span className="tabular-nums">{fmtIdr(data.total_amount)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{t("detail.paidAmount")}</span>
          <span className="tabular-nums">{fmtIdr(paidTotal)}</span>
        </div>
        <div className="flex justify-between text-sm font-medium">
          <span className="text-muted-foreground">{t("detail.outstanding")}</span>
          <span className="tabular-nums">{fmtIdr(outstanding)}</span>
        </div>
      </div>

      {notes ? (
        <>
          <Separator />
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">{t("detail.notes")}</p>
            <p className="whitespace-pre-wrap text-sm">{notes}</p>
          </div>
        </>
      ) : null}

      <Separator />

      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">{t("detail.lineItems")}</p>
        {itemRows.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("detail.noItems")}</p>
        ) : (
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("detail.description")}</TableHead>
                  <TableHead className="w-20 text-right">{t("detail.quantity")}</TableHead>
                  <TableHead className="min-w-[100px] text-right">{t("detail.unitPrice")}</TableHead>
                  <TableHead className="min-w-[100px] text-right">{t("detail.amount")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {itemRows.map((it, idx) => {
                  const id = it.id != null ? String(it.id) : `item-${idx}`;
                  return (
                    <TableRow key={id}>
                      <TableCell className="max-w-[240px] text-sm">{String(it.description ?? "—")}</TableCell>
                      <TableCell className="text-right tabular-nums text-sm">{String(it.quantity ?? "—")}</TableCell>
                      <TableCell className="text-right tabular-nums text-sm">{fmtIdr(it.unit_price)}</TableCell>
                      <TableCell className="text-right tabular-nums text-sm font-medium">
                        {fmtIdr(it.total_price)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <Separator />

      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">{t("detail.documents")}</p>
        <ul className="space-y-2 text-sm">
          <li className="flex items-center justify-between rounded-md border px-3 py-2">
            <span>{t("detail.invoicePdf")}</span>
            <span className="text-xs text-muted-foreground">{num !== "—" ? t("detail.available") : "—"}</span>
          </li>
          <li className="flex items-center justify-between rounded-md border px-3 py-2">
            <span>{t("detail.taxInvoice")}</span>
            <span className="text-xs text-muted-foreground">{st === "paid" ? t("detail.available") : t("detail.uploadWhenPaid")}</span>
          </li>
        </ul>
      </div>

      {payRows.length > 0 ? (
        <>
          <Separator />
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">{t("detail.payments")}</p>
            <ul className="space-y-2">
              {payRows.map((p, idx) => {
                const pid =
                  p.id != null
                    ? String(p.id)
                    : p.midtrans_order_id != null
                      ? String(p.midtrans_order_id)
                      : `pay-${idx}`;
                const paidAt = p.paid_at ? fmtDate(p.paid_at) : "—";
                const paySt = String(p.status ?? "");
                const methodLabel = resolvePaymentMethodLabel(
                  {
                    method: p.method as string | null | undefined,
                    payment_method: p.payment_method as string | null | undefined,
                    payment_type: p.payment_type as string | null | undefined,
                  },
                  (key) => tMethod(key)
                );
                return (
                  <li
                    key={pid}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-card px-3 py-2 text-sm"
                  >
                    <span className="text-muted-foreground">{methodLabel}</span>
                    <span className="font-medium tabular-nums">{fmtIdr(p.amount)}</span>
                    <span className="w-full text-xs text-muted-foreground sm:w-auto sm:text-right">
                      {paidAt} · {paySt ? paymentStatusLabel(paySt) : "—"}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </>
      ) : null}
    </div>
  );
}
