"use client";

import { useTranslations } from "next-intl";
import { useCallback } from "react";
import { humanizeSnakeCase } from "@/lib/format-label";

function useScopedStatusLabel(scope: string) {
  const t = useTranslations(scope);
  return useCallback(
    (status: string) => {
      const k = status.toLowerCase().replace(/\s+/g, "_");
      if (t.has(k)) return t(k);
      return k.includes("_") ? humanizeSnakeCase(k) : status;
    },
    [t]
  );
}

export function useCustomerStatusLabel() {
  return useScopedStatusLabel("AdminCommon.status.customer");
}

export function useBookingStatusLabel() {
  return useScopedStatusLabel("AdminCommon.status.booking");
}

export function useInvoiceStatusLabel() {
  return useScopedStatusLabel("AdminCommon.status.invoice");
}

export function usePaymentStatusLabel() {
  return useScopedStatusLabel("AdminCommon.status.payment");
}

export function useVendorInvoiceStatusLabel() {
  return useScopedStatusLabel("AdminCommon.status.vendorInvoice");
}

export function useVendorPaymentStatusLabel() {
  return useScopedStatusLabel("AdminCommon.status.vendorPayment");
}

export function useVendorJobOrderStatusLabel() {
  return useScopedStatusLabel("AdminCommon.status.vendorJobOrder");
}

export { useShipmentStatusLabel } from "@/hooks/use-shipment-status-label";
