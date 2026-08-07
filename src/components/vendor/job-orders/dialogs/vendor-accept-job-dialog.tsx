"use client";

import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { useAcceptJobOrder } from "@/hooks/use-vendor-job-orders";
import { toast } from "sonner";
import type { JobOrder } from "@/lib/vendor/job-orders-api";

type Props = {
  job: JobOrder;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function VendorAcceptJobDialog({ job, open, onOpenChange }: Props) {
  const tCommon = useTranslations("Vendor.common");
  const tDetail = useTranslations("Vendor.jobOrders.detail");
  const mutate = useAcceptJobOrder();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{tDetail("accept")}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-zinc-600">
          Apakah Anda yakin ingin menerima job order <strong>{job.jo_number}</strong>?
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{tCommon("cancel")}</Button>
          <Button
            disabled={mutate.isPending}
            onClick={async () => {
              try {
                await mutate.mutateAsync(job.id);
                toast.success("Job order berhasil diterima.");
                onOpenChange(false);
              } catch (e) {
                const msg = e instanceof Error ? e.message : "Gagal menerima job order.";
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
