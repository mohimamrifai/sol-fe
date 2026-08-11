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
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { DIALOG_CREATE_HEADER_CLASS } from "@/lib/dialog-create-header";

type ContainerTypeRow = {
  id?: number | string;
  name?: string;
  size?: string;
};

interface ContainerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: "create" | "edit";
  containerTypes: ContainerTypeRow[];
  contTypeId: string;
  setContTypeId: (v: string) => void;
  contNum: string;
  setContNum: (v: string) => void;
  contSeal: string;
  setContSeal: (v: string) => void;
  saving: boolean;
  onSave: () => void;
}

export function ContainerDialog({
  open,
  onOpenChange,
  mode = "create",
  containerTypes,
  contTypeId,
  setContTypeId,
  contNum,
  setContNum,
  contSeal,
  setContSeal,
  saving,
  onSave,
}: ContainerDialogProps) {
  const containerOptions = containerTypes.map((ct) => {
    const label = ct.name ? String(ct.name) : `Tipe ${ct.id}`;
    const sizeLabel = ct.size ? `(${ct.size})` : "";
    return { value: String(ct.id), label: `${label} ${sizeLabel}`.trim() };
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton>
        <DialogHeader className={mode === "create" ? DIALOG_CREATE_HEADER_CLASS : undefined}>
          <DialogTitle>{mode === "create" ? "Tambah kontainer baru" : "Edit kontainer"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 py-2">
          <div className="space-y-1">
            <Label>Tipe Kontainer</Label>
            <Combobox
              items={containerOptions}
              value={containerOptions.find((x) => x.value === contTypeId) ?? null}
              onValueChange={(next) => setContTypeId(next?.value ?? "")}
            >
              <ComboboxInput className="w-full" placeholder="Pilih tipe..." />
              <ComboboxContent>
                <ComboboxEmpty>Data tidak ditemukan.</ComboboxEmpty>
                <ComboboxList>
                  {(item: { value: string; label: string }) => (
                    <ComboboxItem key={item.value} value={item}>
                      {item.label}
                    </ComboboxItem>
                  )}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
          </div>
          <div className="space-y-1">
            <Label>Nomor Kontainer</Label>
            <Input
              value={contNum}
              onChange={(e) => setContNum(e.target.value)}
              placeholder="Mis. ABCD1234567"
            />
          </div>
          <div className="space-y-1">
            <Label>Nomor Segel (Seal)</Label>
            <Input
              value={contSeal}
              onChange={(e) => setContSeal(e.target.value)}
              placeholder="Opsional"
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Batal
          </Button>
          <Button type="button" onClick={onSave} disabled={saving || !contTypeId}>
            {saving ? "Menyimpan…" : (mode === "create" ? "Tambahkan" : "Simpan")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
