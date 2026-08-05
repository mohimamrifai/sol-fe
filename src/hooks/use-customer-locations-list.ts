"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchCustomerLocations } from "@/lib/customer-api";
import type { ListQueryParams } from "@/lib/list-query";

export const LOCATIONS_LIST_KEY = ["customer", "locations", "list"] as const;

export function useCustomerLocationsList(input?: number | ListQueryParams) {
  return useQuery({
    queryKey: [...LOCATIONS_LIST_KEY, input],
    queryFn: () => fetchCustomerLocations(input),
    placeholderData: (prev) => prev,
  });
}
