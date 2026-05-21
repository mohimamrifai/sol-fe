"use client";

import { useAuthStore } from "@/lib/store";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { getDashboardUiRole } from "@/lib/auth-role";
import {
  fetchAdminDashboard,
  fetchCustomerDashboard,
  type AdminDashboardPayload,
  type CustomerDashboardPayload,
} from "@/lib/dashboard-api";
import { fetchCustomerShipments, fetchCustomerInvoices } from "@/lib/customer-api";
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

export default function DashboardPage() {
  const { user } = useAuthStore();
  const t = useTranslations("Dashboard.roleTitles");
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [adminData, setAdminData] = useState<AdminDashboardPayload | null>(null);
  const [customerSummary, setCustomerSummary] = useState<CustomerDashboardPayload | null>(null);
  const [customerShipments, setCustomerShipments] = useState<
    Array<{
      id: number;
      shipment_number?: string;
      waybill_number?: string;
      status: string;
      origin_location?: { name?: string };
      destination_location?: { name?: string };
    }>
  >([]);
  const [customerInvoices, setCustomerInvoices] = useState<
    Array<{
      invoice_number: string;
      status: string;
      due_date?: string;
      total_amount: string | number;
    }>
  >([]);

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
          const r = await fetchAdminDashboard();
          if (!cancelled) setAdminData(r.data);
        } else {
          const [d, shipRes, invRes] = await Promise.all([
            fetchCustomerDashboard(),
            fetchCustomerShipments(5),
            fetchCustomerInvoices(5),
          ]);
          if (!cancelled) {
            setCustomerSummary(d.data);
            setCustomerShipments((shipRes.data as unknown[]) as typeof customerShipments);
            setCustomerInvoices((invRes.data as unknown[]) as typeof customerInvoices);
          }
        }
      } catch {
        if (!cancelled) {
          setAdminData(null);
          setCustomerSummary(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (!mounted) return null;

  const uiRole = getDashboardUiRole(user);
  const effectiveRole = uiRole === "internal_other" ? "operations" : uiRole;

  const renderDashboardByRole = () => {
    const adminProps = { data: adminData, loading };
    const customerProps = {
      summary: customerSummary,
      shipments: customerShipments,
      invoices: customerInvoices,
      loading,
    };

    switch (effectiveRole) {
      case "super_admin":
        return <DashboardSuperAdmin {...adminProps} />;
      case "operations":
        return <DashboardOperations {...adminProps} />;
      case "finance":
        return <DashboardFinance {...adminProps} />;
      case "sales":
        return <DashboardSales {...adminProps} />;
      case "company_admin":
        return <DashboardCompanyAdmin {...customerProps} />;
      case "ops_pic":
        return <DashboardOpsPic {...customerProps} />;
      case "finance_pic":
        return <DashboardFinancePic {...customerProps} />;
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
