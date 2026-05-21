/** Opsi filter status (is_active) — selaras dengan query `status` di API master */
export const STATUS_FILTER_OPTIONS = [
  { value: "all", label: "Semua status" },
  { value: "active", label: "Aktif" },
  { value: "inactive", label: "Nonaktif" },
];

export const LOCATION_TYPE_FILTER_OPTIONS = [
  { value: "all", label: "Semua tipe" },
  { value: "port", label: "Pelabuhan" },
  { value: "city", label: "Kota" },
  { value: "hub", label: "Hub" },
  { value: "warehouse", label: "Gudang" },
  { value: "station", label: "Stasiun" },
  { value: "airport", label: "Bandara" },
  { value: "terminal", label: "Terminal" },
];

export const ADDITIONAL_CATEGORY_FILTER_OPTIONS = [
  { value: "all", label: "Semua grup" },
  { value: "pickup", label: "Pickup" },
  { value: "packing", label: "Packing" },
  { value: "handling", label: "Handling" },
  { value: "other", label: "Lainnya" },
];
