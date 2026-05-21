import { useState } from "react";
import { createAdminBranch, updateAdminBranch, deleteAdminBranch } from "@/lib/admin-api";
import { ApiError } from "@/lib/api-client";
import { toast } from "sonner";
import type { Row } from "../types";
import type { AdminCustomerCapabilities } from "@/lib/admin-customer-capabilities";

export function useBranchManagement(
  companyId: number | null,
  capabilities: AdminCustomerCapabilities,
  onRefresh: () => void
) {
  const [branchOpen, setBranchOpen] = useState(false);
  const [branchEdit, setBranchEdit] = useState<Row | null>(null);
  const [bName, setBName] = useState("");
  const [bAddr, setBAddr] = useState("");
  const [bCity, setBCity] = useState("");
  const [bPhone, setBPhone] = useState("");
  const [bPic, setBPic] = useState("");
  const [bActive, setBActive] = useState(true);
  const [savingBranch, setSavingBranch] = useState(false);

  const [deleteBranch, setDeleteBranch] = useState<Row | null>(null);
  const [delLoading, setDelLoading] = useState(false);

  const openBranch = (row?: Row) => {
    if (row) {
      setBranchEdit(row);
      setBName(String(row.name ?? ""));
      setBAddr(String(row.address ?? ""));
      setBCity(String(row.city ?? ""));
      setBPhone(String(row.phone ?? ""));
      setBPic(String(row.contact_person ?? ""));
      setBActive(row.is_active !== false);
    } else {
      setBranchEdit(null);
      setBName("");
      setBAddr("");
      setBCity("");
      setBPhone("");
      setBPic("");
      setBActive(true);
    }
    setBranchOpen(true);
  };

  const saveBranch = async () => {
    if (!capabilities.canManageBranches || companyId == null) return;
    setSavingBranch(true);
    try {
      const body = {
        name: bName.trim(),
        address: bAddr.trim() || null,
        city: bCity.trim() || null,
        phone: bPhone.trim() || null,
        contact_person: bPic.trim() || null,
        is_active: bActive,
      };
      if (branchEdit?.id != null) {
        await updateAdminBranch(companyId, Number(branchEdit.id), body);
        toast.success("Cabang berhasil diperbarui.");
      } else {
        await createAdminBranch(companyId, body);
        toast.success("Cabang berhasil ditambahkan.");
      }
      setBranchOpen(false);
      onRefresh();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Gagal menyimpan cabang.");
    } finally {
      setSavingBranch(false);
    }
  };

  const handleDeleteBranch = async () => {
    if (companyId == null || deleteBranch?.id == null) return;
    setDelLoading(true);
    try {
      await deleteAdminBranch(companyId, Number(deleteBranch.id));
      toast.success("Cabang berhasil dihapus.");
      setDeleteBranch(null);
      onRefresh();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Gagal menghapus.");
    } finally {
      setDelLoading(false);
    }
  };

  return {
    branchOpen, setBranchOpen,
    branchEdit,
    branchFields: { bName, bAddr, bCity, bPhone, bPic, bActive },
    branchSetters: { setBName, setBAddr, setBCity, setBPhone, setBPic, setBActive },
    savingBranch,
    openBranch,
    saveBranch,
    deleteBranch, setDeleteBranch,
    delLoading,
    handleDeleteBranch
  };
}
