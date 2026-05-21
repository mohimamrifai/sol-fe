"use client";

import { useEffect, useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { createAdminAdditionalService, updateAdminAdditionalService } from "@/lib/admin-api";
import { ApiError } from "@/lib/api-client";
import { toast } from "sonner";
import { firstLaravelError } from "@/lib/laravel-errors";
import { DIALOG_CREATE_HEADER_CLASS } from "@/lib/dialog-create-header";
import { cn } from "@/lib/utils";
import type { SimpleDialogMode } from "./master-transport-mode-dialog";

type Row = Record<string, unknown>;

const CATS = [
  { value: "pickup", label: "Pickup" },
  { value: "packing", label: "Packing" },
  { value: "handling", label: "Handling" },
  { value: "other", label: "Lainnya" },
];

export function MasterAdditionalServiceDialog({
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
  const [category, setCategory] = useState("pickup");
  const [description, setDescription] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (row && (mode === "edit" || mode === "view")) {
      setName(String(row.name ?? ""));
      setCategory(String(row.category ?? "pickup"));
      setDescription(String(row.description ?? ""));
      setBasePrice(row.base_price != null ? String(row.base_price) : "");
      setIsActive(row.is_active !== false);
    } else {
      setName("");
      setCategory("pickup");
      setDescription("");
      setBasePrice("");
      setIsActive(true);
    }
  }, [open, mode, row]);

  const save = async () => {
    setError(null);
    setSaving(true);
    try {
      const bp = basePrice.trim();
      const body: Record<string, unknown> = {
        name,
        category,
        description: description.trim() || null,
        base_price: bp ? Number(bp) : null,
        is_active: isActive,
      };
      if (mode === "create") {
        await createAdminAdditionalService(body);
        toast.success("Layanan tambahan berhasil ditambahkan.");
      } else if (mode === "edit" && row?.id != null) {
        await updateAdminAdditionalService(Number(row.id), body);
        toast.success("Layanan tambahan berhasil diperbarui.");
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
      ? "Tambah layanan tambahan"
      : mode === "edit"
        ? "Edit layanan tambahan"
        : "Detail layanan tambahan";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" showCloseButton>
        <DialogHeader className={cn(mode === "create" && DIALOG_CREATE_HEADER_CLASS)}>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Pickup, packing, handling.</DialogDescription>
        </DialogHeader>
        {error ? (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
        ) : null}
        <div className="grid gap-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="as-name">Nama</Label>
            <Input id="as-name" value={name} onChange={(e) => setName(e.target.value)} disabled={readOnly} />
          </div>
          <div className="space-y-2">
            <Label>Grup</Label>
            <Select
              value={category}
              onValueChange={(v) => {
                if (v != null) setCategory(v);
              }}
              disabled={readOnly}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATS.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="as-desc">Deskripsi</Label>
            <Textarea
              id="as-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={readOnly}
              rows={2}
              placeholder={mode === "create" ? "Detail layanan (opsional)" : undefined}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="as-price">Harga dasar (Rp)</Label>
            <Input
              id="as-price"
              type="number"
              min={0}
              step="0.01"
              value={basePrice}
              onChange={(e) => setBasePrice(e.target.value)}
              disabled={readOnly}
              placeholder={mode === "create" ? "0" : undefined}
            />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="as-active"
              checked={isActive}
              onCheckedChange={(v) => setIsActive(v === true)}
              disabled={readOnly}
            />
            <Label htmlFor="as-active" className="font-normal">
              Aktif
            </Label>
          </div>
        </div>
        {!readOnly ? (
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Batal
            </Button>
            <Button type="button" onClick={() => void save()} disabled={saving || !name.trim()}>
              {saving ? "Menyimpan…" : "Simpan"}
            </Button>
          </DialogFooter>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
