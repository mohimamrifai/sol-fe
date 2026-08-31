/**
 * Legacy admin URLs from pre-FSD naming. Kept for bookmarks and old links.
 * Canonical routes live in `admin-nav-config.ts` (sidebar).
 */
export const ADMIN_LEGACY_REDIRECTS: Record<string, string> = {
  "/dashboard/admin/customers": "/dashboard/admin/customer/customers",
  "/dashboard/admin/bookings": "/dashboard/admin/customer/bookings",
  "/dashboard/admin/shipments": "/dashboard/admin/customer/shipments",
  "/dashboard/admin/invoices": "/dashboard/admin/customer/invoices",
  "/dashboard/admin/payments": "/dashboard/admin/customer/payments",
  "/dashboard/admin/vendor": "/dashboard/admin/vendor/vendors",
  "/dashboard/admin/master": "/dashboard/admin/master/route",
  "/dashboard/admin/master/locations": "/dashboard/admin/master/station",
  "/dashboard/admin/master/transport-modes": "/dashboard/admin/master/route",
  "/dashboard/admin/master/service-types": "/dashboard/admin/master/service-type",
  "/dashboard/admin/master/container-types": "/dashboard/admin/master/container-type",
  "/dashboard/admin/master/cargo-categories": "/dashboard/admin/master/cargo-category",
  "/dashboard/admin/master/trains": "/dashboard/admin/master/train-schedule",
  "/dashboard/admin/master/train-cars": "/dashboard/admin/master/train-schedule",
  "/dashboard/admin/master/additional-services": "/dashboard/admin/master/additional-charge",
  "/dashboard/admin/roles": "/dashboard/admin/settings/roles",
  "/dashboard/admin/users": "/dashboard/admin/settings/users",
};

export function resolveLegacyAdminRedirect(path: string): string | null {
  if (ADMIN_LEGACY_REDIRECTS[path]) return ADMIN_LEGACY_REDIRECTS[path];

  for (const [legacy, target] of Object.entries(ADMIN_LEGACY_REDIRECTS)) {
    if (path.startsWith(`${legacy}/`)) {
      return `${target}${path.slice(legacy.length)}`;
    }
  }

  return null;
}
