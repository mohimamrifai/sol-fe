"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { customerStatusBadgeClass, customerStatusLabelFromApi } from "@/lib/customer-status";
import { ConfirmDeleteDialog } from "@/components/dashboard/admin/confirm-delete-dialog";
import { approveAdminCompany, rejectAdminCompany } from "@/lib/admin-api";
import { toast } from "sonner";
import { ApiError } from "@/lib/api-client";

interface StatusManagerSectionProps {
  companyId: number;
  status: string;
  canApproveReject: boolean;
  onRefresh: () => Promise<void>;
}

export function StatusManagerSection({
  companyId,
  status,
  canApproveReject,
  onRefresh,
}: StatusManagerSectionProps) {
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [rejectConfirmOpen, setRejectConfirmOpen] = useState(false);

  const handleApprove = async () => {
    setApproving(true);
    try {
      await approveAdminCompany(companyId);
      toast.success("Customer diaktifkan.");
      await onRefresh();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Gagal mengaktifkan customer.");
    } finally {
      setApproving(false);
    }
  };

  const handleReject = async () => {
    setRejecting(true);
    try {
      await rejectAdminCompany(companyId, "Ditolak oleh admin.");
      toast.success("Customer dinonaktifkan.");
      setRejectConfirmOpen(false);
      await onRefresh();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Gagal menonaktifkan customer.");
    } finally {
      setRejecting(false);
    }
  };

  if (!canApproveReject) return null;

  const lowerStatus = status.toLowerCase();

  return (
    <>
      <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-muted/30 p-3">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium text-muted-foreground">Status:</span>
          <Badge variant="outline" className={customerStatusBadgeClass(lowerStatus)}>
            {customerStatusLabelFromApi(lowerStatus)}
          </Badge>
        </div>
        <div className="ml-auto flex gap-2">
          {lowerStatus !== "active" ? (
            <Button
              type="button"
              size="sm"
              className="gap-1.5"
              disabled={approving || rejecting}
              onClick={() => void handleApprove()}
            >
              {approving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5" />
              )}
              {approving ? "Mengaktifkan…" : "Aktifkan"}
            </Button>
          ) : null}
          {lowerStatus !== "inactive" ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="gap-1.5"
              disabled={approving || rejecting}
              onClick={() => setRejectConfirmOpen(true)}
            >
              {rejecting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <XCircle className="h-3.5 w-3.5" />
              )}
              {rejecting ? "Menonaktifkan…" : "Nonaktifkan"}
            </Button>
          ) : null}
        </div>
      </div>

      <ConfirmDeleteDialog
        open={rejectConfirmOpen}
        onOpenChange={setRejectConfirmOpen}
        title="Nonaktifkan customer?"
        description="Apakah Anda yakin ingin menonaktifkan customer ini? Semua user terkait juga akan dinonaktifkan."
        confirmLabel="Nonaktifkan"
        loadingLabel="Menonaktifkan…"
        loading={rejecting}
        onConfirm={() => void handleReject()}
      />
    </>
  );
}
