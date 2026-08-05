"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchCustomerCompanyCommercial } from "@/lib/customer-api";

export const COMPANY_COMMERCIAL_KEY = ["customer", "company", "commercial"] as const;

export function useCustomerCompanyCommercial() {
  return useQuery({
    queryKey: [...COMPANY_COMMERCIAL_KEY],
    queryFn: () => fetchCustomerCompanyCommercial(),
  });
}
