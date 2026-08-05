"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createCustomerLocation,
  updateCustomerLocation,
  changeCustomerLocationStatus,
} from "@/lib/customer-api";
import { LOCATIONS_LIST_KEY } from "./use-customer-locations-list";
import { LOCATION_DETAIL_KEY } from "./use-customer-location-detail";

export function useCreateLocation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => createCustomerLocation(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: [...LOCATIONS_LIST_KEY] }),
  });
}

export function useUpdateLocation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Record<string, unknown> }) =>
      updateCustomerLocation(id, payload),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: [...LOCATIONS_LIST_KEY] });
      qc.invalidateQueries({ queryKey: [...LOCATION_DETAIL_KEY, vars.id] });
    },
  });
}

export function useChangeLocationStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: "active" | "inactive" }) =>
      changeCustomerLocationStatus(id, status),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: [...LOCATIONS_LIST_KEY] });
      qc.invalidateQueries({ queryKey: [...LOCATION_DETAIL_KEY, vars.id] });
    },
  });
}
