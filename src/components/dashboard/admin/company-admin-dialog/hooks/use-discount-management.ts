import { useState, useEffect } from "react";
import { fetchAdminVendors, createAdminCustomerDiscount, updateAdminCustomerDiscount, deleteAdminCustomerDiscount } from "@/lib/admin-api";
import { ApiError } from "@/lib/api-client";
import type { LaravelPaginated } from "@/lib/types-api";
import { toast } from "sonner";
import type { Row } from "../types";
import type { AdminCustomerCapabilities } from "@/lib/admin-customer-capabilities";

export function useDiscountManagement(
  companyId: number | null,
  capabilities: AdminCustomerCapabilities,
  onRefresh: () => void,
  open: boolean
) {
  const [discOpen, setDiscOpen] = useState(false);
  const [discEdit, setDiscEdit] = useState<Row | null>(null);
  const [dVsId, setDVsId] = useState("");
  const [dType, setDType] = useState<"percentage" | "fixed">("percentage");
  const [dVal, setDVal] = useState("");
  const [dFrom, setDFrom] = useState("");
  const [dTo, setDTo] = useState("");
  const [dActive, setDActive] = useState(true);
  const [savingDisc, setSavingDisc] = useState(false);
  const [vendorServiceOptions, setVendorServiceOptions] = useState<{ id: number; label: string }[]>([]);

  const [deleteDisc, setDeleteDisc] = useState<Row | null>(null);
  const [delLoading, setDelLoading] = useState(false);

  useEffect(() => {
    if (!open || !discOpen) return;
    void (async () => {
      try {
        const res = await fetchAdminVendors({ page: 1, perPage: 100 });
        const paginated = res as LaravelPaginated<Row>;
        const vendors = paginated.data ?? [];
        const opts: { id: number; label: string }[] = [];
        for (const v of vendors) {
          const svs = (v.vendor_services ?? v.vendorServices) as Row[] | undefined;
          if (!Array.isArray(svs)) continue;
          const vn = String(v.name ?? v.code ?? "");
          for (const s of svs) {
            if (s.id == null) continue;
            opts.push({ id: Number(s.id), label: `${vn} — #${s.id}` });
          }
        }
        setVendorServiceOptions(opts);
      } catch {
        setVendorServiceOptions([]);
      }
    })();
  }, [open, discOpen]);

  const openDisc = (row?: Row) => {
    if (row) {
      setDiscEdit(row);
      const vs = row.vendor_service as { id?: number } | undefined;
      setDVsId(vs?.id != null ? String(vs.id) : "");
      setDType((row.discount_type as "percentage" | "fixed") ?? "percentage");
      setDVal(String(row.discount_value ?? ""));
      setDFrom(row.effective_from ? String(row.effective_from).slice(0, 10) : "");
      setDTo(row.effective_to ? String(row.effective_to).slice(0, 10) : "");
      setDActive(row.is_active !== false);
    } else {
      setDiscEdit(null);
      setDVsId("");
      setDType("percentage");
      setDVal("");
      setDFrom("");
      setDTo("");
      setDActive(true);
    }
    setDiscOpen(true);
  };

  const saveDisc = async () => {
    if (!capabilities.canManageDiscounts || companyId == null) return;
    setSavingDisc(true);
    try {
      const body: Record<string, unknown> = {
        vendor_service_id: dVsId && dVsId !== "__none__" ? Number(dVsId) : null,
        discount_type: dType,
        discount_value: Number(dVal) || 0,
        effective_from: dFrom || null,
        effective_to: dTo || null,
        is_active: dActive,
      };
      if (discEdit?.id != null) {
        await updateAdminCustomerDiscount(companyId, Number(discEdit.id), body);
        toast.success("Diskon berhasil diperbarui.");
      } else {
        await createAdminCustomerDiscount(companyId, body);
        toast.success("Diskon berhasil ditambahkan.");
      }
      setDiscOpen(false);
      onRefresh();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Gagal menyimpan diskon.");
    } finally {
      setSavingDisc(false);
    }
  };

  const handleDeleteDisc = async () => {
    if (companyId == null || deleteDisc?.id == null) return;
    setDelLoading(true);
    try {
      await deleteAdminCustomerDiscount(companyId, Number(deleteDisc.id));
      toast.success("Diskon berhasil dihapus.");
      setDeleteDisc(null);
      onRefresh();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Gagal menghapus.");
    } finally {
      setDelLoading(false);
    }
  };

  return {
    discOpen, setDiscOpen,
    discEdit,
    discFields: { dVsId, dType, dVal, dFrom, dTo, dActive },
    discSetters: { setDVsId, setDType, setDVal, setDFrom, setDTo, setDActive },
    savingDisc,
    vendorServiceOptions,
    openDisc,
    saveDisc,
    deleteDisc, setDeleteDisc,
    delLoading,
    handleDeleteDisc
  };
}
