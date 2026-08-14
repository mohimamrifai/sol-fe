"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { usePathname } from "@/i18n/routing";
import { AdminPageHeader } from "@/components/dashboard/admin/shared/admin-page-header";
import { ADMIN_NAV_GROUPS, type AdminNavItemDef } from "@/lib/admin-nav-config";
import { MasterPageActionsProvider } from "@/components/shared/master-page-actions";
import { Database } from "lucide-react";

const MASTER_ITEMS =
  ADMIN_NAV_GROUPS.find((group) => group.groupKey === "masterData")?.items ?? [];

function normalizePath(pathname: string): string {
  let path = pathname;
  if (path.length > 1 && path.endsWith("/")) {
    path = path.slice(0, -1);
  }
  return path;
}

function findMasterItem(pathname: string): AdminNavItemDef | undefined {
  const path = normalizePath(pathname);
  const exact = MASTER_ITEMS.find((item) => path === item.url);
  if (exact) return exact;
  return MASTER_ITEMS.find((item) => path.startsWith(`${item.url}/`));
}

function isMasterListPage(pathname: string): boolean {
  const path = normalizePath(pathname);
  return MASTER_ITEMS.some((item) => path === item.url);
}

export function MasterLayoutShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const t = useTranslations("AdminNav");
  const [actions, setActions] = useState<ReactNode>(null);
  const item = useMemo(() => findMasterItem(pathname), [pathname]);
  const Icon = item?.icon ?? Database;
  const groupLabel = t("groups.masterData");
  const showHeaderActions = isMasterListPage(pathname);

  return (
    <MasterPageActionsProvider setActions={setActions}>
      <div className="flex min-w-0 w-full flex-1 flex-col gap-6 md:px-2">
        <AdminPageHeader
          icon={Icon}
          title={item ? t(`items.${item.menuKey}` as Parameters<typeof t>[0]) : groupLabel}
          description={groupLabel}
          actions={showHeaderActions ? actions : null}
        />
        {children}
      </div>
    </MasterPageActionsProvider>
  );
}
