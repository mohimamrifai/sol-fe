export type PermissionAction = "view" | "create" | "edit" | "approve" | "export";

export type PermissionMatrixRow = {
  menu: string;
  permissions: Partial<Record<PermissionAction, string>>;
};

export const ADMIN_PERMISSION_MATRIX: PermissionMatrixRow[] = [
  { menu: "Dashboard", permissions: { view: "view_dashboard", export: "export_reports" } },
  { menu: "Customers", permissions: { view: "view_companies", create: "create_companies", edit: "edit_companies", approve: "approve_companies" } },
  { menu: "Bookings", permissions: { view: "view_bookings", create: "create_bookings", edit: "edit_bookings", approve: "approve_bookings" } },
  { menu: "Shipments", permissions: { view: "view_shipments", create: "create_shipments", edit: "edit_shipments" } },
  { menu: "Customer Invoice", permissions: { view: "view_invoices", create: "create_invoices", edit: "edit_invoices", approve: "approve_invoices" } },
  { menu: "Customer Payment", permissions: { view: "view_payments", create: "manage_payments", edit: "manage_payments" } },
  { menu: "Vendor", permissions: { view: "view_vendors", create: "manage_vendors", edit: "manage_vendors" } },
  { menu: "Container", permissions: { view: "view_containers", create: "manage_containers", edit: "edit_containers" } },
  { menu: "Operations", permissions: { view: "view_operations", create: "manage_operations", edit: "manage_operations" } },
  { menu: "Reports", permissions: { view: "view_reports", export: "export_reports" } },
  { menu: "Settings", permissions: { view: "view_settings", edit: "manage_settings" } },
  { menu: "Master Data", permissions: { view: "manage_master_data", create: "manage_master_data", edit: "manage_master_data" } },
  { menu: "Roles", permissions: { view: "manage_roles", edit: "manage_roles" } },
];

export const PERMISSION_ACTIONS: PermissionAction[] = ["view", "create", "edit", "approve", "export"];
