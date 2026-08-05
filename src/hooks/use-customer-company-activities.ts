"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchCustomerCompanyActivities } from "@/lib/customer-api";
import type { ListQueryParams } from "@/lib/list-query";

export const COMPANY_ACTIVITIES_KEY = ["customer", "company", "activities"] as const;

export function useCustomerCompanyActivities(input?: number | ListQueryParams) {
  return useQuery({
    queryKey: [...COMPANY_ACTIVITIES_KEY, input],
    queryFn: () => fetchCustomerCompanyActivities(input),
  });
}
