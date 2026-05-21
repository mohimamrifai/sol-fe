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
import { createAdminServiceType, updateAdminServiceType } from "@/lib/admin-api";
import { ApiError } from "@/lib/api-client";
import { toast } from "sonner";
import { firstLaravelError } from "@/lib/laravel-errors";
import { DIALOG_CREATE_HEADER_CLASS } from "@/lib/dialog-create-header";
import { cn } from "@/lib/utils";
import type { SimpleDialogMode } from "./master-transport-mode-dialog";

type Row = Record<string, unknown>;

export function MasterServiceTypeDialog({
  open,
  onOpenChange,
  mode,
  row,
  transportModes,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: SimpleDialogMode;
  row: Row | null;
  transportModes: Row[];
  onSaved: () => void;
}) {
  const readOnly = mode === "view";
  const [transportModeId, setTransportModeId] = useState("");
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
      const tm = row.transport_mode as { id?: number } | undefined;
      setTransportModeId(String(tm?.id ?? row.transport_mode_id ?? ""));
      setName(String(row.name ?? ""));
      setCode(String(row.code ?? ""));
      setDescription(String(row.description ?? ""));
      setIsActive(row.is_active !== false);
    } else {
      const first = transportModes[0];
      setTransportModeId(first?.id != null ? String(first.id) : "");
      setName("");
      setCode("");
      setDescription("");
      setIsActive(true);
    }
  }, [open, mode, row, transportModes]);

  const save = async () => {
    setError(null);
    setSaving(true);
    try {
      const body = {
        transport_mode_id: Number(transportModeId),
        name,
        code: code.trim() || null,
        description: description.trim() || null,
        is_active: isActive,
      };
      if (mode === "create") {
        await createAdminServiceType(body);
        toast.success("Service type berhasil ditambahkan.");
      } else if (mode === "edit" && row?.id != null) {
        await updateAdminServiceType(Number(row.id), body);
        toast.success("Service type berhasil diperbarui.");
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
    mode === "create" ? "Tambah service type" : mode === "edit" ? "Edit service type" : "Detail service type";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto" showCloseButton>
        <DialogHeader className={cn(mode === "create" && DIALOG_CREATE_HEADER_CLASS)}>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>FCL / LCL per moda transport.</DialogDescription>
        </DialogHeader>
        {error ? (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
        ) : null}
        <div className="grid gap-4 py-2">
          <div className="space-y-2">
            <Label>Moda transport</Label>
            <Select
              value={transportModeId}
              onValueChange={(v) => {
                if (v != null) setTransportModeId(v);
              }}
              disabled={readOnly}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih moda">
                  {transportModeId 
                    ? (() => {
                        const found = transportModes.find((tm) => String(tm.id) === transportModeId);
                        return found ? String(found.name ?? found.code ?? found.id) : transportModeId;
                      })()
                    : undefined}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {transportModes.map((tm) => (
                  <SelectItem key={String(tm.id)} value={String(tm.id)}>
                    {String(tm.name ?? tm.code ?? tm.id)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="st-name">Nama</Label>
            <Input
              id="st-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={readOnly}
              placeholder={mode === "create" ? "Mis. FCL Export" : undefined}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="st-code">Kode</Label>
            <Input
              id="st-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              disabled={readOnly}
              placeholder={mode === "create" ? "Kode (opsional)" : undefined}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="st-desc">Deskripsi</Label>
            <Textarea
              id="st-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={readOnly}
              rows={3}
              placeholder={mode === "create" ? "Penjelasan singkat layanan (opsional)" : undefined}
            />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="st-active"
              checked={isActive}
              onCheckedChange={(v) => setIsActive(v === true)}
              disabled={readOnly}
            />
            <Label htmlFor="st-active" className="font-normal">
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
              disabled={saving || !name.trim() || !transportModeId}
            >
              {saving ? "Menyimpan…" : "Simpan"}
            </Button>
          </DialogFooter>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
