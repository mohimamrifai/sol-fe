import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Users,
  FileText,
  Truck,
  Receipt,
  CreditCard,
  Building2,
  Tags,
  ClipboardList,
  Wallet,
  Container,
  ArrowRightLeft,
  MapPin,
  Train,
  Warehouse,
  Route,
  Box,
  Layers,
  PackagePlus,
  DollarSign,
  BarChart3,
  ShieldCheck,
  Settings,
  UserCog,
  Hash,
  SlidersHorizontal,
  Package,
  DoorOpen,
  Upload,
  LogOut,
  MapPinned,
  FileCheck,
} from "lucide-react";

export type AdminModuleStatus = "ready" | "placeholder";

export type AdminNavItemDef = {
  menuKey: string;
  url: string;
  icon: LucideIcon;
  requiredPermission: string | null;
  roles: readonly string[];
  status: AdminModuleStatus;
  fsdRef: string;
};

export type AdminNavGroupDef = {
  groupKey: string;
  items: AdminNavItemDef[];
};

export const ADMIN_DASHBOARD_ITEM: AdminNavItemDef = {
  menuKey: "dashboard",
  url: "/dashboard",
  icon: LayoutDashboard,
  requiredPermission: "view_dashboard",
  roles: ["super_admin", "operations", "finance", "sales"],
  status: "ready",
  fsdRef: "Dashboard/dashboard.md",
};

export const ADMIN_NAV_GROUPS: AdminNavGroupDef[] = [
  {
    groupKey: "customer",
    items: [
      {
        menuKey: "customers",
        url: "/dashboard/admin/customer/customers",
        icon: Users,
        requiredPermission: "view_companies",
        roles: ["super_admin", "sales", "operations", "finance"],
        status: "ready",
        fsdRef: "Customer/customers.md",
      },
      {
        menuKey: "bookings",
        url: "/dashboard/admin/customer/bookings",
        icon: FileText,
        requiredPermission: "view_bookings",
        roles: ["super_admin", "operations"],
        status: "ready",
        fsdRef: "Customer/bookings.md",
      },
      {
        menuKey: "shipments",
        url: "/dashboard/admin/customer/shipments",
        icon: Truck,
        requiredPermission: "view_shipments",
        roles: ["super_admin", "operations"],
        status: "ready",
        fsdRef: "Customer/shipments.md",
      },
      {
        menuKey: "customerInvoices",
        url: "/dashboard/admin/customer/invoices",
        icon: Receipt,
        requiredPermission: "view_invoices",
        roles: ["super_admin", "finance"],
        status: "ready",
        fsdRef: "Customer/invoices.md",
      },
      {
        menuKey: "customerPayments",
        url: "/dashboard/admin/customer/payments",
        icon: CreditCard,
        requiredPermission: "view_payments",
        roles: ["super_admin", "finance"],
        status: "ready",
        fsdRef: "Customer/customer-payment.md",
      },
    ],
  },
  {
    groupKey: "vendor",
    items: [
      {
        menuKey: "vendors",
        url: "/dashboard/admin/vendor/vendors",
        icon: Building2,
        requiredPermission: "manage_vendors",
        roles: ["super_admin", "sales"],
        status: "ready",
        fsdRef: "Vendor/vendors.md",
      },
      {
        menuKey: "vendorPricing",
        url: "/dashboard/admin/vendor/pricing",
        icon: Tags,
        requiredPermission: "manage_pricing",
        roles: ["super_admin", "sales"],
        status: "ready",
        fsdRef: "Vendor/pricing.md",
      },
      {
        menuKey: "vendorJobOrders",
        url: "/dashboard/admin/vendor/job-orders",
        icon: ClipboardList,
        requiredPermission: "view_vendor_job_orders_admin",
        roles: ["super_admin", "operations"],
        status: "ready",
        fsdRef: "Vendor/job-order.md",
      },
      {
        menuKey: "vendorInvoices",
        url: "/dashboard/admin/vendor/invoices",
        icon: Receipt,
        requiredPermission: "view_vendor_invoices_admin",
        roles: ["super_admin", "finance"],
        status: "ready",
        fsdRef: "Vendor/invoice.md",
      },
      {
        menuKey: "vendorPayments",
        url: "/dashboard/admin/vendor/payments",
        icon: Wallet,
        requiredPermission: "view_vendor_payments_admin",
        roles: ["super_admin", "finance"],
        status: "ready",
        fsdRef: "Vendor/payment.md",
      },
    ],
  },
  {
    groupKey: "container",
    items: [
      {
        menuKey: "containers",
        url: "/dashboard/admin/container/containers",
        icon: Container,
        requiredPermission: "view_containers",
        roles: ["super_admin", "operations"],
        status: "ready",
        fsdRef: "Container/containers.md",
      },
      {
        menuKey: "containerMovement",
        url: "/dashboard/admin/container/movement",
        icon: ArrowRightLeft,
        requiredPermission: "view_containers",
        roles: ["super_admin", "operations"],
        status: "ready",
        fsdRef: "Container/movement.md",
      },
    ],
  },
  {
    groupKey: "operations",
    items: [
      { menuKey: "pickup", url: "/dashboard/admin/operations/pickup", icon: Package, requiredPermission: "view_operations", roles: ["super_admin", "operations"], status: "ready", fsdRef: "Operations/pick-up.md" },
      { menuKey: "gateInOrigin", url: "/dashboard/admin/operations/gate-in-origin", icon: DoorOpen, requiredPermission: "view_operations", roles: ["super_admin", "operations"], status: "ready", fsdRef: "Operations/gate-in-origin.md" },
      { menuKey: "loading", url: "/dashboard/admin/operations/loading", icon: Upload, requiredPermission: "view_operations", roles: ["super_admin", "operations"], status: "ready", fsdRef: "Operations/loading.md" },
      { menuKey: "trainDeparture", url: "/dashboard/admin/operations/train-departure", icon: LogOut, requiredPermission: "view_operations", roles: ["super_admin", "operations"], status: "ready", fsdRef: "Operations/train-departure.md" },
      { menuKey: "trainArrival", url: "/dashboard/admin/operations/train-arrival", icon: Train, requiredPermission: "view_operations", roles: ["super_admin", "operations"], status: "ready", fsdRef: "Operations/train-arrival.md" },
      { menuKey: "gateOutDestination", url: "/dashboard/admin/operations/gate-out-destination", icon: MapPinned, requiredPermission: "view_operations", roles: ["super_admin", "operations"], status: "ready", fsdRef: "Operations/get-out-destionation.md" },
      { menuKey: "delivery", url: "/dashboard/admin/operations/delivery", icon: Truck, requiredPermission: "view_operations", roles: ["super_admin", "operations"], status: "ready", fsdRef: "Operations/delivery.md" },
      { menuKey: "proofOfDelivery", url: "/dashboard/admin/operations/proof-of-delivery", icon: FileCheck, requiredPermission: "view_operations", roles: ["super_admin", "operations"], status: "ready", fsdRef: "Operations/proof-of-delivery.md" },
    ],
  },
  {
    groupKey: "masterData",
    items: [
      { menuKey: "route", url: "/dashboard/admin/master/route", icon: Route, requiredPermission: "manage_master_data", roles: ["super_admin", "operations"], status: "ready", fsdRef: "Master Data/route.md" },
      { menuKey: "station", url: "/dashboard/admin/master/station", icon: MapPin, requiredPermission: "manage_master_data", roles: ["super_admin", "operations"], status: "ready", fsdRef: "Master Data/station.md" },
      { menuKey: "yard", url: "/dashboard/admin/master/yard", icon: Warehouse, requiredPermission: "manage_master_data", roles: ["super_admin", "operations"], status: "ready", fsdRef: "Master Data/yard.md" },
      { menuKey: "trainSchedule", url: "/dashboard/admin/master/train-schedule", icon: Train, requiredPermission: "manage_master_data", roles: ["super_admin", "operations"], status: "ready", fsdRef: "Master Data/train-schedule.md" },
      { menuKey: "containerType", url: "/dashboard/admin/master/container-type", icon: Box, requiredPermission: "manage_master_data", roles: ["super_admin", "operations"], status: "ready", fsdRef: "Master Data/container-type.md" },
      { menuKey: "cargoCategory", url: "/dashboard/admin/master/cargo-category", icon: Layers, requiredPermission: "manage_master_data", roles: ["super_admin", "operations"], status: "ready", fsdRef: "Master Data/cargo-category.md" },
      { menuKey: "serviceType", url: "/dashboard/admin/master/service-type", icon: Settings, requiredPermission: "manage_master_data", roles: ["super_admin", "operations"], status: "ready", fsdRef: "Master Data/service-type.md" },
      { menuKey: "additionalCharge", url: "/dashboard/admin/master/additional-charge", icon: PackagePlus, requiredPermission: "manage_master_data", roles: ["super_admin", "operations"], status: "ready", fsdRef: "Master Data/additional-charge.md" },
      { menuKey: "customerPricing", url: "/dashboard/admin/master/customer-pricing", icon: DollarSign, requiredPermission: "manage_pricing", roles: ["super_admin", "sales"], status: "ready", fsdRef: "Master Data/customer-pricing.md" },
    ],
  },
  {
    groupKey: "reports",
    items: [
      { menuKey: "shipmentReport", url: "/dashboard/admin/reports/shipment", icon: BarChart3, requiredPermission: "view_reports", roles: ["super_admin", "operations", "finance"], status: "ready", fsdRef: "Reports/shipment-report.md" },
      { menuKey: "bookingReport", url: "/dashboard/admin/reports/booking", icon: BarChart3, requiredPermission: "view_reports", roles: ["super_admin", "operations", "finance"], status: "ready", fsdRef: "Reports/booking-report.md" },
      { menuKey: "customerInvoiceReport", url: "/dashboard/admin/reports/customer-invoice", icon: BarChart3, requiredPermission: "view_reports", roles: ["super_admin", "finance"], status: "ready", fsdRef: "Reports/customer-invoice-report.md" },
      { menuKey: "customerPaymentReport", url: "/dashboard/admin/reports/customer-payment", icon: BarChart3, requiredPermission: "view_reports", roles: ["super_admin", "finance"], status: "ready", fsdRef: "Reports/customer-payment-report.md" },
      { menuKey: "vendorInvoiceReport", url: "/dashboard/admin/reports/vendor-invoice", icon: BarChart3, requiredPermission: "view_reports", roles: ["super_admin", "finance"], status: "ready", fsdRef: "Reports/vendor-invoice-report.md" },
      { menuKey: "vendorPaymentReport", url: "/dashboard/admin/reports/vendor-payment", icon: BarChart3, requiredPermission: "view_reports", roles: ["super_admin", "finance"], status: "ready", fsdRef: "Reports/vendor-payment-report.md" },
      { menuKey: "containerReport", url: "/dashboard/admin/reports/container", icon: BarChart3, requiredPermission: "view_reports", roles: ["super_admin", "operations"], status: "ready", fsdRef: "Reports/container-report.md" },
    ],
  },
  {
    groupKey: "settings",
    items: [
      { menuKey: "internalUsers", url: "/dashboard/admin/settings/users", icon: UserCog, requiredPermission: "view_users", roles: ["super_admin"], status: "ready", fsdRef: "Settings/users.md" },
      { menuKey: "rolesAndPermissions", url: "/dashboard/admin/settings/roles", icon: ShieldCheck, requiredPermission: "manage_roles", roles: ["super_admin"], status: "ready", fsdRef: "Settings/roles-and-permissions.md" },
      { menuKey: "companyProfile", url: "/dashboard/admin/settings/company-profile", icon: Building2, requiredPermission: "view_settings", roles: ["super_admin"], status: "ready", fsdRef: "Settings/company-profile.md" },
      { menuKey: "numberingFormat", url: "/dashboard/admin/settings/numbering-format", icon: Hash, requiredPermission: "manage_numbering", roles: ["super_admin"], status: "ready", fsdRef: "Settings/numbering-format.md" },
      { menuKey: "systemConfiguration", url: "/dashboard/admin/settings/system-configuration", icon: SlidersHorizontal, requiredPermission: "manage_system_config", roles: ["super_admin"], status: "ready", fsdRef: "Settings/system-configuration.md" },
    ],
  },
];

export const ADMIN_LEGACY_REDIRECTS: Record<string, string> = {
  "/dashboard/admin/customers": "/dashboard/admin/customer/customers",
  "/dashboard/admin/bookings": "/dashboard/admin/customer/bookings",
  "/dashboard/admin/shipments": "/dashboard/admin/customer/shipments",
  "/dashboard/admin/invoices": "/dashboard/admin/customer/invoices",
  "/dashboard/admin/payments": "/dashboard/admin/customer/payments",
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

export function getAllAdminNavItems(): AdminNavItemDef[] {
  return [ADMIN_DASHBOARD_ITEM, ...ADMIN_NAV_GROUPS.flatMap((g) => g.items)];
}

export function canAccessAdminNavItem(
  item: AdminNavItemDef,
  menuRole: string,
  permissions: string[],
  userRoles: string[] = []
): boolean {
  if (menuRole === "super_admin" || userRoles.includes("super_admin")) return true;
  if (!item.roles.includes(menuRole)) return false;
  if (item.requiredPermission == null) return true;
  return permissions.includes(item.requiredPermission);
}

export function filterAdminNavGroups(
  menuRole: string,
  permissions: string[],
  userRoles: string[] = []
): AdminNavGroupDef[] {
  if (menuRole === "super_admin" || userRoles.includes("super_admin")) {
    return ADMIN_NAV_GROUPS;
  }

  return ADMIN_NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) =>
      canAccessAdminNavItem(item, menuRole, permissions, userRoles)
    ),
  })).filter((group) => group.items.length > 0);
}

export function resolveLegacyAdminRedirect(path: string): string | null {
  if (ADMIN_LEGACY_REDIRECTS[path]) return ADMIN_LEGACY_REDIRECTS[path];

  for (const [legacy, target] of Object.entries(ADMIN_LEGACY_REDIRECTS)) {
    if (path.startsWith(`${legacy}/`)) {
      return `${target}${path.slice(legacy.length)}`;
    }
  }

  return null;
}
