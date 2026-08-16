"use client";

import { useAuthStore } from "@/lib/store";
import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { getDashboardUiRole } from "@/lib/auth-role";
import {
  fetchAdminDashboard,
  fetchCustomerDashboard,
  type AdminDashboardFilters,
  type AdminDashboardPayload,
  type CustomerDashboardPayload,
} from "@/lib/dashboard-api";
import { fetchVendorDashboard } from "@/lib/vendor/dashboard-api";
import { LayoutDashboard } from "lucide-react";

const DashboardSuperAdmin = dynamic(
  () => import("@/components/dashboard/role/DashboardSuperAdmin").then((m) => m.DashboardSuperAdmin)
);
const DashboardOperations = dynamic(
  () => import("@/components/dashboard/role/DashboardOperations").then((m) => m.DashboardOperations)
);
const DashboardFinance = dynamic(
  () => import("@/components/dashboard/role/DashboardFinance").then((m) => m.DashboardFinance)
);
const DashboardSales = dynamic(
  () => import("@/components/dashboard/role/DashboardSales").then((m) => m.DashboardSales)
);
const DashboardCompanyAdmin = dynamic(
  () => import("@/components/dashboard/role/DashboardCompanyAdmin").then((m) => m.DashboardCompanyAdmin)
);
const DashboardOpsPic = dynamic(
  () => import("@/components/dashboard/role/DashboardOpsPic").then((m) => m.DashboardOpsPic)
);
const DashboardFinancePic = dynamic(
  () => import("@/components/dashboard/role/DashboardFinancePic").then((m) => m.DashboardFinancePic)
);
const DashboardViewer = dynamic(
  () => import("@/components/dashboard/role/DashboardViewer").then((m) => m.DashboardViewer)
);
const DashboardVendorCompanyAdmin = dynamic(
  () => import("@/components/dashboard/role/DashboardVendorCompanyAdmin").then(
    (m) => m.DashboardVendorCompanyAdmin
  )
);
const DashboardVendorOpsPic = dynamic(
  () => import("@/components/dashboard/role/DashboardVendorOpsPic").then((m) => m.DashboardVendorOpsPic)
);
const DashboardVendorFinancePic = dynamic(
  () => import("@/components/dashboard/role/DashboardVendorFinancePic").then(
    (m) => m.DashboardVendorFinancePic
  )
);
const DashboardVendorViewer = dynamic(
  () => import("@/components/dashboard/role/DashboardVendorViewer").then((m) => m.DashboardVendorViewer)
);

export default function DashboardPage() {
  const { user } = useAuthStore();
  const t = useTranslations("Dashboard.roleTitles");
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [adminData, setAdminData] = useState<AdminDashboardPayload | null>(null);
  const [customerData, setCustomerData] = useState<CustomerDashboardPayload | null>(null);
  const [adminFilters, setAdminFilters] = useState<AdminDashboardFilters>({
    period: "today",
    businessDate: new Date().toISOString().slice(0, 10),
  });

  const loadAdminDashboard = useCallback(async (filters: AdminDashboardFilters) => {
    const r = await fetchAdminDashboard(filters);
    setAdminData(r.data);
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        if (user.user_type === "internal") {
          if (!cancelled) await loadAdminDashboard(adminFilters);
        } else if (user.user_type === "vendor") {
          const r = await fetchVendorDashboard();
          if (!cancelled) setAdminData(r.data as unknown as AdminDashboardPayload);
        } else {
          const r = await fetchCustomerDashboard();
          if (!cancelled) setCustomerData(r.data);
        }
      } catch {
        if (!cancelled) {
          setAdminData(null);
          setCustomerData(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, adminFilters, loadAdminDashboard]);

  if (!mounted) return null;

  const uiRole = getDashboardUiRole(user);
  const effectiveRole = uiRole === "internal_other" ? "operations" : uiRole;

  const renderDashboardByRole = () => {
    const customerProps = { data: customerData, loading };

    switch (effectiveRole) {
      case "super_admin":
        return (
          <DashboardSuperAdmin
            data={adminData}
            loading={loading}
            filters={adminFilters}
            onFiltersChange={setAdminFilters}
          />
        );
      case "operations":
        return (
          <DashboardOperations
            data={adminData}
            loading={loading}
            filters={adminFilters}
            onFiltersChange={setAdminFilters}
          />
        );
      case "finance":
        return (
          <DashboardFinance
            data={adminData}
            loading={loading}
            filters={adminFilters}
            onFiltersChange={setAdminFilters}
          />
        );
      case "sales":
        return (
          <DashboardSales
            data={adminData}
            loading={loading}
            filters={adminFilters}
            onFiltersChange={setAdminFilters}
          />
        );
      case "company_admin":
        return <DashboardCompanyAdmin {...customerProps} />;
      case "ops_pic":
        return <DashboardOpsPic {...customerProps} />;
      case "finance_pic":
        return <DashboardFinancePic {...customerProps} />;
      case "viewer":
        return <DashboardViewer {...customerProps} />;
      case "vendor_company_admin":
        return <DashboardVendorCompanyAdmin />;
      case "vendor_ops_pic":
        return <DashboardVendorOpsPic />;
      case "vendor_finance_pic":
        return <DashboardVendorFinancePic />;
      case "vendor_viewer":
        return <DashboardVendorViewer />;
      default:
        return (
          <div className="flex min-w-0 w-full flex-1 flex-col gap-4">
            <h1 className="text-xl font-semibold">Dashboard tidak tersedia</h1>
            <p className="text-sm text-muted-foreground">Role tidak dikenali.</p>
          </div>
        );
    }
  };

  const title = ((): string => {
    const key = effectiveRole as Parameters<typeof t>[0];
    try {
      return t(key);
    } catch {
      return t("default");
    }
  })();

  return (
    <div className="flex min-w-0 w-full flex-1 flex-col gap-6 md:px-2">
      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-900/5 text-zinc-900">
            <LayoutDashboard className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-semibold tracking-tight text-zinc-900 sm:text-2xl">{title}</h1>
          </div>
        </div>
      </div>

      {renderDashboardByRole()}
    </div>
  );
}
