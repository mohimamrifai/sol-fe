export const BUSINESS_CATEGORY_OPTIONS = [
  { value: "trading", labelKey: "trading" },
  { value: "manufacturing", labelKey: "manufacturing" },
  { value: "retail", labelKey: "retail" },
  { value: "distributor", labelKey: "distributor" },
  { value: "e_commerce", labelKey: "e_commerce" },
  { value: "logistics", labelKey: "logistics" },
  { value: "others", labelKey: "others" },
] as const;

export const MONTHLY_SHIPMENT_ESTIMATE_OPTIONS = [
  { value: "under_10", labelKey: "under_10" },
  { value: "10_to_50", labelKey: "10_to_50" },
  { value: "50_to_100", labelKey: "50_to_100" },
  { value: "over_100", labelKey: "over_100" },
] as const;
