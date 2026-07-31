"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchCustomerShipments } from "@/lib/customer-api";
import type { ListQueryParams } from "@/lib/list-query";
import type { ShipmentFiltersValue } from "@/components/shipments/shipment-filters";

export const SHIPMENTS_LIST_KEY = ["customer", "shipments", "list"] as const;

export function buildShipmentListParams(
  filters: ShipmentFiltersValue,
  page: number,
  perPage: number
): ListQueryParams {
  return {
    page,
    perPage,
    search: filters.search || undefined,
    status: filters.status || undefined,
    serviceType: filters.serviceType || undefined,
    shipmentCoverage: filters.shipmentCoverage || undefined,
    originLocationId: filters.originLocationId ?? undefined,
    destinationLocationId: filters.destinationLocationId ?? undefined,
    shipmentDateFrom: filters.shipmentDateFrom || undefined,
    shipmentDateTo: filters.shipmentDateTo || undefined,
  };
}

export function useCustomerShipmentsList(
  filters: ShipmentFiltersValue,
  page: number,
  perPage: number
) {
  return useQuery({
    queryKey: [...SHIPMENTS_LIST_KEY, buildShipmentListParams(filters, page, perPage)],
    queryFn: ({ signal }) => fetchCustomerShipments(buildShipmentListParams(filters, page, perPage), signal),
    placeholderData: (prev) => prev,
  });
}
