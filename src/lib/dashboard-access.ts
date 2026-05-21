import type { AuthUser } from "./auth-api";
import { getDashboardUiRole, isCustomerUser, isInternalUser } from "./auth-role";

/**
 * Definisi item sidebar + aturan akses rute (satu sumber kebenaran).
 * `menuKey` = kunci di namespace next-intl `Dashboard.menu`.
 */
export const DASHBOARD_SIDEBAR_ITEM_DEFS = [
  {
    menuKey: "dashboard",
    url: "/dashboard",
    requiredPermission: null,
    roles: [
      "super_admin",
      "operations",
      "finance",
      "sales",
      "company_admin",
      "ops_pic",
      "finance_pic",
    ] as const,
  },
  {
    menuKey: "customerManagement",
    url: "/dashboard/admin/customers",
    requiredPermission: "view_companies",
    roles: ["super_admin", "sales", "operations", "finance"] as const,
  },
  {
    menuKey: "bookingManagement",
    url: "/dashboard/admin/bookings",
    requiredPermission: "view_bookings",
    roles: ["super_admin", "operations"] as const,
  },
  {
    menuKey: "shipmentManagement",
    url: "/dashboard/admin/shipments",
    requiredPermission: "view_shipments",
    roles: ["super_admin", "operations"] as const,
  },
  {
    menuKey: "masterOperational",
    url: "/dashboard/admin/master",
    requiredPermission: "manage_master_data",
    roles: ["super_admin", "operations"] as const,
  },
  {
    menuKey: "invoiceManagement",
    url: "/dashboard/admin/invoices",
    requiredPermission: "view_invoices",
    roles: ["super_admin", "finance"] as const,
  },
  {
    menuKey: "paymentManagement",
    url: "/dashboard/admin/payments",
    requiredPermission: "view_payments",
    roles: ["super_admin", "finance"] as const,
  },
  {
    menuKey: "vendorPricing",
    url: "/dashboard/admin/vendor",
    requiredPermission: "manage_vendors",
    roles: ["super_admin", "sales"] as const,
  },
  {
    menuKey: "roleManagement",
    url: "/dashboard/admin/roles",
    requiredPermission: "manage_users", // or super_admin only
    roles: ["super_admin"] as const,
  },
  {
    menuKey: "internalUsers",
    url: "/dashboard/admin/users",
    requiredPermission: "view_users",
    roles: ["super_admin"] as const,
  },
  {
    menuKey: "createBooking",
    url: "/dashboard/booking/create",
    requiredPermission: "create_bookings",
    roles: ["company_admin", "ops_pic"] as const,
  },
  {
    menuKey: "myBookings",
    url: "/dashboard/booking",
    requiredPermission: "view_bookings",
    roles: ["company_admin", "ops_pic"] as const,
  },
  {
    menuKey: "myShipments",
    url: "/dashboard/shipments",
    requiredPermission: "view_shipments",
    roles: ["company_admin", "ops_pic"] as const,
  },
  {
    menuKey: "shipmentTracking",
    url: "/dashboard/tracking",
    requiredPermission: null,
    roles: ["company_admin", "ops_pic"] as const,
  },
  {
    menuKey: "invoices",
    url: "/dashboard/invoices",
    requiredPermission: "view_invoices",
    roles: ["company_admin", "finance_pic"] as const,
  },
  {
    menuKey: "payments",
    url: "/dashboard/payments",
    requiredPermission: "view_payments",
    roles: ["company_admin", "finance_pic"] as const,
  },
  {
    menuKey: "companySettings",
    url: "/dashboard/settings",
    requiredPermission: null,
    roles: ["company_admin", "ops_pic", "finance_pic", "super_admin", "operations", "finance", "sales"] as const,
  },
] as const;

export type SidebarItemDef = (typeof DASHBOARD_SIDEBAR_ITEM_DEFS)[number];
export type DashboardMenuKey = SidebarItemDef["menuKey"];

export const ADMIN_DASHBOARD_PREFIX = "/dashboard/admin";

/** Hilangkan prefix locale jika ada (/id/dashboard → /dashboard). */
export function normalizeDashboardPathname(pathname: string): string {
  let p = pathname;
  if (p.startsWith("/en/") || p.startsWith("/id/")) {
    p = p.replace(/^\/[a-zA-Z-]+(?=\/)/, "");
  }
  if (p.length > 1 && p.endsWith("/")) {
    p = p.slice(0, -1);
  }
  return p;
}

function effectiveMenuRole(user: AuthUser | null): string | null {
  const ui = getDashboardUiRole(user);
  if (ui == null) return null;
  return ui === "internal_other" ? "operations" : ui;
}

type AccessResult = { redirectTo: string } | null;

/**
 * Jika akses ditolak, kembalikan { redirectTo: "/dashboard" }.
 * `user` harus sudah terisi (dipanggil setelah auth gate).
 */
export function evaluateDashboardPathAccess(user: AuthUser, pathname: string): AccessResult {
  const path = normalizeDashboardPathname(pathname);

  if (path === "/dashboard") {
    return null;
  }

  if (path.startsWith(`${ADMIN_DASHBOARD_PREFIX}/`) || path === ADMIN_DASHBOARD_PREFIX) {
    if (!isInternalUser(user)) {
      return { redirectTo: "/dashboard" };
    }
    return null;
  }

  const menuRole = effectiveMenuRole(user);
  if (!menuRole) {
    return { redirectTo: "/dashboard" };
  }

  const defs = [...DASHBOARD_SIDEBAR_ITEM_DEFS].sort((a, b) => b.url.length - a.url.length);

  for (const def of defs) {
    if (def.url === "/dashboard") continue;
    if (def.url.startsWith(ADMIN_DASHBOARD_PREFIX)) continue;

    const isThisRoute = path === def.url || path.startsWith(`${def.url}/`);
    if (!isThisRoute) continue;

    if (isInternalUser(user)) {
      return { redirectTo: "/dashboard" };
    }

    if (!isCustomerUser(user)) {
      return { redirectTo: "/dashboard" };
    }

    const allowedRoles = def.roles as readonly string[];
    if (!allowedRoles.includes(menuRole)) {
      return { redirectTo: "/dashboard" };
    }

    return null;
  }

  return null;
}
