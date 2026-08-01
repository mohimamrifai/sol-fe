"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchCustomerDocumentStats } from "@/lib/customer-api";
import type { DocumentStats } from "@/lib/document-types";

export const DOCUMENT_STATS_KEY = ["customer", "documents", "stats"] as const;

export function useCustomerDocumentStats() {
  return useQuery({
    queryKey: DOCUMENT_STATS_KEY,
    queryFn: async (): Promise<DocumentStats> => {
      const res = await fetchCustomerDocumentStats();
      return res.data ?? { total: 0, booking: 0, shipment: 0, billing: 0 };
    },
    staleTime: 30_000,
  });
}
