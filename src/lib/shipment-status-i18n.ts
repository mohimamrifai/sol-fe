import { shipmentStatusLabel as shipmentStatusLabelFallback } from "@/lib/shipment-status";

/** All operational + bucket shipment status keys (API values). */
export const SHIPMENT_TRACKING_STATUS_KEYS = [
  "booking_created",
  "created",
  "survey_completed",
  "cargo_received",
  "stuffing_container",
  "container_sealed",
  "train_departed",
  "departed",
  "train_arrived",
  "arrived",
  "container_unloading",
  "unloading",
  "ready_for_pickup",
  "planning",
  "in_progress",
  "ready_for_departure",
  "in_transit",
  "completed",
  "cancelled",
] as const;

export type ShipmentTrackingStatusKey = (typeof SHIPMENT_TRACKING_STATUS_KEYS)[number];

export function normalizeShipmentStatusKey(status: string): string {
  return status.toLowerCase().replace(/\s+/g, "_");
}

type StatusTranslator = {
  has: (key: string) => boolean;
  (key: string): string;
};

/**
 * Resolve a human-readable shipment status label using optional i18n scopes.
 * Falls back to English labels in `shipment-status.ts`, then title-cases snake_case.
 */
export function resolveShipmentStatusLabel(
  status: string,
  ...scopes: StatusTranslator[]
): string {
  const k = normalizeShipmentStatusKey(status);
  if (!k) return "—";

  for (const t of scopes) {
    if (t.has(k)) return t(k);
  }

  return shipmentStatusLabelFallback(k);
}
