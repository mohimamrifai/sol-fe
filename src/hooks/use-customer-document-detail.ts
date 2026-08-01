"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchCustomerDocument } from "@/lib/customer-api";
import type { DocumentDetail } from "@/lib/document-types";

export const CUSTOMER_DOCUMENT_KEY = ["customer", "document", "detail"] as const;

export function useCustomerDocumentDetail(id: string | null) {
  return useQuery({
    queryKey: [...CUSTOMER_DOCUMENT_KEY, id ?? ""],
    queryFn: async (): Promise<DocumentDetail> => {
      if (!id) throw new Error("missing-id");
      const res = await fetchCustomerDocument(id);
      return res.data as unknown as DocumentDetail;
    },
    enabled: !!id,
  });
}
