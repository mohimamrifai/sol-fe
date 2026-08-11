"use client";

import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslations } from "next-intl";

const REJECT_REASON_KEYS = [
  "capacity",
  "routeUnavailable",
  "incompleteCargo",
  "prohibitedCargo",
  "other",
] as const;

interface BookingRejectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loading: boolean;
  onSubmit: (reason: string) => void;
}

export function BookingRejectDialog({
  open,
  onOpenChange,
  loading,
  onSubmit,
}: BookingRejectDialogProps) {
  const t = useTranslations("AdminBookings.rejectDialog");
  const tc = useTranslations("AdminCommon.actions");
  const [reasonType, setReasonType] = useState("");
  const [reasonOther, setReasonOther] = useState("");

  const reasonOptions = useMemo(
    () =>
      REJECT_REASON_KEYS.map((key) => ({
        key,
        label: key === "other" ? t("other") : t(`reasons.${key}` as "reasons.capacity"),
      })),
    [t]
  );

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setReasonType("");
      setReasonOther("");
    }
    onOpenChange(newOpen);
  };

  const isOther = reasonType === "other";
  const finalReason = isOther ? reasonOther : reasonOptions.find((r) => r.key === reasonType)?.label ?? "";
  const canSubmit = finalReason.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="reject-reason-type">{t("reasonLabel")}</Label>
            <Select value={reasonType} onValueChange={(v) => setReasonType(v || "")} disabled={loading}>
              <SelectTrigger id="reject-reason-type" className="w-full">
                <SelectValue placeholder={t("selectPlaceholder")} />
              </SelectTrigger>
              <SelectContent className="w-full">
                {reasonOptions.map(({ key, label }) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isOther ? (
            <div className="space-y-2">
              <Label htmlFor="reject-reason-other">{t("otherLabel")}</Label>
              <Input
                id="reject-reason-other"
                placeholder={t("otherPlaceholder")}
                value={reasonOther}
                onChange={(e) => setReasonOther(e.target.value)}
                disabled={loading}
              />
            </div>
          ) : null}
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={loading}>
            {tc("cancel")}
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={!canSubmit || loading}
            onClick={() => onSubmit(finalReason.trim())}
          >
            {loading ? tc("saving") : tc("reject")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
