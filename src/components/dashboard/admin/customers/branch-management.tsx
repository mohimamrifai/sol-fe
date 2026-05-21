"use client";

import { useState } from "react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ConfirmDeleteDialog } from "@/components/dashboard/admin/confirm-delete-dialog";
import { createAdminBranch, deleteAdminBranch, updateAdminBranch } from "@/lib/admin-api";
import { toast } from "sonner";
import { ApiError } from "@/lib/api-client";

interface BranchManagementProps {
  companyId: number;
  branches: Record<string, unknown>[];
  canManage: boolean;
  onRefresh: () => Promise<void>;
}

export function BranchManagement({
  companyId,
  branches,
  canManage,
  onRefresh,
}: BranchManagementProps) {
  const [open, setOpen] = useState(false);
  const [editRow, setEditRow] = useState<Record<string, unknown> | null>(null);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [pic, setPic] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteRow, setDeleteRow] = useState<Record<string, unknown> | null>(null);
  const [delLoading, setDelLoading] = useState(false);

  const onOpen = (row?: Record<string, unknown>) => {
    if (row) {
      setEditRow(row);
      setName(String(row.name ?? ""));
      setAddress(String(row.address ?? ""));
      setCity(String(row.city ?? ""));
      setPhone(String(row.phone ?? ""));
      setPic(String(row.contact_person ?? ""));
      setIsActive(row.is_active !== false);
    } else {
      setEditRow(null);
      setName("");
      setAddress("");
      setCity("");
      setPhone("");
      setPic("");
      setIsActive(true);
    }
    setOpen(true);
  };

  const onSave = async () => {
    setSaving(true);
    try {
      const body = {
        name: name.trim(),
        address: address.trim() || null,
        city: city.trim() || null,
        phone: phone.trim() || null,
        contact_person: pic.trim() || null,
        is_active: isActive,
      };
      if (editRow?.id != null) {
        await updateAdminBranch(companyId, Number(editRow.id), body);
      } else {
        await createAdminBranch(companyId, body);
      }
      setOpen(false);
      await onRefresh();
      toast.success("Cabang tersimpan.");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Gagal menyimpan cabang.");
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    if (deleteRow?.id == null) return;
    setDelLoading(true);
    try {
      await deleteAdminBranch(companyId, Number(deleteRow.id));
      setDeleteRow(null);
      await onRefresh();
      toast.success("Cabang dihapus.");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Gagal menghapus.");
    } finally {
      setDelLoading(false);
    }
  };

  return (
    <div className="space-y-2 rounded-lg border p-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-medium">Cabang</h3>
        {canManage ? (
          <Button type="button" size="sm" variant="outline" onClick={() => onOpen()}>
            + Cabang
          </Button>
        ) : null}
      </div>
      {branches.length === 0 ? (
        <p className="text-xs text-muted-foreground">Belum ada cabang.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {branches.map((b) => (
              <TableRow key={String(b.id)}>
                <TableCell>{String(b.name ?? "")}</TableCell>
                <TableCell className="text-right">
                  {canManage ? (
                    <>
                      <Button type="button" size="sm" variant="ghost" onClick={() => onOpen(b)}>
                        Edit
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => setDeleteRow(b)}
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
            <DialogTitle>{editRow ? "Edit cabang" : "Tambah cabang"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="space-y-1">
              <Label>Nama</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nama cabang / gudang"
              />
            </div>
            <div className="space-y-1">
              <Label>Alamat</Label>
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Alamat cabang"
              />
            </div>
            <div className="space-y-1">
              <Label>Kota</Label>
              <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Kota" />
            </div>
            <div className="space-y-1">
              <Label>Telepon</Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="081234567890 atau 6281234567890"
              />
            </div>
            <div className="space-y-1">
              <Label>PIC</Label>
              <Input value={pic} onChange={(e) => setPic(e.target.value)} placeholder="Nama PIC cabang" />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="b-a"
                checked={isActive}
                onCheckedChange={(v) => setIsActive(v === true)}
              />
              <Label htmlFor="b-a" className="font-normal">
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
            <Button type="button" onClick={() => void onSave()} disabled={saving || !name.trim()}>
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={deleteRow != null}
        onOpenChange={(o) => !o && setDeleteRow(null)}
        title="Hapus cabang?"
        description="Yakin hapus cabang ini?"
        loading={delLoading}
        onConfirm={() => void onDelete()}
      />
    </div>
  );
}
