"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { customerStatusBadgeClass, customerStatusLabelFromApi } from "@/lib/customer-status";
import { RejectDialog } from "@/components/dashboard/admin/company-admin-dialog/reject-dialog";
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
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const handleApprove = async () => {
    setApproving(true);
    try {
      await approveAdminCompany(companyId);
      toast.success("Customer disetujui dan diaktifkan.");
      await onRefresh();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Gagal menyetujui customer.");
    } finally {
      setApproving(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return;
    setRejecting(true);
    try {
      await rejectAdminCompany(companyId, rejectReason.trim());
      toast.success("Customer ditolak.");
      setRejectOpen(false);
      setRejectReason("");
      await onRefresh();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Gagal menolak customer.");
    } finally {
      setRejecting(false);
    }
  };

  if (!canApproveReject) return null;

  const lowerStatus = status.toLowerCase();
  // Reject (set status='rejected') is only valid during registration review (status=pending).
  // An already-active company is deactivated via a separate flow (not in registration spec).
  const isPending = lowerStatus === "pending";
  const isActive = lowerStatus === "active";

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
          {!isActive ? (
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
          {isPending ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="gap-1.5"
              disabled={approving || rejecting}
              onClick={() => setRejectOpen(true)}
            >
              {rejecting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <XCircle className="h-3.5 w-3.5" />
              )}
              {rejecting ? "Menolak…" : "Tolak"}
            </Button>
          ) : null}
        </div>
      </div>

      <RejectDialog
        open={rejectOpen}
        onOpenChange={(o) => {
          setRejectOpen(o);
          if (!o) setRejectReason("");
        }}
        rejectReason={rejectReason}
        setRejectReason={setRejectReason}
        rejectSaving={rejecting}
        onSubmit={() => void handleReject()}
      />
    </>
  );
}
