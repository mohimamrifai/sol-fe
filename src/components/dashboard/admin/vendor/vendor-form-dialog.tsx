"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createAdminVendor, updateAdminVendor } from "@/lib/admin-api";
import { ApiError } from "@/lib/api-client";
import { firstLaravelError } from "@/lib/laravel-errors";
import { DIALOG_CREATE_HEADER_CLASS } from "@/lib/dialog-create-header";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Row = Record<string, unknown>;

export function VendorFormDialog({
  open,
  onOpenChange,
  mode,
  row,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  row: Row | null;
  onSaved: () => void;
}) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (mode === "edit" && row) {
      setName(String(row.name ?? ""));
      setCode(String(row.code ?? ""));
      setAddress(String(row.address ?? ""));
      setPhone(String(row.phone ?? ""));
      setEmail(String(row.email ?? ""));
      setContactPerson(String(row.contact_person ?? ""));
      setIsActive(row.is_active !== false);
    } else {
      setName("");
      setCode("");
      setAddress("");
      setPhone("");
      setEmail("");
      setContactPerson("");
      setIsActive(true);
    }
  }, [open, mode, row]);

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {
        name: name.trim(),
        code: code.trim() || null,
        address: address.trim() || null,
        phone: phone.trim() || null,
        email: email.trim() || null,
        contact_person: contactPerson.trim() || null,
        is_active: isActive,
      };
      if (mode === "create") {
        await createAdminVendor(body);
        toast.success("Vendor berhasil ditambahkan.");
      } else if (row?.id != null) {
        await updateAdminVendor(Number(row.id), body);
        toast.success("Vendor berhasil diperbarui.");
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" showCloseButton>
        <DialogHeader className={cn(mode === "create" && DIALOG_CREATE_HEADER_CLASS)}>
          <DialogTitle>{mode === "create" ? "Tambah vendor" : "Edit vendor"}</DialogTitle>
        </DialogHeader>
        {error ? (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
        ) : null}
        <div className="grid gap-3 py-2">
          <div className="space-y-1">
            <Label>Nama</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={mode === "create" ? "Nama vendor" : undefined}
            />
          </div>
          <div className="space-y-1">
            <Label>Kode</Label>
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder={mode === "create" ? "Kode singkat (opsional)" : undefined}
            />
          </div>
          <div className="space-y-1">
            <Label>Alamat</Label>
            <Input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder={mode === "create" ? "Alamat kantor / gudang" : undefined}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label>Telepon</Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={mode === "create" ? "Nomor telepon" : undefined}
              />
            </div>
            <div className="space-y-1">
              <Label>Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={mode === "create" ? "email@vendor.com" : undefined}
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Kontak person</Label>
            <Input
              value={contactPerson}
              onChange={(e) => setContactPerson(e.target.value)}
              placeholder={mode === "create" ? "Nama PIC" : undefined}
            />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="v-act" checked={isActive} onCheckedChange={(v) => setIsActive(v === true)} />
            <Label htmlFor="v-act" className="font-normal">
              Aktif
            </Label>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Batal
          </Button>
          <Button type="button" onClick={() => void save()} disabled={saving || !name.trim()}>
            {saving ? "Menyimpan…" : "Simpan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
