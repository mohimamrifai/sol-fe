/** Tracking status values aligned with sol-backend/config/shipment.php */
export const TRACKING_STATUS_VALUES = [
  "booking_created",
  "survey_completed",
  "cargo_received",
  "stuffing_container",
  "container_sealed",
  "train_departed",
  "train_arrived",
  "container_unloading",
  "ready_for_pickup",
  "completed",
] as const;

export type TrackingStatusValue = (typeof TRACKING_STATUS_VALUES)[number];

/** @deprecated Use TRACKING_STATUS_VALUES + useShipmentStatusLabel() */
export const TRACKING_STATUS_OPTIONS = TRACKING_STATUS_VALUES.map((value) => ({
  value,
  label: value,
}));
