"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchCustomerLocationActivities } from "@/lib/customer-api";

export const LOCATION_ACTIVITIES_KEY = ["customer", "location", "activities"] as const;

export function useCustomerLocationActivities(id: number | null) {
  return useQuery({
    queryKey: [...LOCATION_ACTIVITIES_KEY, id],
    queryFn: () => fetchCustomerLocationActivities(id as number),
    enabled: typeof id === "number" && id > 0,
  });
}
