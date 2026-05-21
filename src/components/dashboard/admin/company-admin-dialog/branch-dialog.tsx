import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { DIALOG_CREATE_HEADER_CLASS } from "@/lib/dialog-create-header";
import type { Row } from "./types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branchEdit: Row | null;
  bName: string;
  bAddr: string;
  bCity: string;
  bPhone: string;
  bPic: string;
  bActive: boolean;
  savingBranch: boolean;
  setBName: (v: string) => void;
  setBAddr: (v: string) => void;
  setBCity: (v: string) => void;
  setBPhone: (v: string) => void;
  setBPic: (v: string) => void;
  setBActive: (v: boolean) => void;
  onSave: () => void;
};

export function BranchDialog(props: Props) {
  const {
    open,
    onOpenChange,
    branchEdit,
    bName,
    bAddr,
    bCity,
    bPhone,
    bPic,
    bActive,
    savingBranch,
    setBName,
    setBAddr,
    setBCity,
    setBPhone,
    setBPic,
    setBActive,
    onSave,
  } = props;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton>
        <DialogHeader className={cn(!branchEdit && DIALOG_CREATE_HEADER_CLASS)}>
          <DialogTitle>{branchEdit ? "Edit cabang" : "Tambah cabang"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 py-2">
          <div className="space-y-1">
            <Label>Nama</Label>
            <Input
              value={bName}
              onChange={(e) => setBName(e.target.value)}
              placeholder="Nama cabang / gudang"
            />

          </div>
          <div className="space-y-1">
            <Label>Alamat</Label>
            <Input value={bAddr} onChange={(e) => setBAddr(e.target.value)} placeholder="Alamat cabang" />
          </div>
          <div className="space-y-1">
            <Label>Kota</Label>
            <Input value={bCity} onChange={(e) => setBCity(e.target.value)} placeholder="Kota" />
          </div>
          <div className="space-y-1">
            <Label>Telepon</Label>
            <Input
              value={bPhone}
              onChange={(e) => setBPhone(e.target.value)}
              placeholder="081234567890 atau 6281234567890"
              inputMode="numeric"
              pattern="[0-9]*"
            />
          </div>
          <div className="space-y-1">
            <Label>PIC</Label>
            <Input
              value={bPic}
              onChange={(e) => setBPic(e.target.value)}
              placeholder="Nama PIC cabang"
            />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="b-a" checked={bActive} onCheckedChange={(v) => setBActive(v === true)} />
            <Label htmlFor="b-a" className="font-normal">
              Aktif
            </Label>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={savingBranch}>
            Batal
          </Button>
          <Button type="button" onClick={onSave} disabled={savingBranch || !bName.trim()}>
            Simpan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
