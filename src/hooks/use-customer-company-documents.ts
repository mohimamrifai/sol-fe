"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchCustomerCompanyDocuments,
  uploadCustomerCompanyDocument,
  deleteCustomerCompanyDocument,
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

export function useDeleteCompanyDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteCustomerCompanyDocument(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [...COMPANY_DOCUMENTS_KEY] }),
  });
}
