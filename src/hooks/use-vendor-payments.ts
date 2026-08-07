import { useQuery } from "@tanstack/react-query";
import {
  fetchVendorPayment,
  fetchVendorPaymentStats,
  fetchVendorPayments,
  type VendorPayment,
  type VendorPaymentListResponse,
  type VendorPaymentStats,
} from "@/lib/vendor/payments-api";

export function useVendorPayments(params: Record<string, unknown> = {}) {
  return useQuery<VendorPaymentListResponse>({
    queryKey: ["vendor", "payments", "list", params],
    queryFn: () => fetchVendorPayments(params),
    staleTime: 30 * 1000,
  });
}

export function useVendorPaymentStats() {
  return useQuery<{ data: VendorPaymentStats }>({
    queryKey: ["vendor", "payments", "stats"],
    queryFn: fetchVendorPaymentStats,
    staleTime: 30 * 1000,
  });
}

export function useVendorPayment(id: number) {
  return useQuery({
    queryKey: ["vendor", "payments", "detail", id],
    queryFn: () => fetchVendorPayment(id),
    enabled: !!id,
  });
}

export type { VendorPayment, VendorPaymentStats };
