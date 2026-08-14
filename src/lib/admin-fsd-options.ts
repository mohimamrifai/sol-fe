import { humanizeSnakeCase } from "@/lib/format-label";

export const BUSINESS_ENTITY_OPTIONS = [
  { value: "company", label: "Company" },
  { value: "individual", label: "Individual" },
] as const;

export const TRAIN_SCHEDULE_STATUS_OPTIONS = [
  { value: "upcoming", label: "Upcoming" },
  { value: "departed", label: "Departed" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
] as const;

export const CONTAINER_CATEGORY_OPTIONS = [
  { value: "dry", label: "Dry" },
  { value: "high_cube", label: "High Cube" },
  { value: "reefer", label: "Reefer" },
  { value: "open_top", label: "Open Top" },
  { value: "flat_rack", label: "Flat Rack" },
  { value: "tank", label: "Tank" },
  { value: "other", label: "Other" },
] as const;

export const CONTAINER_SIZE_OPTIONS = [
  { value: "20 ft", label: "20 ft" },
  { value: "40 ft", label: "40 ft" },
  { value: "45 ft", label: "45 ft" },
] as const;

export const MASTER_SERVICE_CATEGORY_OPTIONS = [
  { value: "rail_freight", label: "Rail Freight" },
  { value: "pickup_trucking", label: "Pickup Trucking" },
  { value: "delivery_trucking", label: "Delivery Trucking" },
  { value: "container_rental", label: "Container Rental" },
  { value: "lift_on", label: "Lift On" },
  { value: "lift_off", label: "Lift Off" },
  { value: "storage", label: "Storage" },
  { value: "other", label: "Other" },
] as const;

export const MASTER_PRICING_BASIS_OPTIONS = [
  { value: "per_trip", label: "Per Trip" },
  { value: "per_container", label: "Per Container" },
  { value: "per_ton", label: "Per Ton" },
  { value: "per_kg", label: "Per Kg" },
  { value: "per_cbm", label: "Per CBM" },
] as const;

export const INTERNAL_ADMIN_ROLES = [
  { value: "super_admin", label: "Super Admin" },
  { value: "sales", label: "Sales" },
  { value: "operations", label: "Operations" },
  { value: "finance", label: "Finance" },
  { value: "customer_service", label: "Customer Service" },
  { value: "billing", label: "Billing" },
  { value: "account_manager", label: "Account Manager" },
  { value: "management", label: "Management" },
  { value: "internal_viewer", label: "Viewer" },
] as const;

export function internalRoleLabel(role: string | null | undefined): string {
  const key = String(role ?? "").trim();
  if (!key) return "—";
  if (key === "viewer") return "Viewer";
  return INTERNAL_ADMIN_ROLES.find((r) => r.value === key)?.label ?? humanizeSnakeCase(key);
}

export function trainScheduleStatusLabel(status: string | null | undefined): string {
  const key = String(status ?? "").trim();
  if (!key) return "—";
  return TRAIN_SCHEDULE_STATUS_OPTIONS.find((s) => s.value === key)?.label ?? humanizeSnakeCase(key);
}
