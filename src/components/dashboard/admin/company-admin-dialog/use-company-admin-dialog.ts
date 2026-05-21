import { useCallback, useEffect, useState } from "react";
import { fetchAdminCompany } from "@/lib/admin-api";
import { ApiError } from "@/lib/api-client";
import type { AdminCustomerCapabilities } from "@/lib/admin-customer-capabilities";
import type { CompanyDialogMode, Row } from "./types";

import { useCompanyForm } from "./hooks/use-company-form";
import { useBranchManagement } from "./hooks/use-branch-management";
import { useDiscountManagement } from "./hooks/use-discount-management";
import { useCompanyApproval } from "./hooks/use-company-approval";

type Params = {
  open: boolean;
  mode: CompanyDialogMode;
  companyId: number | null;
  onSaved: () => void;
  onOpenChange: (open: boolean) => void;
  capabilities: AdminCustomerCapabilities;
};

export function useCompanyAdminDialog(params: Params) {
  const { open, mode, companyId, onSaved, onOpenChange, capabilities } = params;
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<Row | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadDetail = useCallback(async () => {
    if (mode !== "detail" || companyId == null) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetchAdminCompany(companyId);
      const d = (res as { data: Row }).data;
      setDetail(d);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Gagal memuat data.");
      setDetail(null);
    } finally {
      setLoading(false);
    }
  }, [mode, companyId]);

  useEffect(() => {
    if (open && mode === "detail" && companyId != null) {
      void loadDetail();
    } else if (open && mode === "create") {
      setDetail(null);
      setError(null);
    }
  }, [open, mode, companyId, loadDetail]);

  const companyForm = useCompanyForm(mode, companyId, capabilities, onSaved, onOpenChange, detail);
  const branches = useBranchManagement(companyId, capabilities, loadDetail);
  const discounts = useDiscountManagement(companyId, capabilities, loadDetail, open);
  const approval = useCompanyApproval(companyId, loadDetail);

  const branchesList = (detail?.branches as Row[] | undefined) ?? (detail?.Branches as Row[] | undefined) ?? [];
  const discountsList = (detail?.customer_discounts as Row[] | undefined) ?? (detail?.customerDiscounts as Row[] | undefined) ?? [];

  return {
    loading,
    detail,
    error: error || companyForm.error,
    setError: companyForm.setError,
    
    // Company basic info
    ...companyForm.fields,
    ...companyForm.setters,
    saving: companyForm.saving,
    saveCompany: companyForm.saveCompany,
    companyFieldsReadOnly: companyForm.isReadOnly,

    // Approval
    ...approval,

    // Branches
    ...branches.branchFields,
    ...branches.branchSetters,
    ...branches, // Includes openBranch, saveBranch, deleteBranch status, etc.
    branches: branchesList,

    // Discounts
    ...discounts.discFields,
    ...discounts.discSetters,
    ...discounts, // Includes openDisc, saveDisc, deleteDisc status, etc.
    discounts: discountsList,

    st: String(detail?.status ?? ""),
  };
}
