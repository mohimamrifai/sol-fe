"use client";

import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useChangeVendorUserRole } from "@/hooks/use-vendor-users";
import type { VendorUser } from "@/lib/vendor/users-api";
import { toast } from "sonner";

type Props = { open: boolean; onOpenChange: (open: boolean) => void; target: VendorUser | null };

const ROLES = [
  { value: "vendor_company_admin", label: "Vendor Company Admin" },
  { value: "vendor_ops_pic", label: "Vendor Ops PIC" },
  { value: "vendor_finance_pic", label: "Vendor Finance PIC" },
  { value: "vendor_viewer", label: "Vendor Viewer" },
];

export function VendorChangeRoleDialog({ open, onOpenChange, target }: Props) {
  const tCommon = useTranslations("Vendor.common");
  const tAct = useTranslations("Vendor.users.actions");
  const mutate = useChangeVendorUserRole();
  const [role, setRole] = useState("");

  useEffect(() => { if (target) setRole(target.primary_role); }, [target]);

  if (!target) return null;
  const isLastAdmin = target.is_last_company_admin && target.primary_role === "vendor_company_admin";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{tAct("changeRole")}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-zinc-500">User: <span className="font-medium text-zinc-900">{target.name}</span></p>
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
        {isLastAdmin && role !== "vendor_company_admin" && (
          <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            Tidak dapat mengubah role Company Admin terakhir. Aktifkan user lain sebagai admin dulu.
          </p>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{tCommon("cancel")}</Button>
          <Button
            disabled={!role || role === target.primary_role || (isLastAdmin && role !== "vendor_company_admin") || mutate.isPending}
            onClick={async () => {
              try {
                await mutate.mutateAsync({ id: target.id, role });
                toast.success("Role berhasil diubah.");
                onOpenChange(false);
              } catch (e) {
                toast.error(e instanceof Error ? e.message : "Gagal mengubah role.");
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
