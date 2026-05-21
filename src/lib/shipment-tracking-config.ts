/** Selaras dengan sol-backend/config/shipment.php `tracking_statuses` */
export const TRACKING_STATUS_OPTIONS = [
  { value: "booking_created", label: "Booking dibuat" },
  { value: "survey_completed", label: "Survey selesai" },
  { value: "cargo_received", label: "Kargo diterima" },
  { value: "stuffing_container", label: "Stuffing kontainer" },
  { value: "container_sealed", label: "Kontainer disegel" },
  { value: "train_departed", label: "Kereta berangkat" },
  { value: "train_arrived", label: "Kereta tiba" },
  { value: "container_unloading", label: "Bongkar kontainer" },
  { value: "ready_for_pickup", label: "Siap diambil" },
  { value: "completed", label: "Selesai" },
] as const;
