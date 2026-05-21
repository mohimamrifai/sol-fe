"use client"

import * as React from "react"
import {
  LayoutDashboard,
  PlusCircle,
  Package,
  Activity,
  FileText,
  CreditCard,
  Building,
  LogOut,
  User,
  Users,
  Truck,
  Tags,
  ShieldCheck,
  Settings,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarGroup,
  SidebarGroupLabel,
} from "@/components/ui/sidebar"
import { useTranslations } from "next-intl"
import { Link, usePathname } from "@/i18n/routing"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

import { useAuthStore } from "@/lib/store";
import { getDashboardUiRole } from "@/lib/auth-role";
import { performLogout } from "@/lib/auth-actions";
import { useAuthPersistHydrated } from "@/lib/use-auth-hydrated";
import { useRouter } from "@/i18n/routing";
import { useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  DASHBOARD_SIDEBAR_ITEM_DEFS,
  type DashboardMenuKey,
} from "@/lib/dashboard-access";
import type { LucideIcon } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";

const MENU_ICONS: Record<DashboardMenuKey, LucideIcon> = {
  dashboard: LayoutDashboard,
  customerManagement: Users,
  bookingManagement: FileText,
  shipmentManagement: Truck,
  masterOperational: Settings,
  invoiceManagement: FileText,
  paymentManagement: CreditCard,
  vendorPricing: Tags,
  roleManagement: ShieldCheck,
  internalUsers: Users,
  createBooking: PlusCircle,
  myBookings: FileText,
  myShipments: Package,
  shipmentTracking: Activity,
  invoices: FileText,
  payments: CreditCard,
  companySettings: Building,
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const t = useTranslations("Dashboard.menu")
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useAuthStore()
  const hydrated = useAuthPersistHydrated()
  const queryClient = useQueryClient();

  const allMenuItems = useMemo(
    () =>
      DASHBOARD_SIDEBAR_ITEM_DEFS.map((def) => ({
        title: t(def.menuKey as Parameters<typeof t>[0]),
        url: def.url,
        icon: MENU_ICONS[def.menuKey],
        roles: [...def.roles],
      })),
    [t]
  );

  const uiRole = hydrated && user ? getDashboardUiRole(user) : null;
  const menuRole = uiRole === "internal_other" ? "operations" : uiRole;
  const userPerms = useMemo(() => (user?.permissions as string[]) ?? [], [user?.permissions]);

  const navItems = useMemo(() => {
    if (!menuRole) return [];
    const isInternal = user?.user_type === "internal";

    return allMenuItems.filter((item) => {
      const def = DASHBOARD_SIDEBAR_ITEM_DEFS.find((d) => d.url === item.url);
      if (!def) return false;

      const isDashboardHome = def.url === "/dashboard";
      const isInternalRoute = def.url.startsWith("/dashboard/admin");

      if (!isDashboardHome) {
        if (isInternalRoute && !isInternal) return false;
        if (!isInternalRoute && isInternal) return false;
      }

      if (def.requiredPermission != null) {
        return userPerms.includes(def.requiredPermission);
      }
      return item.roles.includes(menuRole);
    });
  }, [allMenuItems, menuRole, userPerms, user?.user_type]);

  if (!hydrated) return null;

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={
              <Link href="/dashboard" className="min-w-0 gap-2 overflow-hidden">
                <span className="flex min-w-0 flex-1 flex-col gap-1.5 text-left">
                  <BrandLogo size="sm" className="max-w-[min(100%,11rem)]" />
                </span>
              </Link>
            } />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sm font-medium px-4 mb-2">Menu</SidebarGroupLabel>
          <SidebarMenu className="gap-2 px-2">
            {(() => {
              let normalizedPathname = pathname
              if (normalizedPathname.startsWith("/en/") || normalizedPathname.startsWith("/id/")) {
                normalizedPathname = normalizedPathname.replace(/^\/[a-zA-Z-]+(?=\/)/, "")
              }
              if (normalizedPathname.length > 1 && normalizedPathname.endsWith("/")) {
                normalizedPathname = normalizedPathname.slice(0, -1)
              }

              const bestMatchUrl = navItems.reduce((longestMatchUrl, item) => {
                if (item.url === "/dashboard") {
                  if (normalizedPathname === "/dashboard") {
                    return item.url;
                  }
                  return longestMatchUrl;
                }
                if (normalizedPathname === item.url || normalizedPathname.startsWith(`${item.url}/`)) {
                  if (item.url.length > longestMatchUrl.length) {
                    return item.url;
                  }
                }
                return longestMatchUrl;
              }, "");

              return navItems.map((item) => {
                const isActive = item.url === bestMatchUrl

                const handleMouseEnter = () => {
                  if (item.url === "/dashboard/booking") {
                    void queryClient.prefetchQuery({
                      queryKey: ["customerBookings", 1, "", "all"],
                    });
                  } else if (item.url === "/dashboard/shipments") {
                    void queryClient.prefetchQuery({
                      queryKey: ["customerShipments", 1, "", "all"],
                    });
                  }
                };

                return (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    tooltip={item.title}
                    isActive={isActive}
                    size="default"
                    className={
                      "h-9 text-sm font-medium px-3 rounded-md transition-colors " +
                      (isActive
                        ? "bg-[#0b1b69] text-white shadow-sm data-active:bg-[#0b1b69] data-active:text-white hover:bg-[#0d2280] hover:text-white [&_svg]:text-white"
                        : "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900")
                    }
                    render={
                      <Link href={item.url} className="flex items-center gap-3 w-full" onMouseEnter={handleMouseEnter}>
                        {item.icon && <item.icon className="h-4 w-4" />}
                        <span>{item.title}</span>
                      </Link>
                    }
                  />
                </SidebarMenuItem>
              )
              })
            })()}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground w-full"
                  render={
                    <div className="flex w-full items-center gap-3 px-1">
                       <Avatar className="h-8 w-8 rounded-lg">
                        <AvatarImage src={undefined} alt={user?.name} />
                        <AvatarFallback className="rounded-lg">CN</AvatarFallback>
                      </Avatar>
                      <div className="grid flex-1 text-left text-sm leading-tight overflow-hidden">
                        <span className="truncate font-semibold">{user?.name}</span>
                        <span className="truncate text-xs text-muted-foreground">{user?.email}</span>
                      </div>
                      <User className="ml-auto size-4 shrink-0" />
                    </div>
                  }
                />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuItem
                  onClick={async () => {
                    await performLogout();
                    router.push("/login");
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  {t("logout")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
