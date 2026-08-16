"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchCustomerUserActivities } from "@/lib/customer-api";
import type { ListQueryParams } from "@/lib/list-query";

export const USER_ACTIVITIES_KEY = ["customer", "user", "activities"] as const;

export function useCustomerUserActivities(
  id: number | null,
  input?: ListQueryParams
) {
  return useQuery({
    queryKey: [...USER_ACTIVITIES_KEY, id, input],
    queryFn: () => fetchCustomerUserActivities(id as number, input),
    enabled: typeof id === "number" && id > 0,
  });
}
