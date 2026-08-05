"use client";

import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Power, Loader2 } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api-client";
import { firstLaravelError } from "@/lib/laravel-errors";
import { useChangeUserStatus } from "@/hooks/use-customer-users-form";
import type { UserRow } from "./user-table";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  target: UserRow | null;
}

export function ChangeStatusDialog({ open, onOpenChange, target }: Props) {
  const t = useTranslations("Users");
  const changeStatus = useChangeUserStatus();

  const handleConfirm = async () => {
    if (!target) return;
    const next = target.status === "active" ? "inactive" : "active";
    try {
      await changeStatus.mutateAsync({ id: target.id, status: next as "active" | "inactive" });
      toast.success(`User ${next === "active" ? "activated" : "deactivated"}.`);
      onOpenChange(false);
    } catch (e) {
      const msg = e instanceof ApiError && e.status === 422 ? firstLaravelError(e.body) ?? e.message : e instanceof ApiError ? e.message : "Failed.";
      toast.error(msg);
    }
  };

  if (!target) return null;

  const willBeActive = target.status !== "active";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Power className="h-4 w-4" />
            {t("dialogs.changeStatus.title")}
          </DialogTitle>
          <DialogDescription>
            {willBeActive ? t("dialogs.changeStatus.active") : t("dialogs.changeStatus.inactive")}
            {" — "}
            <span className="font-medium text-zinc-900">{target.name}</span>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={changeStatus.isPending}>
            {t("common.cancel")}
          </Button>
          <Button onClick={() => void handleConfirm()} disabled={changeStatus.isPending} className="gap-2">
            {changeStatus.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Power className="h-4 w-4" />}
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
