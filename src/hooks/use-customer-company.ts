"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchCustomerCompany } from "@/lib/customer-api";

export const COMPANY_KEY = ["customer", "company"] as const;

export function useCustomerCompany() {
  return useQuery({
    queryKey: [...COMPANY_KEY],
    queryFn: () => fetchCustomerCompany(),
  });
}
