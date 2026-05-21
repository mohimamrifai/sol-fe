"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const REJECT_REASONS = [
  "Kapasitas pengiriman penuh",
  "Rute tidak dilayani / tidak tersedia",
  "Informasi kargo tidak lengkap / tidak valid",
  "Kargo mengandung barang terlarang / berbahaya tanpa izin",
  "Lainnya"
];

interface BookingRejectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loading: boolean;
  onSubmit: (reason: string) => void;
}

export function BookingRejectDialog({
  open,
  onOpenChange,
  loading,
  onSubmit,
}: BookingRejectDialogProps) {
  const [reasonType, setReasonType] = useState("");
  const [reasonOther, setReasonOther] = useState("");

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setReasonType("");
      setReasonOther("");
    }
    onOpenChange(newOpen);
  };

  const finalReason = reasonType === "Lainnya" ? reasonOther : reasonType;
  const canSubmit = finalReason.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Tolak booking</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="reject-reason-type">Alasan Penolakan</Label>
            <Select value={reasonType} onValueChange={(v) => setReasonType(v || "")} disabled={loading}>
              <SelectTrigger id="reject-reason-type" className="w-full">
                <SelectValue placeholder="Pilih alasan..." />
              </SelectTrigger>
              <SelectContent className="w-full">
                {REJECT_REASONS.map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {reasonType === "Lainnya" && (
            <div className="space-y-2">
              <Label htmlFor="reject-reason-other">Alasan Spesifik</Label>
              <Input
                id="reject-reason-other"
                placeholder="Ketikkan alasan penolakan..."
                value={reasonOther}
                onChange={(e) => setReasonOther(e.target.value)}
                disabled={loading}
              />
            </div>
          )}
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={loading}>
            Batal
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={!canSubmit || loading}
            onClick={() => onSubmit(finalReason.trim())}
          >
            {loading ? "Menyimpan…" : "Tolak"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
