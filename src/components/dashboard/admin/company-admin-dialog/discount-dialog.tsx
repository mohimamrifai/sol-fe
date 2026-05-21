import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { DIALOG_CREATE_HEADER_CLASS } from "@/lib/dialog-create-header";
import type { Row } from "./types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  discEdit: Row | null;
  dVsId: string;
  dType: "percentage" | "fixed";
  dVal: string;
  dFrom: string;
  dTo: string;
  dActive: boolean;
  savingDisc: boolean;
  vendorServiceOptions: { id: number; label: string }[];
  setDVsId: (v: string) => void;
  setDType: (v: "percentage" | "fixed") => void;
  setDVal: (v: string) => void;
  setDFrom: (v: string) => void;
  setDTo: (v: string) => void;
  setDActive: (v: boolean) => void;
  onSave: () => void;
};

export function DiscountDialog(props: Props) {
  const {
    open,
    onOpenChange,
    discEdit,
    dVsId,
    dType,
    dVal,
    dFrom,
    dTo,
    dActive,
    savingDisc,
    vendorServiceOptions,
    setDVsId,
    setDType,
    setDVal,
    setDFrom,
    setDTo,
    setDActive,
    onSave,
  } = props;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton>
        <DialogHeader className={cn(!discEdit && DIALOG_CREATE_HEADER_CLASS)}>
          <DialogTitle>{discEdit ? "Edit diskon" : "Tambah diskon"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 py-2">
          <div className="space-y-1">
            <Label>Vendor service (opsional)</Label>
            <Select value={dVsId || "__none__"} onValueChange={(v) => v != null && setDVsId(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih vendor service (opsional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Tidak terkait vendor service</SelectItem>
                {vendorServiceOptions.map((o) => (
                  <SelectItem key={o.id} value={String(o.id)}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Tipe</Label>
            <Select value={dType} onValueChange={(v) => setDType(v as "percentage" | "fixed")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="percentage">Persen</SelectItem>
                <SelectItem value="fixed">Nominal</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Nilai</Label>
            <Input
              type="number"
              min={0}
              step="0.01"
              value={dVal}
              onChange={(e) => setDVal(e.target.value)}
              placeholder="Contoh: 10 (persen) atau 50000 (nominal)"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label>Dari</Label>
              <Input
                type="date"
                value={dFrom}
                onChange={(e) => setDFrom(e.target.value)}
                placeholder={!discEdit ? "Tanggal mulai berlaku" : undefined}
              />
              <p className="text-[11px] text-muted-foreground">Tanggal mulai berlaku</p>
            </div>
            <div className="space-y-1">
              <Label>Sampai</Label>
              <Input
                type="date"
                value={dTo}
                onChange={(e) => setDTo(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground">Tanggal akhir (opsional)</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="d-a" checked={dActive} onCheckedChange={(v) => setDActive(v === true)} />
            <Label htmlFor="d-a" className="font-normal">
              Aktif
            </Label>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={savingDisc}>
            Batal
          </Button>
          <Button type="button" onClick={onSave} disabled={savingDisc}>
            Simpan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
