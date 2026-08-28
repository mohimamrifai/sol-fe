import { DEFAULT_COUNTRY } from "@/lib/countries";

export const BUSINESS_ENTITY_OPTIONS = [
  "PT",
  "CV",
  "UD",
  "Koperasi",
  "Yayasan",
  "Firma",
  "Perorangan",
  "Lainnya",
] as const;

export const CUSTOMER_STATUS_OPTIONS = [
  { value: "pending", labelKey: "pending" },
  { value: "active", labelKey: "active" },
  { value: "suspended", labelKey: "suspended" },
  { value: "inactive", labelKey: "inactive" },
  { value: "rejected", labelKey: "rejected" },
] as const;

export { DEFAULT_COUNTRY };
