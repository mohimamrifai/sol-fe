"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchCustomerCompanyDocuments,
  uploadCustomerCompanyDocument,
} from "@/lib/customer-api";

export const COMPANY_DOCUMENTS_KEY = ["customer", "company", "documents"] as const;

export function useCustomerCompanyDocuments() {
  return useQuery({
    queryKey: [...COMPANY_DOCUMENTS_KEY],
    queryFn: () => fetchCustomerCompanyDocuments(),
  });
}

export function useUploadCompanyDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { type: string; label?: string; file: File }) =>
      uploadCustomerCompanyDocument(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: [...COMPANY_DOCUMENTS_KEY] }),
  });
}
