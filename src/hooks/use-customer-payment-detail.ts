"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchCustomerPayment } from "@/lib/customer-api";

export function customerPaymentDetailQueryKey(paymentId: number) {
  return ["customer", "payments", "detail", paymentId] as const;
}

export function useCustomerPaymentDetail(paymentId: number | null) {
  return useQuery({
    queryKey: customerPaymentDetailQueryKey(paymentId ?? 0),
    queryFn: () => fetchCustomerPayment(paymentId as number),
    enabled: paymentId != null && paymentId > 0,
    staleTime: 15_000,
  });
}
