"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Key, Loader2, Eye, EyeOff } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/api-client";
import { firstLaravelError } from "@/lib/laravel-errors";
import { useResetUserPassword } from "@/hooks/use-customer-users-form";
import type { UserRow } from "./user-table";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  target: UserRow | null;
}

export function ResetPasswordDialog({ open, onOpenChange, target }: Props) {
  const t = useTranslations("Users");
  const reset = useResetUserPassword();
  const [password, setPassword] = React.useState("");
  const [show, setShow] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setPassword("");
      setShow(false);
    }
  }, [open]);

  const handleConfirm = async () => {
    if (!target) return;
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    try {
      await reset.mutateAsync({ id: target.id, password });
      toast.success("Password reset.");
      onOpenChange(false);
    } catch (e) {
      const msg = e instanceof ApiError && e.status === 422 ? firstLaravelError(e.body) ?? e.message : e instanceof ApiError ? e.message : "Failed.";
      toast.error(msg);
    }
  };

  if (!target) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            {t("dialogs.resetPassword.title")}
          </DialogTitle>
          <DialogDescription>
            Reset password for <span className="font-medium text-zinc-900">{target.name}</span>.
            They will need to use this new password on their next login.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-2">
          <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            {t("dialogs.resetPassword.newPassword")} <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <Input
              type={show ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 8 characters"
              className="h-10 pr-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="absolute right-0 top-0 h-10 w-10"
              onClick={() => setShow((s) => !s)}
            >
              {show ? <EyeOff className="h-4 w-4 text-zinc-500" /> : <Eye className="h-4 w-4 text-zinc-500" />}
            </Button>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={reset.isPending}>
            {t("common.cancel")}
          </Button>
          <Button onClick={() => void handleConfirm()} disabled={reset.isPending || password.length < 8} className="gap-2">
            {reset.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Key className="h-4 w-4" />}
            {t("dialogs.resetPassword.submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
