"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { ConfirmDeleteDialog } from "@/components/dashboard/admin/confirm-delete-dialog";
import {
  createAdminCustomerDiscount,
  deleteAdminCustomerDiscount,
  fetchAdminVendors,
  updateAdminCustomerDiscount,
} from "@/lib/admin-api";
import { toast } from "sonner";
import { ApiError } from "@/lib/api-client";
import type { LaravelPaginated } from "@/lib/types-api";

interface DiscountManagementProps {
  companyId: number;
  discounts: Record<string, unknown>[];
  canManage: boolean;
  onRefresh: () => Promise<void>;
}

export function DiscountManagement({
  companyId,
  discounts,
  canManage,
  onRefresh,
}: DiscountManagementProps) {
  const [open, setOpen] = useState(false);
  const [editRow, setEditRow] = useState<Record<string, unknown> | null>(null);
  const [vsId, setVsId] = useState("");
  const [type, setType] = useState<"percentage" | "fixed">("percentage");
  const [val, setVal] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [vendorServiceOptions, setVendorServiceOptions] = useState<
    { id: number; label: string }[]
  >([]);
  const [saving, setSaving] = useState(false);
  const [deleteRow, setDeleteRow] = useState<Record<string, unknown> | null>(null);
  const [delLoading, setDelLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    void (async () => {
      try {
        const res = await fetchAdminVendors({ page: 1, perPage: 100 });
        const paginated = res as LaravelPaginated<Record<string, unknown>>;
        const vendors = paginated.data ?? [];
        const opts: { id: number; label: string }[] = [];
        for (const v of vendors) {
          const svs = (v.vendor_services ?? v.vendorServices) as
            | Record<string, unknown>[]
            | undefined;
          if (!Array.isArray(svs)) continue;
          const vn = String(v.name ?? v.code ?? "");
          for (const s of svs) {
            if (s.id == null) continue;
            opts.push({
              id: Number(s.id),
              label: `${vn} — #${s.id}`,
            });
          }
        }
        setVendorServiceOptions(opts);
      } catch {
        setVendorServiceOptions([]);
      }
    })();
  }, [open]);

  const onOpen = (row?: Record<string, unknown>) => {
    if (row) {
      setEditRow(row);
      const vs = row.vendor_service as { id?: number } | undefined;
      setVsId(vs?.id != null ? String(vs.id) : "");
      setType((row.discount_type as "percentage" | "fixed") ?? "percentage");
      setVal(String(row.discount_value ?? ""));
      setFrom(row.effective_from ? String(row.effective_from).slice(0, 10) : "");
      setTo(row.effective_to ? String(row.effective_to).slice(0, 10) : "");
      setIsActive(row.is_active !== false);
    } else {
      setEditRow(null);
      setVsId("");
      setType("percentage");
      setVal("");
      setFrom("");
      setTo("");
      setIsActive(true);
    }
    setOpen(true);
  };

  const onSave = async () => {
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        vendor_service_id: vsId && vsId !== "__none__" ? Number(vsId) : null,
        discount_type: type,
        discount_value: Number(val) || 0,
        effective_from: from || null,
        effective_to: to || null,
        is_active: isActive,
      };
      if (editRow?.id != null) {
        await updateAdminCustomerDiscount(companyId, Number(editRow.id), body);
      } else {
        await createAdminCustomerDiscount(companyId, body);
      }
      setOpen(false);
      await onRefresh();
      toast.success("Diskon tersimpan.");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Gagal menyimpan diskon.");
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    if (deleteRow?.id == null) return;
    setDelLoading(true);
    try {
      await deleteAdminCustomerDiscount(companyId, Number(deleteRow.id));
      setDeleteRow(null);
      await onRefresh();
      toast.success("Diskon dihapus.");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Gagal menghapus.");
    } finally {
      setDelLoading(false);
    }
  };

  const selectedVendorServiceLabel =
    vsId && vsId !== "__none__"
      ? vendorServiceOptions.find((o) => String(o.id) === vsId)?.label ?? vsId
      : "Tidak terkait vendor service";

  return (
    <div className="space-y-2 rounded-lg border p-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-medium">Diskon</h3>
        {canManage ? (
          <Button type="button" size="sm" variant="outline" onClick={() => onOpen()}>
            + Diskon
          </Button>
        ) : null}
      </div>
      {discounts.length === 0 ? (
        <p className="text-xs text-muted-foreground">Belum ada diskon.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tipe</TableHead>
              <TableHead>Nilai</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {discounts.map((d) => (
              <TableRow key={String(d.id)}>
                <TableCell>{String(d.discount_type ?? "")}</TableCell>
                <TableCell>{String(d.discount_value ?? "")}</TableCell>
                <TableCell className="text-right">
                  {canManage ? (
                    <>
                      <Button type="button" size="sm" variant="ghost" onClick={() => onOpen(d)}>
                        Edit
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => setDeleteRow(d)}
                      >
                        Hapus
                      </Button>
                    </>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editRow ? "Edit diskon" : "Tambah diskon"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="space-y-1">
              <Label>Vendor service (opsional)</Label>
              <Select
                value={vsId || "__none__"}
                onValueChange={(v) => v != null && setVsId(v === "__none__" ? "" : v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih vendor service (opsional)">
                    {selectedVendorServiceLabel}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="min-w-[24rem] max-w-[90vw]">
                  <SelectItem value="__none__">Tidak terkait vendor service</SelectItem>
                  {vendorServiceOptions.map((o) => (
                    <SelectItem key={o.id} value={String(o.id)}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Tipe</Label>
              <Select value={type} onValueChange={(v) => setType(v as "percentage" | "fixed")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Persen</SelectItem>
                  <SelectItem value="fixed">Nominal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Nilai</Label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={val}
                onChange={(e) => setVal(e.target.value)}
                placeholder="Contoh: 10 (persen) atau 50000 (nominal)"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label>Dari</Label>
                <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
                <p className="text-[11px] text-muted-foreground">Tanggal mulai berlaku</p>
              </div>
              <div className="space-y-1">
                <Label>Sampai</Label>
                <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
                <p className="text-[11px] text-muted-foreground">Tanggal akhir (opsional)</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="d-a" checked={isActive} onCheckedChange={(v) => setIsActive(v === true)} />
              <Label htmlFor="d-a" className="font-normal">
                Aktif
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={saving}
            >
              Batal
            </Button>
            <Button type="button" onClick={() => void onSave()} disabled={saving}>
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={deleteRow != null}
        onOpenChange={(o) => !o && setDeleteRow(null)}
        title="Hapus diskon?"
        description="Yakin hapus diskon ini?"
        loading={delLoading}
        onConfirm={() => void onDelete()}
      />
    </div>
  );
}
