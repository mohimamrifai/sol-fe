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
import { createAdminTransportMode, updateAdminTransportMode } from "@/lib/admin-api";
import { ApiError } from "@/lib/api-client";
import { toast } from "sonner";
import { firstLaravelError } from "@/lib/laravel-errors";
import { DIALOG_CREATE_HEADER_CLASS } from "@/lib/dialog-create-header";
import { cn } from "@/lib/utils";

export type SimpleDialogMode = "create" | "edit" | "view";

type Row = Record<string, unknown>;

export function MasterTransportModeDialog({
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
  const [code, setCode] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (row && (mode === "edit" || mode === "view")) {
      setName(String(row.name ?? ""));
      setCode(String(row.code ?? ""));
      setIsActive(row.is_active !== false);
    } else {
      setName("");
      setCode("");
      setIsActive(true);
    }
  }, [open, mode, row]);

  const save = async () => {
    setError(null);
    setSaving(true);
    try {
      const body = { name, code: code.trim() || null, is_active: isActive };
      if (mode === "create") {
        await createAdminTransportMode(body);
        toast.success("Moda transport berhasil ditambahkan.");
      } else if (mode === "edit" && row?.id != null) {
        await updateAdminTransportMode(Number(row.id), body);
        toast.success("Moda transport berhasil diperbarui.");
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
    mode === "create" ? "Tambah moda transport" : mode === "edit" ? "Edit moda transport" : "Detail moda transport";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" showCloseButton>
        <DialogHeader className={cn(mode === "create" && DIALOG_CREATE_HEADER_CLASS)}>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Kode unik disarankan untuk integrasi.</DialogDescription>
        </DialogHeader>
        {error ? (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
        ) : null}
        <div className="grid gap-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="tm-name">Nama</Label>
            <Input
              id="tm-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={readOnly}
              placeholder={mode === "create" ? "Mis. Laut, Darat, Udara" : undefined}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tm-code">Kode</Label>
            <Input
              id="tm-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              disabled={readOnly}
              placeholder={mode === "create" ? "Kode unik (opsional)" : undefined}
            />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="tm-active"
              checked={isActive}
              onCheckedChange={(v) => setIsActive(v === true)}
              disabled={readOnly}
            />
            <Label htmlFor="tm-active" className="font-normal">
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
