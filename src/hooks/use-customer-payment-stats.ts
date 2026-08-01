"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchCustomerPaymentStats } from "@/lib/customer-api";

export const paymentStatsQueryKey = ["customer", "payments", "stats"] as const;

export function useCustomerPaymentStats() {
  return useQuery({
    queryKey: paymentStatsQueryKey,
    queryFn: () => fetchCustomerPaymentStats(),
    staleTime: 30_000,
  });
}
