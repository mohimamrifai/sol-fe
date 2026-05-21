"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createAdminTrainCar, updateAdminTrainCar } from "@/lib/admin-api";
import { ApiError } from "@/lib/api-client";
import { toast } from "sonner";
import { firstLaravelError } from "@/lib/laravel-errors";
import { DIALOG_CREATE_HEADER_CLASS } from "@/lib/dialog-create-header";
import { cn } from "@/lib/utils";
import type { SimpleDialogMode } from "./master-transport-mode-dialog";

type Row = Record<string, unknown>;
type TrainOption = { id: number; name: string };

export function MasterTrainCarDialog({
  open,
  onOpenChange,
  mode,
  row,
  trains,
  defaultTrainId,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: SimpleDialogMode;
  row: Row | null;
  trains: TrainOption[];
  defaultTrainId?: number;
  onSaved: () => void;
}) {
  const readOnly = mode === "view";

  const trainOptions = useMemo(
    () => trains.map((t) => ({ value: String(t.id), label: t.name })),
    [trains]
  );

  const [trainId, setTrainId] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [capacityWeight, setCapacityWeight] = useState("");
  const [capacityCbm, setCapacityCbm] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (row && (mode === "edit" || mode === "view")) {
      setTrainId(String(row.train_id ?? ""));
      setName(String(row.name ?? ""));
      setCode(String(row.code ?? ""));
      setCapacityWeight(row.capacity_weight != null ? String(row.capacity_weight) : "");
      setCapacityCbm(row.capacity_cbm != null ? String(row.capacity_cbm) : "");
      setIsActive(row.is_active !== false);
      return;
    }
    setTrainId(defaultTrainId != null ? String(defaultTrainId) : "");
    setName("");
    setCode("");
    setCapacityWeight("");
    setCapacityCbm("");
    setIsActive(true);
  }, [open, mode, row, defaultTrainId]);

  const save = async () => {
    setError(null);
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        train_id: Number(trainId),
        name,
        code: code.trim() || null,
        capacity_weight: capacityWeight.trim() ? Number(capacityWeight) : null,
        capacity_cbm: capacityCbm.trim() ? Number(capacityCbm) : null,
        is_active: isActive,
      };
      if (mode === "create") {
        await createAdminTrainCar(body);
        toast.success("Gerbong berhasil ditambahkan.");
      } else if (mode === "edit" && row?.id != null) {
        await updateAdminTrainCar(Number(row.id), body);
        toast.success("Gerbong berhasil diperbarui.");
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
    mode === "create" ? "Tambah gerbong" : mode === "edit" ? "Edit gerbong" : "Detail gerbong";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" showCloseButton>
        <DialogHeader className={cn(mode === "create" && DIALOG_CREATE_HEADER_CLASS)}>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Master gerbong untuk kereta Rail.</DialogDescription>
        </DialogHeader>
        {error ? (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
        ) : null}
        <div className="grid gap-4 py-2">
          <div className="space-y-2">
            <Label>Kereta</Label>
            <Select
              value={trainId}
              onValueChange={(v) => {
                if (v != null) setTrainId(v);
              }}
              disabled={readOnly}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={trainOptions.length ? "Pilih kereta" : "Tidak ada data kereta"} />
              </SelectTrigger>
              <SelectContent>
                {trainOptions.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="car-name">Nama</Label>
            <Input
              id="car-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={readOnly}
              placeholder={mode === "create" ? "Mis. Gerbong 01" : undefined}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="car-code">Kode</Label>
            <Input
              id="car-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              disabled={readOnly}
              placeholder={mode === "create" ? "Kode (opsional)" : undefined}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="car-capw">Kapasitas (kg)</Label>
              <Input
                id="car-capw"
                inputMode="decimal"
                value={capacityWeight}
                onChange={(e) => setCapacityWeight(e.target.value)}
                disabled={readOnly}
                placeholder={mode === "create" ? "Opsional" : undefined}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="car-capc">Kapasitas (cbm)</Label>
              <Input
                id="car-capc"
                inputMode="decimal"
                value={capacityCbm}
                onChange={(e) => setCapacityCbm(e.target.value)}
                disabled={readOnly}
                placeholder={mode === "create" ? "Opsional" : undefined}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="car-active"
              checked={isActive}
              onCheckedChange={(v) => setIsActive(v === true)}
              disabled={readOnly}
            />
            <Label htmlFor="car-active" className="font-normal">
              Aktif
            </Label>
          </div>
        </div>
        {!readOnly ? (
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Batal
            </Button>
            <Button
              type="button"
              onClick={() => void save()}
              disabled={saving || !trainId || !name.trim()}
            >
              {saving ? "Menyimpan…" : "Simpan"}
            </Button>
          </DialogFooter>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

