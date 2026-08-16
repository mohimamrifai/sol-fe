"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useTranslations } from "next-intl";
import { useRejectJobOrder } from "@/hooks/use-vendor-job-orders";
import { toast } from "sonner";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobOrderId: number;
  onSuccess?: () => void;
};

export function VendorRejectJobDialog({
  open,
  onOpenChange,
  jobOrderId,
  onSuccess,
}: Props) {
  const t = useTranslations("Vendor.jobOrders.detail.rejectDialog");
  const tCommon = useTranslations("Vendor.common");
  const reject = useRejectJobOrder();
  const [reason, setReason] = useState("");

  const handleSubmit = async () => {
    try {
      await reject.mutateAsync({ id: jobOrderId, reason: reason || undefined });
      toast.success(t("success"));
      setReason("");
      onOpenChange(false);
      onSuccess?.();
    } catch {
      toast.error(tCommon("error"));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-zinc-600">{t("description")}</p>
        <div className="grid gap-2">
          <Label htmlFor="reject-reason">{t("reasonLabel")}</Label>
          <Textarea
            id="reject-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t("reasonPlaceholder")}
            rows={3}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {tCommon("cancel")}
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={reject.isPending}
          >
            {t("confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
