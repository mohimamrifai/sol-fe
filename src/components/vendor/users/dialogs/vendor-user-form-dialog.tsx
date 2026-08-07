"use client";

import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { useCreateVendorUser } from "@/hooks/use-vendor-users";
import { toast } from "sonner";

type Props = { open: boolean; onOpenChange: (open: boolean) => void; onCreated?: (pwd: string) => void };

const ROLES = [
  { value: "vendor_company_admin", label: "Vendor Company Admin" },
  { value: "vendor_ops_pic", label: "Vendor Ops PIC" },
  { value: "vendor_finance_pic", label: "Vendor Finance PIC" },
  { value: "vendor_viewer", label: "Vendor Viewer" },
];

export function VendorUserFormDialog({ open, onOpenChange, onCreated }: Props) {
  const tCommon = useTranslations("Vendor.common");
  const tAct = useTranslations("Vendor.users.actions");
  const mutate = useCreateVendorUser();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [role, setRole] = useState("");

  const reset = () => { setName(""); setEmail(""); setMobile(""); setRole(""); };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{tAct("addUser")}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div>
            <Label className="text-xs">Name *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="h-10" />
          </div>
          <div>
            <Label className="text-xs">Email *</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-10" />
          </div>
          <div>
            <Label className="text-xs">Mobile</Label>
            <Input value={mobile} onChange={(e) => setMobile(e.target.value)} className="h-10" />
          </div>
          <div>
            <Label className="text-xs">Role *</Label>
            <Select value={role} onValueChange={(v) => v && setRole(v)}>
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Pilih role" />
              </SelectTrigger>
              <SelectContent side="bottom">
                {ROLES.map((r) => (
                  <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => { onOpenChange(false); reset(); }}>{tCommon("cancel")}</Button>
          <Button
            disabled={!name || !email || !role || mutate.isPending}
            onClick={async () => {
              try {
                const res = await mutate.mutateAsync({ name, email, mobile: mobile || null, role });
                toast.success(`User berhasil dibuat. Temporary password: ${res.temporary_password}`);
                onCreated?.(res.temporary_password);
                reset();
                onOpenChange(false);
              } catch (e) {
                toast.error(e instanceof Error ? e.message : "Gagal membuat user.");
              }
            }}
          >
            {tCommon("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
