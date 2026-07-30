"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { createAdminLocation, updateAdminLocation } from "@/lib/admin-api";
import { ApiError } from "@/lib/api-client";
import { toast } from "sonner";
import { firstLaravelError } from "@/lib/laravel-errors";
import { DIALOG_CREATE_HEADER_CLASS } from "@/lib/dialog-create-header";
import { cn } from "@/lib/utils";

const TYPES = [
  { value: "port", label: "Pelabuhan" },
  { value: "city", label: "Kota" },
  { value: "hub", label: "Hub" },
  { value: "warehouse", label: "Gudang" },
  { value: "station", label: "Stasiun" },
  { value: "airport", label: "Bandara" },
  { value: "terminal", label: "Terminal" },
];

export type LocationDialogMode = "create" | "edit" | "view";

type Row = Record<string, unknown>;

export function MasterLocationDialog({
  open,
  onOpenChange,
  mode,
  row,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: LocationDialogMode;
  row: Row | null;
  onSaved: () => void;
}) {
  const readOnly = mode === "view";
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [type, setType] = useState("port");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [address, setAddress] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (row && (mode === "edit" || mode === "view")) {
      setName(String(row.name ?? ""));
      setCode(String(row.code ?? ""));
      setType(String(row.type ?? "port"));
      setCity(String(row.city ?? ""));
      setProvince(String(row.province ?? ""));
      setAddress(String(row.address ?? ""));
      setIsActive(row.is_active !== false);
    } else {
      setName("");
      setCode("");
      setType("port");
      setCity("");
      setProvince("");
      setAddress("");
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
        type,
        city: city.trim() || null,
        province: province.trim() || null,
        address: address.trim() || null,
        is_active: isActive,
      };
      if (mode === "create") {
        await createAdminLocation(body);
        toast.success("Lokasi berhasil ditambahkan.");
      } else if (mode === "edit" && row?.id != null) {
        await updateAdminLocation(Number(row.id), body);
        toast.success("Lokasi berhasil diperbarui.");
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
    mode === "create" ? "Tambah lokasi" : mode === "edit" ? "Edit lokasi" : "Detail lokasi";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader className={cn(mode === "create" && DIALOG_CREATE_HEADER_CLASS)}>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Origin, destination & terminal.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 pb-2">
          {error ? (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="loc-name">Nama</Label>
            <Input
              id="loc-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={readOnly}
              required
              placeholder={mode === "create" ? "Nama lokasi (pelabuhan, kota, hub…)" : undefined}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="loc-code">Kode</Label>
            <Input
              id="loc-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              disabled={readOnly}
              placeholder={mode === "create" ? "Kode singkat (opsional)" : undefined}
            />
          </div>
          <div className="space-y-2">
            <Label>Tipe</Label>
            <Select
              value={type}
              onValueChange={(v) => {
                if (v != null) setType(v);
              }}
              disabled={readOnly}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="loc-city">Kota</Label>
            <Input
              id="loc-city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              disabled={readOnly}
              placeholder={mode === "create" ? "Kota / kabupaten" : undefined}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="loc-prov">Provinsi</Label>
            <Input
              id="loc-prov"
              value={province}
              onChange={(e) => setProvince(e.target.value)}
              disabled={readOnly}
              placeholder={mode === "create" ? "Provinsi" : undefined}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="loc-addr">Alamat</Label>
            <Input
              id="loc-addr"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              disabled={readOnly}
              placeholder={mode === "create" ? "Alamat detail (opsional)" : undefined}
            />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="loc-active"
              checked={isActive}
              onCheckedChange={(v) => setIsActive(v === true)}
              disabled={readOnly}
            />
            <Label htmlFor="loc-active" className="font-normal">
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
