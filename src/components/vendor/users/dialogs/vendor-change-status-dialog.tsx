"use client";

import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { useChangeVendorUserStatus } from "@/hooks/use-vendor-users";
import type { VendorUser } from "@/lib/vendor/users-api";
import { toast } from "sonner";

type Props = { open: boolean; onOpenChange: (open: boolean) => void; target: VendorUser | null };

export function VendorChangeStatusDialog({ open, onOpenChange, target }: Props) {
  const tCommon = useTranslations("Vendor.common");
  const tAct = useTranslations("Vendor.users.actions");
  const mutate = useChangeVendorUserStatus();

  if (!target) return null;
  const next: "active" | "inactive" = target.status === "active" ? "inactive" : "active";
  const isLastAdmin = target.is_last_company_admin && target.primary_role === "vendor_company_admin" && next === "inactive";
  const isSelf = target.is_current_user && next === "inactive";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{tAct("changeStatus")}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-zinc-500">User: <span className="font-medium text-zinc-900">{target.name}</span></p>
        <p className="text-sm">
          Current status: <span className="font-medium">{target.status}</span> → New: <span className="font-medium">{next}</span>
        </p>
        {isSelf && (
          <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            Tidak dapat menonaktifkan akun sendiri.
          </p>
        )}
        {isLastAdmin && (
          <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            Tidak dapat menonaktifkan Company Admin terakhir. Aktifkan user lain sebagai admin dulu.
          </p>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{tCommon("cancel")}</Button>
          <Button
            disabled={isSelf || isLastAdmin || mutate.isPending}
            onClick={async () => {
              try {
                await mutate.mutateAsync({ id: target.id, status: next });
                toast.success("Status berhasil diubah.");
                onOpenChange(false);
              } catch (e) {
                toast.error(e instanceof Error ? e.message : "Gagal mengubah status.");
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
