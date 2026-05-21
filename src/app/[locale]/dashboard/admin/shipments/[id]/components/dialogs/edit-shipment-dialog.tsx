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
import { Textarea } from "@/components/ui/textarea";

interface EditShipmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  estDep: string;
  setEstDep: (v: string) => void;
  estArr: string;
  setEstArr: (v: string) => void;
  notes: string;
  setNotes: (v: string) => void;
  saving: boolean;
  onSave: () => void;
}

export function EditShipmentDialog({
  open,
  onOpenChange,
  estDep,
  setEstDep,
  estArr,
  setEstArr,
  notes,
  setNotes,
  saving,
  onSave,
}: EditShipmentDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton>
        <DialogHeader>
          <DialogTitle>Edit jadwal & catatan</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 py-2">
          <div className="space-y-1">
            <Label>Est. berangkat</Label>
            <Input type="date" value={estDep} onChange={(e) => setEstDep(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Est. tiba</Label>
            <Input type="date" value={estArr} onChange={(e) => setEstArr(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Catatan Pengiriman</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Catatan internal operasional (opsional)"
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Batal
          </Button>
          <Button type="button" onClick={onSave} disabled={saving}>
            {saving ? "Menyimpan…" : "Simpan Perubahan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
