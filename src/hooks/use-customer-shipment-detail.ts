"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { downloadBlob } from "@/lib/download-blob";
import { ApiError } from "@/lib/api-client";

export const CUSTOMER_SHIPMENT_KEY = ["customer", "shipment", "detail"] as const;

export function useCustomerShipmentDetail(shipmentId: number | string | null) {
  return useQuery({
    queryKey: [...CUSTOMER_SHIPMENT_KEY, String(shipmentId ?? "")],
    queryFn: async ({ signal }) => {
      if (!shipmentId) throw new Error("missing-id");
      const res = await apiFetch<{ data: Record<string, unknown> }>(
        `/customer/shipments/${shipmentId}`,
        { method: "GET", signal }
      );
      return res.data;
    },
    enabled: !!shipmentId,
  });
}

export async function downloadCustomerConsignmentNotePdf(shipmentId: number | string) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
  const token = typeof window !== "undefined" ? localStorage.getItem("sol_token") : null;
  const url = `${baseUrl}/api/customer/shipments/${shipmentId}/consignment-note-pdf`;
  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}`, Accept: "application/pdf" } : { Accept: "application/pdf" },
    credentials: "include",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new ApiError(text || res.statusText, res.status);
  }
  const blob = await res.blob();
  const filename = `consignment-note-${shipmentId}.pdf`;
  downloadBlob(blob, filename);
  return blob;
}
