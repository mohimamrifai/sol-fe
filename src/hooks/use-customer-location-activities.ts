"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchCustomerLocationActivities } from "@/lib/customer-api";
import type { ListQueryParams } from "@/lib/list-query";

export const LOCATION_ACTIVITIES_KEY = ["customer", "location", "activities"] as const;

export function useCustomerLocationActivities(
  id: number | null,
  input?: ListQueryParams
) {
  return useQuery({
    queryKey: [...LOCATION_ACTIVITIES_KEY, id, input],
    queryFn: () => fetchCustomerLocationActivities(id as number, input),
    enabled: typeof id === "number" && id > 0,
  });
}
