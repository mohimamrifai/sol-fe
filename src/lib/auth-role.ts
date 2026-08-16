import type { AuthUser } from "./auth-api";

const INTERNAL_UI_ROLES = [
  "super_admin",
  "operations",
  "finance",
  "sales",
] as const;

const CUSTOMER_UI_ROLES = ["company_admin", "ops_pic", "finance_pic", "viewer"] as const;

const VENDOR_UI_ROLES = [
  "vendor_company_admin",
  "vendor_ops_pic",
  "vendor_finance_pic",
] as const;

export type DashboardUiRole =
  | (typeof INTERNAL_UI_ROLES)[number]
  | (typeof CUSTOMER_UI_ROLES)[number]
  | (typeof VENDOR_UI_ROLES)[number]
  | "internal_other"
  | "vendor_viewer";

/**
 * Satu role untuk routing komponen dashboard — prioritas: vendor > customer > internal.
 * Role internal tambahan (seed) dipetakan ke `internal_other` → tampil seperti operations.
 */
export function getDashboardUiRole(user: AuthUser | null): DashboardUiRole | null {
  if (!user?.roles?.length) return null;

  const roles = user.roles as string[];

  if (user.user_type === "vendor") {
    for (const r of VENDOR_UI_ROLES) {
      if (roles.includes(r)) return r;
    }
    if (roles.includes("vendor_viewer")) return "vendor_viewer";
    return "vendor_company_admin";
  }

  if (user.user_type === "customer") {
    for (const r of CUSTOMER_UI_ROLES) {
      if (roles.includes(r)) return r;
    }
    return "company_admin";
  }

  for (const r of INTERNAL_UI_ROLES) {
    if (roles.includes(r)) return r;
  }

  return "internal_other";
}

export function isInternalUser(user: AuthUser | null): boolean {
  return user?.user_type === "internal";
}

export function isCustomerUser(user: AuthUser | null): boolean {
  return user?.user_type === "customer";
}

export function isVendorUser(user: AuthUser | null): boolean {
  return user?.user_type === "vendor";
}

export function isVendorAdminUser(user: AuthUser | null): boolean {
  if (!user) return false;
  return isVendorUser(user) && (user.roles ?? []).includes("vendor_company_admin");
}

export function isVendorOpsUser(user: AuthUser | null): boolean {
  if (!user) return false;
  return isVendorUser(user) && (user.roles ?? []).includes("vendor_ops_pic");
}

export function isVendorFinanceUser(user: AuthUser | null): boolean {
  if (!user) return false;
  return isVendorUser(user) && (user.roles ?? []).includes("vendor_finance_pic");
}

export function isCustomerViewer(user: AuthUser | null): boolean {
  if (!user) return false;
  return isCustomerUser(user) && (user.roles ?? []).includes("viewer");
}
