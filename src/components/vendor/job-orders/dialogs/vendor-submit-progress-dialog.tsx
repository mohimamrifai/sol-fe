"use client";

import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useSubmitProgress } from "@/hooks/use-vendor-job-orders";
import { toast } from "sonner";
import type { JobOrder } from "@/lib/vendor/job-orders-api";

type Props = {
  job: JobOrder;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function VendorSubmitProgressDialog({ job, open, onOpenChange }: Props) {
  const tCommon = useTranslations("Vendor.common");
  const tDetail = useTranslations("Vendor.jobOrders.detail");
  const mutate = useSubmitProgress();
  const [notes, setNotes] = useState("");
  const [files, setFiles] = useState<FileList | null>(null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{tDetail("submitProgress")}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div>
            <Label className="text-sm">{tDetail("progressNotes")}</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-sm">Attachments (opsional)</Label>
            <Input
              type="file"
              multiple
              accept="image/jpeg,image/png,application/pdf"
              onChange={(e) => setFiles(e.target.files)}
              className="mt-1"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{tCommon("cancel")}</Button>
          <Button
            disabled={!notes || mutate.isPending}
            onClick={async () => {
              try {
                const fd = new FormData();
                fd.append("progress_notes", notes);
                if (files) {
                  Array.from(files).forEach((f) => fd.append("attachments[]", f));
                }
                await mutate.mutateAsync({ id: job.id, payload: fd });
                toast.success("Progress berhasil dikirim.");
                setNotes("");
                setFiles(null);
                onOpenChange(false);
              } catch (e) {
                const msg = e instanceof Error ? e.message : "Gagal submit progress.";
                toast.error(msg);
              }
            }}
          >
            {tCommon("submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
