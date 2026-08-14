"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { createAdminContainerType, updateAdminContainerType } from "@/lib/admin-api";
import { CONTAINER_CATEGORY_OPTIONS, CONTAINER_SIZE_OPTIONS } from "@/lib/admin-fsd-options";
import { ApiError } from "@/lib/api-client";
import { toast } from "sonner";
import { firstLaravelError } from "@/lib/laravel-errors";
import { DIALOG_CREATE_HEADER_CLASS } from "@/lib/dialog-create-header";
import { cn } from "@/lib/utils";
import type { SimpleDialogMode } from "@/components/dashboard/admin/master/master-transport-mode-dialog";

type Row = Record<string, unknown>;

export function MasterContainerTypeDialog({
  open,
  onOpenChange,
  mode,
  row,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: SimpleDialogMode;
  row: Row | null;
  onSaved: () => void;
}) {
  const readOnly = mode === "view";
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [size, setSize] = useState("");
  const [category, setCategory] = useState("dry");
  const [isoCode, setIsoCode] = useState("");
  const [capacityWeight, setCapacityWeight] = useState("");
  const [capacityCbm, setCapacityCbm] = useState("");
  const [remark, setRemark] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (row && (mode === "edit" || mode === "view")) {
      setCode(String(row.code ?? ""));
      setName(String(row.name ?? ""));
      setSize(String(row.size ?? ""));
      setCategory(String(row.category ?? "dry"));
      setIsoCode(String(row.iso_code ?? ""));
      setCapacityWeight(row.capacity_weight != null ? String(row.capacity_weight) : "");
      setCapacityCbm(row.capacity_cbm != null ? String(row.capacity_cbm) : "");
      setRemark(String(row.remark ?? ""));
      setIsActive(row.is_active !== false);
    } else {
      setCode("");
      setName("");
      setSize("");
      setCategory("dry");
      setIsoCode("");
      setCapacityWeight("");
      setCapacityCbm("");
      setRemark("");
      setIsActive(true);
    }
  }, [open, mode, row]);

  const num = (v: string) => {
    const t = v.trim();
    if (!t) return null;
    const n = Number(t);
    return Number.isFinite(n) ? n : null;
  };

  const save = async () => {
    setError(null);
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        name,
        size,
        category,
        iso_code: isoCode.trim() || null,
        capacity_weight: num(capacityWeight),
        capacity_cbm: num(capacityCbm),
        remark: remark.trim() || null,
        is_active: isActive,
      };
      if (mode === "create") {
        await createAdminContainerType(body);
        toast.success("Jenis kontainer berhasil ditambahkan.");
      } else if (mode === "edit" && row?.id != null) {
        await updateAdminContainerType(Number(row.id), body);
        toast.success("Jenis kontainer berhasil diperbarui.");
      }
      onSaved();
      onOpenChange(false);
    } catch (e) {
      const msg =
        e instanceof ApiError && e.status === 422
          ? firstLaravelError(e.body) ?? e.message
          : e instanceof ApiError
            ? e.message
            : "Gagal menyimpan.";
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const title =
    mode === "create"
      ? "Tambah jenis kontainer"
      : mode === "edit"
        ? "Edit jenis kontainer"
        : "Detail jenis kontainer";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader className={cn(mode === "create" && DIALOG_CREATE_HEADER_CLASS)}>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Ukuran, kategori, dan kapasitas kontainer.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 pb-2">
          {error ? (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
          ) : null}
          {code ? (
            <div className="space-y-2">
              <Label>Kode</Label>
              <Input value={code} disabled />
            </div>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="ct-name">Nama</Label>
            <Input id="ct-name" value={name} onChange={(e) => setName(e.target.value)} disabled={readOnly} />
          </div>
          <div className="space-y-2">
            <Label>Ukuran</Label>
            <Select value={size} onValueChange={(v) => v && setSize(v)} disabled={readOnly}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih ukuran" />
              </SelectTrigger>
              <SelectContent>
                {CONTAINER_SIZE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Kategori</Label>
            <Select value={category} onValueChange={(v) => v && setCategory(v)} disabled={readOnly}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONTAINER_CATEGORY_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ct-iso">ISO Code</Label>
            <Input id="ct-iso" value={isoCode} onChange={(e) => setIsoCode(e.target.value)} disabled={readOnly} placeholder="22G1" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="ct-w">Max Payload (kg)</Label>
              <Input id="ct-w" value={capacityWeight} onChange={(e) => setCapacityWeight(e.target.value)} disabled={readOnly} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ct-cbm">Capacity (CBM)</Label>
              <Input id="ct-cbm" value={capacityCbm} onChange={(e) => setCapacityCbm(e.target.value)} disabled={readOnly} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ct-remark">Remark</Label>
            <Textarea id="ct-remark" value={remark} onChange={(e) => setRemark(e.target.value)} disabled={readOnly} rows={2} />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="ct-active" checked={isActive} onCheckedChange={(v) => setIsActive(v === true)} disabled={readOnly} />
            <Label htmlFor="ct-active" className="font-normal">
              Aktif
            </Label>
          </div>
        </div>
        {!readOnly ? (
          <DialogFooter className="sm:justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Batal
            </Button>
            <Button type="button" onClick={() => void save()} disabled={saving || !name.trim() || !size.trim()}>
              {saving ? "Menyimpan…" : "Simpan"}
            </Button>
          </DialogFooter>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
