"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateCustomerCompany } from "@/lib/customer-api";
import { COMPANY_KEY } from "./use-customer-company";

export function useUpdateCustomerCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => updateCustomerCompany(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: [...COMPANY_KEY] }),
  });
}
