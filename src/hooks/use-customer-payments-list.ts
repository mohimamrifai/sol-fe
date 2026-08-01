"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchCustomerPayments } from "@/lib/customer-api";
import type { ListQueryParams } from "@/lib/list-query";

export function customerPaymentsListQueryKey(params?: ListQueryParams) {
  return ["customer", "payments", "list", params ?? {}] as const;
}

export function useCustomerPaymentsList(params?: ListQueryParams) {
  return useQuery({
    queryKey: customerPaymentsListQueryKey(params),
    queryFn: () => fetchCustomerPayments(params),
    staleTime: 15_000,
  });
}
