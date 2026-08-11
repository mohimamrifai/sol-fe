"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { customerStatusBadgeClass } from "@/lib/customer-status";
import { useCustomerStatusLabel } from "@/hooks/use-admin-status-labels";
import { RejectDialog } from "@/components/dashboard/admin/company-admin-dialog/reject-dialog";
import { approveAdminCompany, rejectAdminCompany, suspendAdminCompany } from "@/lib/admin-api";
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
  const t = useTranslations("AdminCustomers");
  const tc = useTranslations("AdminCommon");
  const customerStatusLabel = useCustomerStatusLabel();
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [suspending, setSuspending] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const handleApprove = async () => {
    setApproving(true);
    try {
      await approveAdminCompany(companyId);
      toast.success(t("toasts.approved"));
      await onRefresh();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : t("toasts.approveFailed"));
    } finally {
      setApproving(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return;
    setRejecting(true);
    try {
      await rejectAdminCompany(companyId, rejectReason.trim());
      toast.success(t("toasts.rejected"));
      setRejectOpen(false);
      setRejectReason("");
      await onRefresh();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : t("toasts.rejectFailed"));
    } finally {
      setRejecting(false);
    }
  };

  const handleSuspend = async () => {
    setSuspending(true);
    try {
      await suspendAdminCompany(companyId);
      toast.success(t("toasts.suspended"));
      await onRefresh();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : t("toasts.suspendFailed"));
    } finally {
      setSuspending(false);
    }
  };

  if (!canApproveReject) return null;

  const lowerStatus = status.toLowerCase();
  const isPending = lowerStatus === "pending";
  const isActive = lowerStatus === "active";
  const isSuspended = lowerStatus === "suspended";

  return (
    <>
      <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-muted/30 p-3">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium text-muted-foreground">{t("statusManager.status")}:</span>
          <Badge variant="outline" className={customerStatusBadgeClass(lowerStatus)}>
            {customerStatusLabel(lowerStatus)}
          </Badge>
        </div>
        <div className="ml-auto flex gap-2">
          {isActive ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="gap-1.5"
              disabled={approving || rejecting || suspending}
              onClick={() => void handleSuspend()}
            >
              {suspending ? tc("actions.suspending") : tc("actions.suspend")}
            </Button>
          ) : null}
          {!isActive && !isSuspended ? (
            <Button
              type="button"
              size="sm"
              className="gap-1.5"
              disabled={approving || rejecting || suspending}
              onClick={() => void handleApprove()}
            >
              {approving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5" />
              )}
              {approving ? tc("actions.activating") : t("statusManager.activate")}
            </Button>
          ) : null}
          {isPending ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="gap-1.5"
              disabled={approving || rejecting || suspending}
              onClick={() => setRejectOpen(true)}
            >
              {rejecting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <XCircle className="h-3.5 w-3.5" />
              )}
              {rejecting ? tc("actions.rejecting") : t("statusManager.reject")}
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
