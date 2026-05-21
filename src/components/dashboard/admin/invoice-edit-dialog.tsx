"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fetchAdminInvoice, updateAdminInvoice } from "@/lib/admin-api";
import { ApiError } from "@/lib/api-client";
import { DIALOG_CREATE_HEADER_CLASS } from "@/lib/dialog-create-header";
import { firstLaravelError } from "@/lib/laravel-errors";
import { toast } from "sonner";

const STATUS_OPTIONS = [
  { value: "unpaid", label: "Belum bayar" },
  { value: "paid", label: "Lunas" },
  { value: "overdue", label: "Jatuh tempo" },
  { value: "cancelled", label: "Dibatalkan" },
];

function fmtIdr(v: unknown): string {
  const n = Number(v);
  if (!Number.isFinite(n)) return "—";
  return `Rp ${n.toLocaleString("id-ID")}`;
}

const readOnlyInputClass = "bg-muted/50 text-foreground cursor-not-allowed";

export function InvoiceEditDialog({
  open,
  onOpenChange,
  invoice,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: Record<string, unknown> | null;
  onSaved: () => void;
}) {
  const [detail, setDetail] = useState<Record<string, unknown> | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !invoice?.id) {
      setDetail(null);
      return;
    }
    let cancelled = false;
    setDetailLoading(true);
    void (async () => {
      try {
        const res = await fetchAdminInvoice(Number(invoice.id));
        if (!cancelled) {
          setDetail((res as { data: Record<string, unknown> }).data ?? null);
        }
      } catch {
        if (!cancelled) setDetail(null);
      } finally {
        if (!cancelled) setDetailLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, invoice?.id]);

  useEffect(() => {
    const src = detail ?? invoice;
    if (!open || !src) return;
    setError(null);
    setDueDate(String(src.due_date ?? "").slice(0, 10));
    setNotes(String(src.notes ?? ""));
    setStatus(String(src.status ?? "unpaid"));
  }, [open, invoice, detail]);

  const display = detail ?? invoice;

  const save = async () => {
    const id = invoice ? Number(invoice.id) : NaN;
    if (!Number.isFinite(id)) return;
    setSaving(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {
        due_date: dueDate,
        notes: notes.trim() || null,
        status,
      };
      await updateAdminInvoice(id, body);
      toast.success("Invoice berhasil diperbarui.");
      onOpenChange(false);
      onSaved();
    } catch (e) {
      const msg = e instanceof ApiError ? firstLaravelError(e.body) ?? e.message : "Gagal menyimpan.";
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const disabled = !dueDate || saving;

  const company = (display?.company ?? display?.Company) as { name?: string } | undefined;
  const ship = (display?.shipment ?? display?.Shipment) as {
    waybill_number?: string;
    shipment_number?: string;
  } | undefined;
  const waybill = ship?.waybill_number ?? ship?.shipment_number ?? "—";
  const invNo = String(display?.invoice_number ?? "—");
  const issued = String(display?.issued_date ?? "").slice(0, 10);

  const items = (display?.items ?? display?.Items) as Record<string, unknown>[] | undefined;
  const itemRows = Array.isArray(items) ? items : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader className={DIALOG_CREATE_HEADER_CLASS}>
          <DialogTitle>Edit invoice</DialogTitle>
          <DialogDescription>
            Data shipment, perusahaan, tanggal terbit, dan item baris bersifat tetap setelah invoice dibuat. Yang
            dapat diubah: <strong>jatuh tempo</strong>, <strong>status</strong>, dan <strong>catatan</strong> (sesuai
            API admin).
          </DialogDescription>
        </DialogHeader>
        {error ? (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">{error}</p>
        ) : null}

        {detailLoading ? (
          <p className="text-sm text-muted-foreground">Memuat detail invoice…</p>
        ) : null}

        <div className="grid gap-3">
          <div className="rounded-md border bg-muted/30 px-3 py-2">
            <p className="text-xs font-medium text-muted-foreground">Nomor invoice</p>
            <p className="font-mono text-sm font-semibold">{invNo}</p>
          </div>

          <div className="space-y-2">
            <Label>Shipment</Label>
            <Input className={readOnlyInputClass} readOnly value={waybill} aria-readonly />
          </div>
          <div className="space-y-2">
            <Label>Perusahaan (customer)</Label>
            <Input className={readOnlyInputClass} readOnly value={company?.name ?? "—"} aria-readonly />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label htmlFor="inv-edit-issued">Tanggal terbit</Label>
              <Input
                id="inv-edit-issued"
                className={readOnlyInputClass}
                type="date"
                readOnly
                value={issued}
                aria-readonly
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="inv-edit-due">Jatuh tempo</Label>
              <Input id="inv-edit-due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={status}
              onValueChange={(v) => {
                if (v != null) setStatus(v);
              }}
            >
              <SelectTrigger className="w-full min-w-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="inv-edit-notes">Catatan</Label>
            <Textarea
              id="inv-edit-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Catatan tambahan (opsional)"
            />
          </div>

          <div className="space-y-2 rounded-lg border bg-muted/30 p-3">
            <p className="text-xs font-medium text-muted-foreground">Ringkasan nominal</p>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="tabular-nums">{fmtIdr(display?.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">PPN</span>
              <span className="tabular-nums">{fmtIdr(display?.tax_amount)}</span>
            </div>
            <div className="flex justify-between border-t pt-2 text-sm font-semibold">
              <span>Total</span>
              <span className="tabular-nums">{fmtIdr(display?.total_amount)}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Item baris</Label>
            <p className="text-xs text-muted-foreground">
              Baris item tidak dapat diubah dari sini; invoice sudah tercatat dengan nominal di atas.
            </p>
            {itemRows.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">Tidak ada data item atau masih memuat…</p>
            ) : (
              <div className="overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Deskripsi</TableHead>
                      <TableHead className="w-16 text-right">Qty</TableHead>
                      <TableHead className="min-w-[96px] text-right">Harga satuan</TableHead>
                      <TableHead className="min-w-[96px] text-right">Jumlah</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {itemRows.map((it, idx) => (
                      <TableRow key={it.id != null ? String(it.id) : `it-${idx}`}>
                        <TableCell className="max-w-[200px] text-sm">{String(it.description ?? "—")}</TableCell>
                        <TableCell className="text-right tabular-nums text-sm">{String(it.quantity ?? "—")}</TableCell>
                        <TableCell className="text-right tabular-nums text-sm">{fmtIdr(it.unit_price)}</TableCell>
                        <TableCell className="text-right tabular-nums text-sm">{fmtIdr(it.total_price)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button type="button" disabled={disabled} onClick={() => void save()}>
            {saving ? "Menyimpan…" : "Simpan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
