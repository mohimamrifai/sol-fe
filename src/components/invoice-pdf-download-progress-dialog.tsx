"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  blocking: boolean;
  /** `null` = indeterminate (server tanpa Content-Length) */
  progress: number | null;
  invoiceLabel: string;
};

export function InvoicePdfDownloadProgressDialog({
  open,
  onOpenChange,
  blocking,
  progress,
  invoiceLabel,
}: Props) {
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && blocking) return;
        onOpenChange(next);
      }}
    >
      <DialogContent showCloseButton={!blocking} className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Mengunduh PDF invoice</DialogTitle>
          <DialogDescription>
            Nomor invoice <span className="font-mono">{invoiceLabel}</span>. Proses unduhan sedang berjalan.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 pt-1">
          <Progress value={progress} className="w-full" />
          <p className="text-xs text-muted-foreground">
            {progress == null
              ? "Mengambil file… (progress tidak diketahui)"
              : progress >= 100
                ? "Menyelesai…"
                : `${progress}%`}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
