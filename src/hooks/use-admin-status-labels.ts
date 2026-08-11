"use client";

import { useTranslations } from "next-intl";
import { useCallback } from "react";

function useScopedStatusLabel(scope: string) {
  const t = useTranslations(scope);
  return useCallback(
    (status: string) => {
      const k = status.toLowerCase().replace(/\s+/g, "_");
      return t.has(k) ? t(k) : status;
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

export { useShipmentStatusLabel } from "@/hooks/use-shipment-status-label";
