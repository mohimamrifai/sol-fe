"use client";

import { useMemo } from "react";
import { ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/routing";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import {
  ADMIN_DASHBOARD_ITEM,
  filterAdminNavGroups,
  type AdminNavGroupDef,
  type AdminNavItemDef,
} from "@/lib/admin-nav-config";

function normalizePath(pathname: string): string {
  let path = pathname;
  if (path.startsWith("/en/") || path.startsWith("/id/")) {
    path = path.replace(/^\/[a-zA-Z-]+(?=\/)/, "");
  }
  if (path.length > 1 && path.endsWith("/")) {
    path = path.slice(0, -1);
  }
  return path;
}

function isPathActive(pathname: string, url: string): boolean {
  return pathname === url || pathname.startsWith(`${url}/`);
}

function findBestMatchUrl(pathname: string, urls: string[]): string {
  return urls.reduce((longest, url) => {
    if (url === "/dashboard") {
      return pathname === "/dashboard" ? url : longest;
    }
    if (isPathActive(pathname, url) && url.length > longest.length) {
      return url;
    }
    return longest;
  }, "");
}

type AdminSidebarNavProps = {
  menuRole: string;
  permissions: string[];
  userRoles?: string[];
};

function activeItemClass(isActive: boolean): string {
  return cn(
    isActive
      ? "bg-[#0b1b69] text-white shadow-sm hover:bg-[#0d2280] hover:text-white data-active:bg-[#0b1b69]! data-active:text-white! [&_svg]:!text-white [&_svg]:!opacity-100"
      : "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 data-active:bg-zinc-100 data-active:text-zinc-900 [&_svg]:text-zinc-600"
  );
}

function activeIconClass(isActive: boolean, sizeClass: string): string {
  return cn(sizeClass, "shrink-0", isActive ? "text-white!" : "text-zinc-600");
}

function NavSubItem({
  item,
  isActive,
  label,
}: {
  item: AdminNavItemDef;
  isActive: boolean;
  label: string;
}) {
  const Icon = item.icon;

  return (
    <SidebarMenuSubItem>
      <SidebarMenuSubButton
        isActive={isActive}
        className={cn("h-8 rounded-md px-2 text-sm font-medium transition-colors", activeItemClass(isActive))}
        render={
          <Link href={item.url} className="flex items-center gap-2 text-inherit">
            <Icon className={activeIconClass(isActive, "h-3.5 w-3.5")} />
            <span>{label}</span>
          </Link>
        }
      />
    </SidebarMenuSubItem>
  );
}

function NavGroup({
  group,
  bestMatchUrl,
  t,
}: {
  group: AdminNavGroupDef;
  bestMatchUrl: string;
  t: ReturnType<typeof useTranslations<"AdminNav">>;
}) {
  const groupActive = group.items.some((item) => item.url === bestMatchUrl);
  const groupLabel = t(`groups.${group.groupKey}` as Parameters<typeof t>[0]);

  return (
    <Collapsible defaultOpen={groupActive} className="group/collapsible">
      <SidebarMenuItem>
        <CollapsibleTrigger
          className={cn(
            "flex h-9 w-full items-center gap-2 rounded-md px-3 text-sm font-medium text-zinc-700 transition-colors",
            "hover:bg-zinc-100 hover:text-zinc-900 [&_svg]:text-zinc-600",
            groupActive && "bg-zinc-100 text-zinc-900 [&_svg]:!text-zinc-800"
          )}
        >
          <ChevronRight className={cn("h-4 w-4 shrink-0 transition-transform group-data-[state=open]/collapsible:rotate-90", groupActive ? "text-zinc-800!" : "text-zinc-600")} />
          <span className="truncate">{groupLabel}</span>
        </CollapsibleTrigger>
        <CollapsibleContent className="overflow-visible data-[closed]:overflow-hidden">
          <SidebarMenuSub>
            {group.items.map((item) => (
              <NavSubItem
                key={item.url}
                item={item}
                isActive={item.url === bestMatchUrl}
                label={t(`items.${item.menuKey}` as Parameters<typeof t>[0])}
              />
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
}

export function AdminSidebarNav({ menuRole, permissions, userRoles = [] }: AdminSidebarNavProps) {
  const t = useTranslations("AdminNav");
  const pathname = usePathname();
  const normalizedPath = useMemo(() => normalizePath(pathname), [pathname]);

  const groups = useMemo(
    () => filterAdminNavGroups(menuRole, permissions, userRoles),
    [menuRole, permissions, userRoles]
  );

  const allUrls = useMemo(
    () => [ADMIN_DASHBOARD_ITEM.url, ...groups.flatMap((g) => g.items.map((i) => i.url))],
    [groups]
  );

  const bestMatchUrl = useMemo(
    () => findBestMatchUrl(normalizedPath, allUrls),
    [normalizedPath, allUrls]
  );

  const dashboardActive = bestMatchUrl === ADMIN_DASHBOARD_ITEM.url;
  const DashboardIcon = ADMIN_DASHBOARD_ITEM.icon;

  return (
    <SidebarGroup className="p-0">
      <SidebarGroupLabel className="mb-2 px-4 text-sm font-medium text-zinc-500">
        {t("menuLabel")}
      </SidebarGroupLabel>
      <SidebarMenu className="gap-2 px-2 pb-2">
        <SidebarMenuItem>
          <SidebarMenuButton
            tooltip={t("items.dashboard")}
            isActive={dashboardActive}
            size="default"
            className={cn("h-9 rounded-md px-3 text-sm font-medium transition-colors", activeItemClass(dashboardActive))}
            render={
              <Link href={ADMIN_DASHBOARD_ITEM.url} className="flex w-full items-center gap-3 text-inherit">
                <DashboardIcon className={activeIconClass(dashboardActive, "h-4 w-4")} />
                <span>{t("items.dashboard")}</span>
              </Link>
            }
          />
        </SidebarMenuItem>

        {groups.map((group) => (
          <NavGroup key={group.groupKey} group={group} bestMatchUrl={bestMatchUrl} t={t} />
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
