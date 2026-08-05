"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchCustomerLocation } from "@/lib/customer-api";

export const LOCATION_DETAIL_KEY = ["customer", "location"] as const;

export function useCustomerLocationDetail(id: number | null) {
  return useQuery({
    queryKey: [...LOCATION_DETAIL_KEY, id],
    queryFn: () => fetchCustomerLocation(id as number),
    enabled: typeof id === "number" && id > 0,
  });
}
