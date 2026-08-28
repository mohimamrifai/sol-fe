/**
 * Admin FSD shipment status buckets (fsd-super-admin/Customer/shipments.md §3.1–3.2).
 * Maps operational `status` values to Planning | Ready for Departure | In Transit | Completed | Cancelled.
 */
export const FSD_SHIPMENT_STATUSES = [
  "planning",
  "ready_for_departure",
  "in_transit",
  "completed",
  "cancelled",
] as const;

export type FsdShipmentStatus = (typeof FSD_SHIPMENT_STATUSES)[number];

const OPERATIONAL_TO_FSD: Record<string, FsdShipmentStatus> = {
  created: "planning",
  booking_created: "planning",
  survey_completed: "planning",
  ready_for_pickup: "ready_for_departure",
  cargo_received: "in_transit",
  stuffing_container: "in_transit",
  container_sealed: "in_transit",
  train_departed: "in_transit",
  departed: "in_transit",
  train_arrived: "in_transit",
  arrived: "in_transit",
  container_unloading: "in_transit",
  unloading: "in_transit",
  proof_of_delivery: "in_transit",
  completed: "completed",
  cancelled: "cancelled",
};

export function resolveFsdShipmentStatus(
  operationalStatus?: string | null,
  fsdStatus?: string | null
): FsdShipmentStatus {
  const fromApi = (fsdStatus ?? "").toLowerCase().trim();
  if ((FSD_SHIPMENT_STATUSES as readonly string[]).includes(fromApi)) {
    return fromApi as FsdShipmentStatus;
  }

  const key = (operationalStatus ?? "").toLowerCase().trim();
  if ((FSD_SHIPMENT_STATUSES as readonly string[]).includes(key)) {
    return key as FsdShipmentStatus;
  }

  return OPERATIONAL_TO_FSD[key] ?? "planning";
}

export function isFsdPlanningStatus(status: FsdShipmentStatus): boolean {
  return status === "planning";
}

export function canPrintConsignmentNote(status: FsdShipmentStatus): boolean {
  return ["ready_for_departure", "in_transit", "completed"].includes(status);
}

export function canModifyContainerTransport(
  fsdStatus: FsdShipmentStatus,
  capabilities?: {
    can_modify_container?: boolean;
    can_modify_transport?: boolean;
  } | null
): boolean {
  if (capabilities?.can_modify_container || capabilities?.can_modify_transport) {
    return true;
  }
  return fsdStatus === "planning";
}

export function canEditShipmentInfo(
  fsdStatus: FsdShipmentStatus,
  capabilities?: { can_edit_shipment_info?: boolean } | null
): boolean {
  if (capabilities?.can_edit_shipment_info) {
    return true;
  }
  return fsdStatus === "planning";
}

export function canGenerateConsignmentNote(
  status: FsdShipmentStatus,
  hasCn: boolean
): boolean {
  return status === "planning" && !hasCn;
}
