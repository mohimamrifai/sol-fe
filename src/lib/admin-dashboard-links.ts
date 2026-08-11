const SHIPMENT_FSD_FILTER: Record<string, string> = {
  planning: "created",
  ready_operation: "survey_completed",
  pickup: "cargo_received",
  gate_in_origin: "stuffing_container",
  loading: "container_sealed",
  train_departure: "train_departed",
  train_arrival: "train_arrived",
  gate_out_destination: "container_unloading",
  delivery: "ready_for_pickup",
  proof_of_delivery: "proof_of_delivery",
  completed: "completed",
};

const BOOKING_FSD_FILTER: Record<string, string> = {
  draft: "draft",
  submitted: "submitted",
  under_review: "submitted",
  approved: "approved",
  rejected: "rejected",
};

export function adminDashboardBookingLink(statusKey: string): string {
  const status = BOOKING_FSD_FILTER[statusKey] ?? statusKey;
  return `/dashboard/admin/customer/bookings?status=${encodeURIComponent(status)}`;
}

export function adminDashboardShipmentLink(statusKey: string): string {
  const status = SHIPMENT_FSD_FILTER[statusKey] ?? statusKey;
  return `/dashboard/admin/customer/shipments?status=${encodeURIComponent(status)}`;
}
