"use client";

import { useTranslations } from "next-intl";
import { useCallback } from "react";

/** FSD customer portal: Draft, Submitted, Approved, Rejected (+ cancelled, converted). */
export function useCustomerBookingStatusLabel() {
  const t = useTranslations("Bookings.status");

  return useCallback(
    (status: string) => {
      const k = status.toLowerCase().replace(/\s+/g, "_");
      if (k === "under_review") return t("submitted");
      if (t.has(k)) return t(k);
      return status;
    },
    [t]
  );
}
