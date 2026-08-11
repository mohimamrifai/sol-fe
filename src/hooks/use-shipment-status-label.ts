"use client";

import { useTranslations } from "next-intl";
import { useCallback } from "react";
import { resolveShipmentStatusLabel } from "@/lib/shipment-status-i18n";

/** Locale-aware shipment status labels for admin + customer UIs. */
export function useShipmentStatusLabel() {
  const tAdmin = useTranslations("AdminCommon.status.shipment");
  const tTracking = useTranslations("Shipments.trackingStatus");

  return useCallback(
    (status: string) => resolveShipmentStatusLabel(status, tAdmin, tTracking),
    [tAdmin, tTracking]
  );
}
