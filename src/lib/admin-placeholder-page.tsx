import { getAllAdminNavItems } from "@/lib/admin-nav-config";
import { AdminModulePlaceholder } from "@/components/dashboard/admin/shared/admin-module-placeholder";
import { notFound } from "next/navigation";

export function createAdminPlaceholderPage(menuKey: string) {
  const item = getAllAdminNavItems().find((entry) => entry.menuKey === menuKey);
  if (!item) {
    return function MissingPlaceholderPage() {
      notFound();
    };
  }

  const Icon = item.icon;
  const fsdRef = item.fsdRef;

  return function AdminPlaceholderPage() {
    return <AdminModulePlaceholder menuKey={menuKey} icon={Icon} fsdRef={fsdRef} />;
  };
}
