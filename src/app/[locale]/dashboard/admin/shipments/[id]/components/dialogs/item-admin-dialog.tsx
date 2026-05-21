"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
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
import { Checkbox } from "@/components/ui/checkbox";
import { DIALOG_CREATE_HEADER_CLASS } from "@/lib/dialog-create-header";
import { cn } from "@/lib/utils";

interface ItemAdminDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  values: {
    itemName: string;
    itemDesc: string;
    itemQty: string;
    itemWeight: string;
    itemPlacement: "rack" | "floor";
    itemContainerId: string;
    itemRackId: string;
    itemFragile: boolean;
    itemStack: boolean;
    itemLength: string;
    itemWidth: string;
    itemHeight: string;
    itemCbm: string;
  };
  setters: {
    setItemName: (v: string) => void;
    setItemDesc: (v: string) => void;
    setItemQty: (v: string) => void;
    setItemWeight: (v: string) => void;
    setItemPlacement: (v: "rack" | "floor") => void;
    setItemContainerId: (v: string) => void;
    setItemRackId: (v: string) => void;
    setItemFragile: (v: boolean) => void;
    setItemStack: (v: boolean) => void;
    setItemLength: (v: string) => void;
    setItemWidth: (v: string) => void;
    setItemHeight: (v: string) => void;
    setItemCbm: (v: string) => void;
  };
  containers: Array<{
    id?: number | string;
    container_number?: string;
    container_type?: { name?: string };
  }>;
  rackOptions: { id: number; label: string }[];
  saving: boolean;
  onSave: () => void;
}

export function ItemAdminDialog({
  open,
  onOpenChange,
  mode,
  values,
  setters,
  containers,
  rackOptions,
  saving,
  onSave,
}: ItemAdminDialogProps) {
  const recalcCbm = (lStr: string, wStr: string, hStr: string, qStr: string) => {
    const l = Number(lStr) || 0;
    const w = Number(wStr) || 0;
    const h = Number(hStr) || 0;
    const q = Number(qStr) || 1;
    if (l > 0 && w > 0 && h > 0) {
      const cbm = ((l * w * h) / 1000000) * q;
      setters.setItemCbm(String(Number(cbm.toFixed(4))));
    } else {
      setters.setItemCbm("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader className={cn(mode === "create" && DIALOG_CREATE_HEADER_CLASS)}>
          <DialogTitle>{mode === "create" ? "Tambah item cargo" : "Edit item cargo"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 py-2">
          <div className="space-y-1">
            <Label>Nama Barang</Label>
            <Input
              value={values.itemName}
              onChange={(e) => setters.setItemName(e.target.value)}
              placeholder="Nama barang / komoditas"
            />
          </div>
          <div className="space-y-1">
            <Label>Deskripsi</Label>
            <Textarea
              value={values.itemDesc}
              onChange={(e) => setters.setItemDesc(e.target.value)}
              rows={2}
              placeholder="Detail kemasan, HS code, dsb. (opsional)"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Kuantitas</Label>
              <Input
                type="number"
                value={values.itemQty}
                onChange={(e) => {
                  setters.setItemQty(e.target.value);
                  recalcCbm(values.itemLength, values.itemWidth, values.itemHeight, e.target.value);
                }}
              />
            </div>
            <div className="space-y-1">
              <Label>Berat Kotor (kg)</Label>
              <Input
                type="number"
                step="0.01"
                value={values.itemWeight}
                onChange={(e) => setters.setItemWeight(e.target.value)}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <Label>P (cm)</Label>
              <Input 
                value={values.itemLength} 
                onChange={(e) => {
                  setters.setItemLength(e.target.value);
                  recalcCbm(e.target.value, values.itemWidth, values.itemHeight, values.itemQty);
                }} 
              />
            </div>
            <div className="space-y-1">
              <Label>L (cm)</Label>
              <Input 
                value={values.itemWidth} 
                onChange={(e) => {
                  setters.setItemWidth(e.target.value);
                  recalcCbm(values.itemLength, e.target.value, values.itemHeight, values.itemQty);
                }} 
              />
            </div>
            <div className="space-y-1">
              <Label>T (cm)</Label>
              <Input 
                value={values.itemHeight} 
                onChange={(e) => {
                  setters.setItemHeight(e.target.value);
                  recalcCbm(values.itemLength, values.itemWidth, e.target.value, values.itemQty);
                }} 
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Letak Barang</Label>
              <Select
                value={values.itemPlacement}
                onValueChange={(v) => setters.setItemPlacement(v === "rack" ? "rack" : "floor")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="floor">Lantai / Bebas</SelectItem>
                  <SelectItem value="rack">Rack</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>CBM</Label>
              <Input value={values.itemCbm} onChange={(e) => setters.setItemCbm(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Kontainer</Label>
              <Select value={values.itemContainerId} onValueChange={(v) => setters.setItemContainerId(v ?? "")}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">Tidak Ada</SelectItem>
                  {containers.map((c) => {
                    const ct = c.container_type as { name?: string } | undefined;
                    return (
                      <SelectItem key={String(c.id)} value={String(c.id)}>
                        {ct?.name ?? "Kontainer"} - {String(c.container_number ?? c.id)}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            {values.itemPlacement === "rack" && (
              <div className="space-y-1">
                <Label>Pilih Rack</Label>
                <Select value={values.itemRackId} onValueChange={(v) => setters.setItemRackId(v ?? "")}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">Pilih Rack</SelectItem>
                    {rackOptions.map((o) => (
                      <SelectItem key={o.id} value={String(o.id)}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-6 pt-1">
            <div className="flex items-center gap-2">
              <Checkbox
                id="item-fragile"
                checked={values.itemFragile}
                onCheckedChange={(v) => setters.setItemFragile(v === true)}
              />
              <Label htmlFor="item-fragile" className="cursor-pointer">Mudah Pecah</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="item-stack"
                checked={values.itemStack}
                onCheckedChange={(v) => setters.setItemStack(v === true)}
              />
              <Label htmlFor="item-stack" className="cursor-pointer">Bisa Ditumpuk</Label>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Batal
          </Button>
          <Button type="button" onClick={onSave} disabled={saving}>
            {saving ? "Menyimpan…" : mode === "create" ? "Tambahkan Item" : "Simpan Perubahan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
