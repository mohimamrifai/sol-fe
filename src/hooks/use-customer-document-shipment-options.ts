"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchCustomerDocumentShipmentOptions } from "@/lib/customer-api";
import type { DocumentShipmentOption } from "@/lib/document-types";

export const DOCUMENT_SHIPMENT_OPTIONS_KEY = ["customer", "documents", "shipment-options"] as const;

export function useCustomerDocumentShipmentOptions() {
  return useQuery({
    queryKey: DOCUMENT_SHIPMENT_OPTIONS_KEY,
    queryFn: async (): Promise<DocumentShipmentOption[]> => {
      const res = await fetchCustomerDocumentShipmentOptions();
      return (res.data ?? []) as DocumentShipmentOption[];
    },
    staleTime: 60_000,
  });
}
