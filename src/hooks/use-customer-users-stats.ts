"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchCustomerUserStats } from "@/lib/customer-api";

export const USERS_STATS_KEY = ["customer", "users", "stats"] as const;

export function useCustomerUserStats() {
  return useQuery({
    queryKey: [...USERS_STATS_KEY],
    queryFn: () => fetchCustomerUserStats(),
  });
}
