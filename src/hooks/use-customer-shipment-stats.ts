"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchCustomerShipmentStats } from "@/lib/customer-api";

export const SHIPMENT_STATS_KEY = ["customer", "shipments", "stats"] as const;

export function useCustomerShipmentStats() {
  return useQuery({
    queryKey: SHIPMENT_STATS_KEY,
    queryFn: async () => {
      const res = await fetchCustomerShipmentStats();
      return res.data ?? { planning: 0, in_progress: 0, completed: 0, cancelled: 0 };
    },
    staleTime: 30_000,
  });
}
