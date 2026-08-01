"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchCustomerInvoice } from "@/lib/customer-api";
import type { CustomerInvoiceDetail } from "@/lib/invoice-types";

export function useCustomerInvoiceDetail(invoiceId: number) {
  return useQuery({
    queryKey: ["customer", "invoices", "detail", invoiceId] as const,
    queryFn: async (): Promise<CustomerInvoiceDetail> => {
      const res = await fetchCustomerInvoice(invoiceId);
      return res.data as unknown as CustomerInvoiceDetail;
    },
  });
}
