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
import { TRACKING_STATUS_OPTIONS } from "@/lib/shipment-tracking-config";
import { DIALOG_CREATE_HEADER_CLASS } from "@/lib/dialog-create-header";

interface TrackingUpdateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  status: string;
  setStatus: (v: string) => void;
  trackedAt: string;
  setTrackedAt: (v: string) => void;
  notes: string;
  setNotes: (v: string) => void;
  setFiles: (f: FileList | null) => void;
  saving: boolean;
  onSave: () => void;
}

export function TrackingUpdateDialog({
  open,
  onOpenChange,
  status,
  setStatus,
  trackedAt,
  setTrackedAt,
  notes,
  setNotes,
  setFiles,
  saving,
  onSave,
}: TrackingUpdateDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton className="sm:max-w-md">
        <DialogHeader className={DIALOG_CREATE_HEADER_CLASS}>
          <DialogTitle>Update status tracking</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 py-2">
          <div className="space-y-1">
            <Label>Status Baru</Label>
            <Select value={status} onValueChange={(v) => v && setStatus(v)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TRACKING_STATUS_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Waktu Tracking</Label>
            <Input type="datetime-local" value={trackedAt} onChange={(e) => setTrackedAt(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Catatan / Lokasi</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Contoh: Barang telah sampai di gudang transit Jakarta (opsional)"
            />
          </div>
          <div className="space-y-1">
            <Label>Upload Foto (opsional)</Label>
            <Input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setFiles(e.target.files)}
              className="cursor-pointer"
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Batal
          </Button>
          <Button type="button" onClick={onSave} disabled={saving}>
            {saving ? "Memproses…" : "Tambah Tracking"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
