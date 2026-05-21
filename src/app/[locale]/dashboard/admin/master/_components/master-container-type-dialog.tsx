"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createAdminContainerType, updateAdminContainerType } from "@/lib/admin-api";
import { ApiError } from "@/lib/api-client";
import { toast } from "sonner";
import { firstLaravelError } from "@/lib/laravel-errors";
import { DIALOG_CREATE_HEADER_CLASS } from "@/lib/dialog-create-header";
import { cn } from "@/lib/utils";
import type { SimpleDialogMode } from "./master-transport-mode-dialog";

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
  const [name, setName] = useState("");
  const [size, setSize] = useState("");
  const [capacityWeight, setCapacityWeight] = useState("");
  const [capacityCbm, setCapacityCbm] = useState("");
  const [length, setLength] = useState("");
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (row && (mode === "edit" || mode === "view")) {
      setName(String(row.name ?? ""));
      setSize(String(row.size ?? ""));
      setCapacityWeight(row.capacity_weight != null ? String(row.capacity_weight) : "");
      setCapacityCbm(row.capacity_cbm != null ? String(row.capacity_cbm) : "");
      setLength(row.length != null ? String(row.length) : "");
      setWidth(row.width != null ? String(row.width) : "");
      setHeight(row.height != null ? String(row.height) : "");
      setIsActive(row.is_active !== false);
    } else {
      setName("");
      setSize("");
      setCapacityWeight("");
      setCapacityCbm("");
      setLength("");
      setWidth("");
      setHeight("");
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
        capacity_weight: num(capacityWeight),
        capacity_cbm: num(capacityCbm),
        length: num(length),
        width: num(width),
        height: num(height),
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
          <DialogDescription>Ukuran dan kapasitas kontainer.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 pb-2">
          {error ? (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="ct-name">Nama</Label>
            <Input
              id="ct-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={readOnly}
              placeholder={mode === "create" ? "Mis. Dry 20ft" : undefined}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ct-size">Ukuran (mis. 20ft)</Label>
            <Input
              id="ct-size"
              value={size}
              onChange={(e) => setSize(e.target.value)}
              disabled={readOnly}
              placeholder={mode === "create" ? "20ft, 40ft, 40HC…" : undefined}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="ct-w">Berat max</Label>
              <Input
                id="ct-w"
                value={capacityWeight}
                onChange={(e) => setCapacityWeight(e.target.value)}
                disabled={readOnly}
                placeholder={mode === "create" ? "kg" : undefined}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ct-cbm">CBM max</Label>
              <Input
                id="ct-cbm"
                value={capacityCbm}
                onChange={(e) => setCapacityCbm(e.target.value)}
                disabled={readOnly}
                placeholder={mode === "create" ? "CBM" : undefined}
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-2">
              <Label htmlFor="ct-l">P</Label>
              <Input
                id="ct-l"
                value={length}
                onChange={(e) => setLength(e.target.value)}
                disabled={readOnly}
                placeholder={mode === "create" ? "m" : undefined}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ct-wd">L</Label>
              <Input
                id="ct-wd"
                value={width}
                onChange={(e) => setWidth(e.target.value)}
                disabled={readOnly}
                placeholder={mode === "create" ? "m" : undefined}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ct-h">T</Label>
              <Input
                id="ct-h"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                disabled={readOnly}
                placeholder={mode === "create" ? "m" : undefined}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="ct-active"
              checked={isActive}
              onCheckedChange={(v) => setIsActive(v === true)}
              disabled={readOnly}
            />
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
