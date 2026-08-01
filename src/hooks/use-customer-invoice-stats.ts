"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchCustomerInvoiceStats } from "@/lib/customer-api";
import type { CustomerInvoiceStats } from "@/lib/invoice-types";

export const INVOICE_STATS_KEY = ["customer", "invoices", "stats"] as const;

export function useCustomerInvoiceStats() {
  return useQuery({
    queryKey: INVOICE_STATS_KEY,
    queryFn: async (): Promise<CustomerInvoiceStats> => {
      const res = await fetchCustomerInvoiceStats();
      return res.data ?? { draft: 0, issued: 0, partially_paid: 0, paid: 0, overdue: 0 };
    },
    staleTime: 30_000,
  });
}

