import { humanizeSnakeCase } from "@/lib/format-label";
import { normalizeSelectField } from "@/lib/select-field";

export const VENDOR_TYPE_OPTIONS = [
  { value: "trucking", label: "Trucking" },
  { value: "rail_operator", label: "Rail Operator" },
  { value: "container_provider", label: "Container Provider" },
] as const;

export const BUSINESS_ENTITY_OPTIONS = [
  { value: "company", label: "Company" },
  { value: "individual", label: "Individual" },
] as const;

export const VENDOR_PAYMENT_TERM_OPTIONS = [
  { value: "cod", label: "COD" },
  { value: "7_days", label: "7 Days" },
  { value: "14_days", label: "14 Days" },
  { value: "30_days", label: "30 Days" },
  { value: "45_days", label: "45 Days" },
] as const;

export const VENDOR_PAYMENT_METHOD_OPTIONS = [
  { value: "transfer", label: "Transfer" },
  { value: "giro", label: "Giro" },
  { value: "cash", label: "Cash" },
  { value: "virtual_account", label: "Virtual Account" },
] as const;

export const VENDOR_TAX_STATUS_OPTIONS = [
  { value: "pkp", label: "PKP" },
  { value: "non_pkp", label: "Non PKP" },
] as const;

export const SERVICE_CATEGORY_OPTIONS = [
  { value: "rail", label: "Rail" },
  { value: "trucking_pickup", label: "Trucking Pickup" },
  { value: "trucking_delivery", label: "Trucking Delivery" },
  { value: "container_rental", label: "Container Rental" },
  { value: "lift_on_o", label: "Lift On-O" },
  { value: "storage", label: "Storage" },
  { value: "other", label: "Other" },
] as const;

export const PRICING_BASIS_OPTIONS = [
  { value: "per_container", label: "Per Container" },
  { value: "per_trip", label: "Per Trip" },
  { value: "per_ton", label: "Per Ton" },
  { value: "per_kg", label: "Per Kg" },
  { value: "per_cbm", label: "Per CBM" },
] as const;

export const VEHICLE_TYPE_OPTIONS = [
  { value: "CDE", label: "CDE" },
  { value: "CDD", label: "CDD" },
  { value: "Fuso", label: "Fuso" },
  { value: "Wingbox", label: "Wingbox" },
  { value: "Trailer 20'", label: "Trailer 20'" },
  { value: "Trailer 40'", label: "Trailer 40'" },
] as const;

function labeledOption(
  value: string | null | undefined,
  options: readonly { value: string; label: string }[]
): string {
  const normalized = normalizeSelectField(value);
  if (!normalized) return "—";
  return options.find((o) => o.value === normalized)?.label ?? humanizeSnakeCase(normalized);
}

export function vendorTypeLabel(value: string): string {
  return labeledOption(value, VENDOR_TYPE_OPTIONS);
}

export function businessEntityLabel(value: string | null | undefined): string {
  return labeledOption(value, BUSINESS_ENTITY_OPTIONS);
}

export function vendorPaymentTermLabel(value: string | null | undefined): string {
  return labeledOption(value, VENDOR_PAYMENT_TERM_OPTIONS);
}

export function vendorPaymentMethodLabel(value: string | null | undefined): string {
  return labeledOption(value, VENDOR_PAYMENT_METHOD_OPTIONS);
}

export function vendorTaxStatusLabel(value: string | null | undefined): string {
  return labeledOption(value, VENDOR_TAX_STATUS_OPTIONS);
}

export function vendorTypesLabel(types: string[] | null | undefined): string {
  if (!types?.length) return "—";
  return types.map(vendorTypeLabel).join(" / ");
}

export function serviceCategoryLabel(value: string | null | undefined): string {
  return labeledOption(value, SERVICE_CATEGORY_OPTIONS);
}

export function pricingBasisLabel(value: string | null | undefined): string {
  return labeledOption(value, PRICING_BASIS_OPTIONS);
}

export function vehicleTypeLabel(value: string | null | undefined): string {
  return labeledOption(value, VEHICLE_TYPE_OPTIONS);
}

export function formatIdr(value: string | number | null | undefined): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
}

export const TRUCKING_SERVICE_CATEGORIES = ["trucking_pickup", "trucking_delivery"];
export const CONTAINER_SERVICE_CATEGORIES = ["rail", "container_rental"];
