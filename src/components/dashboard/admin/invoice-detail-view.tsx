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
import { invoiceStatusBadgeClass, invoiceStatusLabelFromApi } from "@/lib/invoice-status";
import { cn } from "@/lib/utils";

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

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-lg font-semibold tracking-tight">{num}</p>
          <p className="text-xs text-muted-foreground">Invoice</p>
        </div>
        {st ? (
          <Badge variant="outline" className={invoiceStatusBadgeClass(st)}>
            {invoiceStatusLabelFromApi(st)}
          </Badge>
        ) : null}
      </div>

      <Separator />

      <div className="space-y-3">
        {rowLabel("Perusahaan", company?.name ?? "—")}
        {rowLabel(
          "Shipment / waybill",
          <span className="font-mono text-xs">{waybill}</span>
        )}
        {rowLabel("Tanggal terbit", fmtDate(data.issued_date))}
        {rowLabel("Jatuh tempo", fmtDate(data.due_date))}
        {creator?.name ? rowLabel("Dibuat oleh", creator.name) : null}
      </div>

      <Separator />

      <div className="space-y-2 rounded-lg border bg-muted/30 p-3">
        <p className="text-xs font-medium text-muted-foreground">Ringkasan nominal</p>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="tabular-nums">{fmtIdr(data.subtotal)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">PPN</span>
          <span className="tabular-nums">{fmtIdr(data.tax_amount)}</span>
        </div>
        <div className="flex justify-between border-t pt-2 text-sm font-semibold">
          <span>Total</span>
          <span className="tabular-nums">{fmtIdr(data.total_amount)}</span>
        </div>
      </div>

      {notes ? (
        <>
          <Separator />
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Catatan</p>
            <p className="whitespace-pre-wrap text-sm">{notes}</p>
          </div>
        </>
      ) : null}

      <Separator />

      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Item baris</p>
        {itemRows.length === 0 ? (
          <p className="text-sm text-muted-foreground">Tidak ada item.</p>
        ) : (
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Deskripsi</TableHead>
                  <TableHead className="w-20 text-right">Qty</TableHead>
                  <TableHead className="min-w-[100px] text-right">Harga satuan</TableHead>
                  <TableHead className="min-w-[100px] text-right">Jumlah</TableHead>
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

      {payRows.length > 0 ? (
        <>
          <Separator />
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Pembayaran</p>
            <ul className="space-y-2">
              {payRows.map((p, idx) => {
                const pid =
                  p.id != null
                    ? String(p.id)
                    : p.midtrans_order_id != null
                      ? String(p.midtrans_order_id)
                      : `pay-${idx}`;
                const paidAt = p.paid_at ? fmtDate(p.paid_at) : "—";
                return (
                  <li
                    key={pid}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-card px-3 py-2 text-sm"
                  >
                    <span className="text-muted-foreground">
                      {String(p.payment_type ?? p.status ?? "Pembayaran")}
                    </span>
                    <span className="font-medium tabular-nums">{fmtIdr(p.amount)}</span>
                    <span className="w-full text-xs text-muted-foreground sm:w-auto sm:text-right">
                      {paidAt} · {String(p.status ?? "—")}
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
