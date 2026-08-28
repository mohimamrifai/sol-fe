import {
  FSD_SHIPMENT_STATUSES,
  type FsdShipmentStatus,
  resolveFsdShipmentStatus,
} from "@/lib/shipment-fsd-status";

/**
 * Customer-facing shipment status (prompt.md L21-26, L35).
 * Backend sends the high-level bucket via `high_level_status` on the shipment.
 */
export const SHIPMENT_STATUS_KEYS = [
  "planning",
  "in_progress",
  "completed",
  "cancelled",
] as const;

export type ShipmentStatusKey = (typeof SHIPMENT_STATUS_KEYS)[number];

export const SHIPMENT_STATUS_BADGE: Record<ShipmentStatusKey, string> = {
  planning:
    "border-slate-200/90 bg-slate-100 text-slate-800 dark:border-slate-600 dark:bg-slate-800/55 dark:text-slate-200",
  in_progress:
    "border-sky-200/90 bg-sky-50 text-sky-900 dark:border-sky-800/60 dark:bg-sky-950/45 dark:text-sky-200",
  completed:
    "border-emerald-200/90 bg-emerald-50 text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-950/45 dark:text-emerald-300",
  cancelled:
    "border-red-200/90 bg-red-50 text-red-800 dark:border-red-800/60 dark:bg-red-950/45 dark:text-red-300",
};

const FALLBACK_LABEL: Record<string, string> = {
  booking_created: "Booking Created",
  created: "Created",
  survey_completed: "Survey Completed",
  cargo_received: "Cargo Received",
  stuffing_container: "Stuffing Container",
  container_sealed: "Container Sealed",
  train_departed: "Train Departed",
  departed: "Departed",
  train_arrived: "Train Arrived",
  arrived: "Arrived",
  container_unloading: "Container Unloading",
  unloading: "Unloading",
  ready_for_pickup: "Ready for Pickup",
  planning: "Planning",
  in_progress: "In Progress",
  ready_for_departure: "Ready for Departure",
  in_transit: "In Transit",
  completed: "Completed",
  cancelled: "Cancelled",
};

const CARD_LABEL_KEYS: Record<ShipmentStatusKey, string> = {
  planning: "card.planning",
  in_progress: "card.in_progress",
  completed: "card.completed",
  cancelled: "card.cancelled",
};

export function shipmentStatusCardLabelKey(status: string): string {
  const key = (SHIPMENT_STATUS_KEYS as readonly string[]).includes(status)
    ? (status as ShipmentStatusKey)
    : ("planning" as ShipmentStatusKey);
  return CARD_LABEL_KEYS[key];
}

/** Admin FSD badge colors (shipments.md §3.1–3.2). */
export const FSD_SHIPMENT_STATUS_BADGE: Record<FsdShipmentStatus, string> = {
  planning:
    "border-slate-200/90 bg-slate-100 text-slate-800 dark:border-slate-600 dark:bg-slate-800/55 dark:text-slate-200",
  ready_for_departure:
    "border-amber-200/90 bg-amber-50 text-amber-900 dark:border-amber-800/60 dark:bg-amber-950/45 dark:text-amber-200",
  in_transit:
    "border-sky-200/90 bg-sky-50 text-sky-900 dark:border-sky-800/60 dark:bg-sky-950/45 dark:text-sky-200",
  completed:
    "border-emerald-200/90 bg-emerald-50 text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-950/45 dark:text-emerald-300",
  cancelled:
    "border-red-200/90 bg-red-50 text-red-800 dark:border-red-800/60 dark:bg-red-950/45 dark:text-red-300",
};

export function fsdShipmentStatusBadgeClass(
  operationalStatus?: string | null,
  fsdStatus?: string | null
): string {
  const key = resolveFsdShipmentStatus(operationalStatus, fsdStatus);
  return FSD_SHIPMENT_STATUS_BADGE[key];
}

export function shipmentStatusBadgeClass(status: string): string {
  const normalized = (status ?? "").toLowerCase();
  if ((FSD_SHIPMENT_STATUSES as readonly string[]).includes(normalized)) {
    return FSD_SHIPMENT_STATUS_BADGE[normalized as FsdShipmentStatus];
  }
  const key = (SHIPMENT_STATUS_KEYS as readonly string[]).includes(status)
    ? (status as ShipmentStatusKey)
    : ("planning" as ShipmentStatusKey);
  return SHIPMENT_STATUS_BADGE[key];
}

export function shipmentStatusKey(value: string): ShipmentStatusKey {
  return (SHIPMENT_STATUS_KEYS as readonly string[]).includes(value)
    ? (value as ShipmentStatusKey)
    : "planning";
}

/**
 * Backward-compatible label helper for the admin/tracking pages
 * that still deal with the 11 operational statuses.
 * Returns a human-readable string for ANY status key (not just the 4 buckets).
 */
export function shipmentStatusLabel(status: string): string {
  const key = (status ?? "").toLowerCase();
  return FALLBACK_LABEL[key] ?? key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
