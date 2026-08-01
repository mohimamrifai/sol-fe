"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchCustomerDocuments } from "@/lib/customer-api";
import type { ListQueryParams } from "@/lib/list-query";

export interface DocumentFiltersValue {
  search: string;
  type: string;
  shipmentId: number | null;
  dateFrom: string;
  dateTo: string;
}

export const DOCUMENT_FILTER_DEFAULTS: DocumentFiltersValue = {
  search: "",
  type: "",
  shipmentId: null,
  dateFrom: "",
  dateTo: "",
};

export const DOCUMENTS_LIST_KEY = ["customer", "documents", "list"] as const;

export function buildDocumentListParams(
  filters: DocumentFiltersValue,
  page: number,
  perPage: number
): ListQueryParams {
  return {
    page,
    perPage,
    search: filters.search || undefined,
    documentBucket: filters.type || undefined,
    shipmentId: filters.shipmentId ?? undefined,
    uploadDateFrom: filters.dateFrom || undefined,
    uploadDateTo: filters.dateTo || undefined,
  };
}

export function useCustomerDocumentsList(
  filters: DocumentFiltersValue,
  page: number,
  perPage: number
) {
  return useQuery({
    queryKey: [...DOCUMENTS_LIST_KEY, buildDocumentListParams(filters, page, perPage)],
    queryFn: () => fetchCustomerDocuments(buildDocumentListParams(filters, page, perPage)),
    placeholderData: (prev) => prev,
  });
}
