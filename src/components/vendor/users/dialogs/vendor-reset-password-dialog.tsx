"use client";

import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useResetVendorUserPassword } from "@/hooks/use-vendor-users";
import type { VendorUser } from "@/lib/vendor/users-api";
import { Copy } from "lucide-react";
import { toast } from "sonner";

type Props = { open: boolean; onOpenChange: (open: boolean) => void; target: VendorUser | null };

export function VendorResetPasswordDialog({ open, onOpenChange, target }: Props) {
  const tCommon = useTranslations("Vendor.common");
  const tAct = useTranslations("Vendor.users.actions");
  const mutate = useResetVendorUserPassword();
  const [password, setPassword] = useState<string | null>(null);

  if (!target) return null;

  const handleReset = async () => {
    try {
      const res = await mutate.mutateAsync(target.id);
      setPassword(res.temporary_password);
      toast.success("Password berhasil di-reset.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal reset password.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) setPassword(null); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{tAct("resetPassword")}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-zinc-500">User: <span className="font-medium text-zinc-900">{target.name}</span></p>
        {password ? (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3">
            <p className="text-xs text-emerald-800">Password baru (salin & bagikan ke user):</p>
            <div className="mt-2 flex items-center gap-2">
              <code className="flex-1 rounded bg-white px-2 py-1 font-mono text-sm">{password}</code>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(password);
                  toast.success("Disalin ke clipboard.");
                }}
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm">Klik tombol di bawah untuk generate password baru. User perlu login dan ganti password setelah menerima.</p>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{tCommon("cancel")}</Button>
          {password ? null : (
            <Button disabled={mutate.isPending} onClick={handleReset}>
              {mutate.isPending ? "Membuat…" : "Reset Password"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
