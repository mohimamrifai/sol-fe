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

interface RackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: "create" | "edit";
  rackName: string;
  setRackName: (v: string) => void;
  saving: boolean;
  onSave: () => void;
}

export function RackDialog({
  open,
  onOpenChange,
  mode = "create",
  rackName,
  setRackName,
  saving,
  onSave,
}: RackDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton>
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Tambah rack ke kontainer" : "Edit rack"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 py-2">
          <div className="space-y-1">
            <Label>Nama / Kode Rack</Label>
            <Input
              value={rackName}
              onChange={(e) => setRackName(e.target.value)}
              placeholder="Misal: Rack A, Baris 1"
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Batal
          </Button>
          <Button type="button" onClick={onSave} disabled={saving || !rackName.trim()}>
            {saving ? "Menyimpan…" : (mode === "create" ? "Tambahkan" : "Simpan")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
