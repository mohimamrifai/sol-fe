"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchCustomerUserActivities } from "@/lib/customer-api";

export const USER_ACTIVITIES_KEY = ["customer", "user", "activities"] as const;

export function useCustomerUserActivities(id: number | null) {
  return useQuery({
    queryKey: [...USER_ACTIVITIES_KEY, id],
    queryFn: () => fetchCustomerUserActivities(id as number),
    enabled: typeof id === "number" && id > 0,
  });
}
