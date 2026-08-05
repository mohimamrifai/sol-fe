"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchCustomerUser } from "@/lib/customer-api";

export const USER_DETAIL_KEY = ["customer", "user"] as const;

export function useCustomerUserDetail(id: number | null) {
  return useQuery({
    queryKey: [...USER_DETAIL_KEY, id],
    queryFn: () => fetchCustomerUser(id as number),
    enabled: typeof id === "number" && id > 0,
  });
}
