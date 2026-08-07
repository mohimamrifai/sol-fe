import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createVendorInvoice,
  fetchEligibleJobOrders,
  fetchVendorInvoice,
  fetchVendorInvoiceStats,
  fetchVendorInvoices,
  submitVendorInvoice,
  updateVendorInvoice,
  type EligibleJobOrder,
  type VendorInvoice,
  type VendorInvoiceListResponse,
  type VendorInvoiceStats,
} from "@/lib/vendor/invoices-api";

export function useVendorInvoices(params: Record<string, unknown> = {}) {
  return useQuery<VendorInvoiceListResponse>({
    queryKey: ["vendor", "invoices", "list", params],
    queryFn: () => fetchVendorInvoices(params),
    staleTime: 30 * 1000,
  });
}

export function useVendorInvoiceStats() {
  return useQuery<{ data: VendorInvoiceStats }>({
    queryKey: ["vendor", "invoices", "stats"],
    queryFn: fetchVendorInvoiceStats,
    staleTime: 30 * 1000,
  });
}

export function useVendorInvoice(id: number) {
  return useQuery({
    queryKey: ["vendor", "invoices", "detail", id],
    queryFn: () => fetchVendorInvoice(id),
    enabled: !!id,
  });
}

export function useEligibleJobOrders() {
  return useQuery<{ data: EligibleJobOrder[] }>({
    queryKey: ["vendor", "invoices", "eligible"],
    queryFn: fetchEligibleJobOrders,
    staleTime: 30 * 1000,
  });
}

export function useCreateVendorInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: FormData) => createVendorInvoice(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vendor", "invoices"] });
      qc.invalidateQueries({ queryKey: ["vendor", "dashboard"] });
    },
  });
}

export function useUpdateVendorInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: FormData }) => updateVendorInvoice(id, payload),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ["vendor", "invoices"] });
      qc.invalidateQueries({ queryKey: ["vendor", "invoices", "detail", id] });
    },
  });
}

export function useSubmitVendorInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => submitVendorInvoice(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ["vendor", "invoices"] });
      qc.invalidateQueries({ queryKey: ["vendor", "invoices", "detail", id] });
    },
  });
}

export type { VendorInvoice };
