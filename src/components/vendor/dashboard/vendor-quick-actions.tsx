"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardList, Plus, ListChecks, Zap } from "lucide-react";
import { useAuthStore } from "@/lib/store";
import {
  isVendorAdminUser,
  isVendorFinanceUser,
  isVendorOpsUser,
} from "@/lib/auth-role";

export function VendorQuickActions() {
  const t = useTranslations("Vendor.dashboard");
  const router = useRouter();
  const { user } = useAuthStore();

  const canJobOrders =
    isVendorAdminUser(user) || isVendorOpsUser(user);
  const canInvoices =
    isVendorAdminUser(user) || isVendorFinanceUser(user);

  const items = [
    canJobOrders
      ? {
          key: "pendingJobs",
          label: t("quickActions.viewPending"),
          icon: ClipboardList,
          onClick: () =>
            router.push("/dashboard/vendor/job-orders?status=pending_acceptance"),
          tone: "bg-amber-50 text-amber-700 border-amber-100",
        }
      : null,
    canInvoices
      ? {
          key: "createInvoice",
          label: t("quickActions.createInvoice"),
          icon: Plus,
          onClick: () => router.push("/dashboard/vendor/invoices?create=1"),
          tone: "bg-emerald-50 text-emerald-700 border-emerald-100",
        }
      : null,
    canJobOrders
      ? {
          key: "myJobOrders",
          label: t("quickActions.myJobOrders"),
          icon: ListChecks,
          onClick: () => router.push("/dashboard/vendor/job-orders"),
          tone: "bg-blue-50 text-blue-700 border-blue-100",
        }
      : null,
  ].filter(Boolean) as Array<{
    key: string;
    label: string;
    icon: typeof ClipboardList;
    onClick: () => void;
    tone: string;
  }>;

  if (items.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Zap className="h-4 w-4 text-zinc-600" />
          {t("quickActions.title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-2 sm:grid-cols-3">
        {items.map(({ key, label, icon: Icon, onClick, tone }) => (
          <button
            key={key}
            onClick={onClick}
            className={`flex h-20 flex-col items-center justify-center gap-2 rounded-lg border p-3 text-sm font-medium transition-colors hover:opacity-80 ${tone}`}
          >
            <Icon className="h-5 w-5" />
            {label}
          </button>
        ))}
      </CardContent>
    </Card>
  );
}
