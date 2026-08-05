"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchCustomerLocationStats } from "@/lib/customer-api";

export const LOCATIONS_STATS_KEY = ["customer", "locations", "stats"] as const;

export function useCustomerLocationStats() {
  return useQuery({
    queryKey: [...LOCATIONS_STATS_KEY],
    queryFn: () => fetchCustomerLocationStats(),
  });
}
