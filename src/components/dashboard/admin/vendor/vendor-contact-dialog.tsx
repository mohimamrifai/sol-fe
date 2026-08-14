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
import type { VendorContactRow } from "./vendor-form-sections";

export function VendorContactDialog({
  open,
  onOpenChange,
  initial,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial: VendorContactRow | null;
  onSave: (row: VendorContactRow) => void;
}) {
  const [name, setName] = useState("");
  const [position, setPosition] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [isPrimary, setIsPrimary] = useState(false);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (!open) return;
    setName(initial?.name ?? "");
    setPosition(initial?.position ?? "");
    setEmail(initial?.email ?? "");
    setMobile(initial?.mobile ?? "");
    setIsPrimary(initial?.is_primary ?? false);
    setIsActive(initial?.is_active !== false);
  }, [open, initial]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit Contact Person" : "Add Contact Person"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="space-y-2">
            <Label>PIC Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Position</Label>
            <Input value={position} onChange={(e) => setPosition(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Mobile Number</Label>
            <Input value={mobile} onChange={(e) => setMobile(e.target.value)} />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={isPrimary} onCheckedChange={(c) => setIsPrimary(c === true)} />
            Is Primary Contact
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={isActive} onCheckedChange={(c) => setIsActive(c === true)} />
            Active Contact
          </label>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
          <Button
            type="button"
            disabled={!name.trim() || !mobile.trim()}
            onClick={() =>
              onSave({
                id: initial?.id,
                name: name.trim(),
                position: position.trim() || undefined,
                email: email.trim() || undefined,
                mobile: mobile.trim(),
                is_primary: isPrimary,
                is_active: isActive,
              })
            }
          >
            Simpan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
