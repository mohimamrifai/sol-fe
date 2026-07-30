"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
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
import { Checkbox } from "@/components/ui/checkbox";
import { createAdminCargoCategory, updateAdminCargoCategory } from "@/lib/admin-api";
import { ApiError } from "@/lib/api-client";
import { toast } from "sonner";
import { firstLaravelError } from "@/lib/laravel-errors";
import { DIALOG_CREATE_HEADER_CLASS } from "@/lib/dialog-create-header";
import { cn } from "@/lib/utils";

export type CargoCategoryDialogMode = "create" | "edit" | "view";

type Row = Record<string, unknown>;

export function MasterCargoCategoryDialog({
  open,
  onOpenChange,
  mode,
  row,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: CargoCategoryDialogMode;
  row: Row | null;
  onSaved: () => void;
}) {
  const readOnly = mode === "view";
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (row && (mode === "edit" || mode === "view")) {
      setName(String(row.name ?? ""));
      setCode(String(row.code ?? ""));
      setDescription(String(row.description ?? ""));
      setIsActive(row.is_active !== false);
    } else {
      setName("");
      setCode("");
      setDescription("");
      setIsActive(true);
    }
  }, [open, mode, row]);

  const handleSave = async () => {
    setError(null);
    setSaving(true);
    try {
      const body = {
        name,
        code: code.trim() || null,
        description: description.trim() || null,
        is_active: isActive,
      };
      if (mode === "create") {
        await createAdminCargoCategory(body);
        toast.success("Kategori kargo berhasil ditambahkan.");
      } else if (mode === "edit" && row?.id != null) {
        await updateAdminCargoCategory(Number(row.id), body);
        toast.success("Kategori kargo berhasil diperbarui.");
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
    mode === "create" ? "Tambah kategori kargo" : mode === "edit" ? "Edit kategori kargo" : "Detail kategori kargo";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader className={cn(mode === "create" && DIALOG_CREATE_HEADER_CLASS)}>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Kategori barang untuk pengiriman.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 pb-2">
          {error ? (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="cat-name">Nama Kategori</Label>
            <Input
              id="cat-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={readOnly}
              required
              placeholder={mode === "create" ? "Contoh: General Cargo, Electronics…" : undefined}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cat-code">Kode</Label>
            <Input
              id="cat-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              disabled={readOnly}
              placeholder={mode === "create" ? "Kode unik (opsional)" : undefined}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cat-desc">Deskripsi</Label>
            <Textarea
              id="cat-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={readOnly}
              placeholder={mode === "create" ? "Keterangan kategori kargo…" : undefined}
              className="min-h-[100px]"
            />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="cat-active"
              checked={isActive}
              onCheckedChange={(v) => setIsActive(v === true)}
              disabled={readOnly}
            />
            <Label htmlFor="cat-active" className="font-normal">
              Aktif
            </Label>
          </div>
        </div>
        {!readOnly ? (
          <DialogFooter className="sm:justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Batal
            </Button>
            <Button type="button" onClick={() => void handleSave()} disabled={saving || !name.trim()}>
              {saving ? "Menyimpan…" : "Simpan"}
            </Button>
          </DialogFooter>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
