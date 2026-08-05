"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { ShieldCheck, Loader2 } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ApiError } from "@/lib/api-client";
import { firstLaravelError } from "@/lib/laravel-errors";
import { useChangeUserRole } from "@/hooks/use-customer-users-form";
import type { UserRow } from "./user-table";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  target: UserRow | null;
}

const ROLES = ["company_admin", "ops_pic", "finance_pic", "viewer"];

export function ChangeRoleDialog({ open, onOpenChange, target }: Props) {
  const t = useTranslations("Users");
  const changeRole = useChangeUserRole();
  const [role, setRole] = React.useState("ops_pic");

  React.useEffect(() => {
    if (target) {
      setRole(target.role ?? target.roles?.[0]?.name ?? "ops_pic");
    }
  }, [target]);

  const handleConfirm = async () => {
    if (!target) return;
    try {
      await changeRole.mutateAsync({ id: target.id, role });
      toast.success("Role updated.");
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
            <ShieldCheck className="h-4 w-4" />
            {t("dialogs.changeRole.title")}
          </DialogTitle>
          <DialogDescription>
            Change role for <span className="font-medium text-zinc-900">{target.name}</span>
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-2">
          <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            {t("form.role")} <span className="text-red-500">*</span>
          </Label>
          <Select value={role} onValueChange={(v) => setRole(v ?? "ops_pic")}>
            <SelectTrigger className="h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent side="bottom">
              {ROLES.map((r) => (
                <SelectItem key={r} value={r}>
                  {t(`role.${r}` as `role.${string}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={changeRole.isPending}>
            {t("common.cancel")}
          </Button>
          <Button onClick={() => void handleConfirm()} disabled={changeRole.isPending} className="gap-2">
            {changeRole.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
