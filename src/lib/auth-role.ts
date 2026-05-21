import type { AuthUser } from "./auth-api";

const INTERNAL_UI_ROLES = [
  "super_admin",
  "operations",
  "finance",
  "sales",
] as const;

const CUSTOMER_UI_ROLES = ["company_admin", "ops_pic", "finance_pic"] as const;

export type DashboardUiRole =
  | (typeof INTERNAL_UI_ROLES)[number]
  | (typeof CUSTOMER_UI_ROLES)[number]
  | "internal_other";

/**
 * Satu role untuk routing komponen dashboard — prioritas per brief (4 internal + 3 customer).
 * Role internal tambahan (seed) dipetakan ke `internal_other` → tampil seperti operations.
 */
export function getDashboardUiRole(user: AuthUser | null): DashboardUiRole | null {
  if (!user?.roles?.length) return null;

  const roles = user.roles as string[];

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
