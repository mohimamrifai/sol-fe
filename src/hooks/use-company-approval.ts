import { useState } from "react";
import { approveAdminCompany, rejectAdminCompany } from "@/lib/admin-api";
import { ApiError } from "@/lib/api-client";
import { toast } from "sonner";

export function useCompanyApproval(
  companyId: number | null,
  onRefresh: () => void
) {
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectSaving, setRejectSaving] = useState(false);

  const submitReject = async () => {
    if (companyId == null || !rejectReason.trim()) return;
    setRejectSaving(true);
    try {
      await rejectAdminCompany(companyId, rejectReason.trim());
      setRejectOpen(false);
      setRejectReason("");
      onRefresh();
      toast.success("Registrasi customer ditolak.");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Gagal.");
    } finally {
      setRejectSaving(false);
    }
  };

  const approveCompany = async () => {
    if (companyId == null) return;
    try {
      await approveAdminCompany(companyId);
      onRefresh();
      toast.success("Customer disetujui.");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Gagal.");
    }
  };

  return {
    rejectOpen, setRejectOpen,
    rejectReason, setRejectReason,
    rejectSaving,
    submitReject,
    approveCompany
  };
}
