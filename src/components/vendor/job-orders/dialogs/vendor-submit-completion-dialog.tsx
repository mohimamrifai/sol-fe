"use client";

import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useSubmitCompletion } from "@/hooks/use-vendor-job-orders";
import { toast } from "sonner";
import type { JobOrder } from "@/lib/vendor/job-orders-api";

type Props = {
  job: JobOrder;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function VendorSubmitCompletionDialog({ job, open, onOpenChange }: Props) {
  const tCommon = useTranslations("Vendor.common");
  const tDetail = useTranslations("Vendor.jobOrders.detail");
  const mutate = useSubmitCompletion();
  const [remark, setRemark] = useState("");
  const [files, setFiles] = useState<FileList | null>(null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{tDetail("submitCompletion")}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div>
            <Label className="text-sm">{tDetail("completionRemark")}</Label>
            <Textarea
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              rows={4}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-sm">Final Attachments (opsional)</Label>
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
            disabled={!remark || mutate.isPending}
            onClick={async () => {
              try {
                const fd = new FormData();
                fd.append("completion_remark", remark);
                if (files) {
                  Array.from(files).forEach((f) => fd.append("final_attachments[]", f));
                }
                await mutate.mutateAsync({ id: job.id, payload: fd });
                toast.success("Penyelesaian berhasil diajukan.");
                setRemark("");
                setFiles(null);
                onOpenChange(false);
              } catch (e) {
                const msg = e instanceof Error ? e.message : "Gagal submit completion.";
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
