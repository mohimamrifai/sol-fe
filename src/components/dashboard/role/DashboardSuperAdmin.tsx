"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/routing";
import {
  Building2,
  FileText,
  Truck,
  Receipt,
  Wallet,
  Bell,
  Activity,
  Plus,
  BarChart3,
  ClipboardList,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AdminStatsCards, type AdminStatCard } from "@/components/dashboard/admin/shared/admin-stats-cards";
import { AdminFilterBar } from "@/components/dashboard/admin/shared/admin-filter-bar";
import {
  formatDashboardCurrency,
  type AdminDashboardFilters,
  type AdminDashboardPayload,
  type AdminDashboardPeriod,
} from "@/lib/dashboard-api";
import {
  adminDashboardBookingLink,
  adminDashboardShipmentLink,
} from "@/lib/admin-dashboard-links";
import { cn } from "@/lib/utils";

const BOOKING_STATUS_KEYS = ["draft", "submitted", "under_review", "approved", "rejected"] as const;
const SHIPMENT_STATUS_KEYS = [
  "planning",
  "ready_operation",
  "pickup",
  "gate_in_origin",
  "loading",
  "train_departure",
  "train_arrival",
  "gate_out_destination",
  "delivery",
  "proof_of_delivery",
  "completed",
] as const;

type DashboardSuperAdminProps = {
  data: AdminDashboardPayload | null;
  loading?: boolean;
  filters?: AdminDashboardFilters;
  onFiltersChange?: (filters: AdminDashboardFilters) => void;
};

function StatusCountGrid({
  title,
  items,
  labelPrefix,
  linkForKey,
}: {
  title: string;
  items: Array<{ key: string; value: number }>;
  labelPrefix: "bookingStatus" | "shipmentStatus";
  linkForKey: (key: string) => string;
}) {
  const t = useTranslations("DashboardAdmin");

  return (
    <Card className="min-w-0">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2 sm:grid-cols-2">
          {items.map(({ key, value }) => (
            <Link
              key={key}
              href={linkForKey(key)}
              className={cn(
                buttonVariants({ variant: "outline" }),
                "h-auto min-h-10 justify-between px-3 py-2 text-left font-normal"
              )}
            >
              <span>{t(`${labelPrefix}.${key}` as Parameters<typeof t>[0])}</span>
              <span className="font-semibold tabular-nums">{value}</span>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function DashboardSuperAdmin({
  data,
  loading,
  filters: controlledFilters,
  onFiltersChange,
}: DashboardSuperAdminProps) {
  const t = useTranslations("DashboardAdmin");
  const router = useRouter();
  const [internalFilters, setInternalFilters] = useState<AdminDashboardFilters>({
    period: "today",
    businessDate: new Date().toISOString().slice(0, 10),
  });
  const filters = controlledFilters ?? internalFilters;
  const applyFilters = onFiltersChange ?? setInternalFilters;
  const [localPeriod, setLocalPeriod] = useState<AdminDashboardPeriod>(filters.period ?? "today");
  const [businessDate, setBusinessDate] = useState(filters.businessDate ?? new Date().toISOString().slice(0, 10));
  const [dateFrom, setDateFrom] = useState(filters.dateFrom ?? "");
  const [dateTo, setDateTo] = useState(filters.dateTo ?? "");

  const summary = data?.summary;
  const finance = data?.financeSummary;
  const operations = data?.todayOperations;
  const containers = data?.containerSummary;

  const summaryCards = useMemo<AdminStatCard[]>(() => {
    if (!summary) return [];
    return [
      {
        key: "totalCustomers",
        label: t("summary.totalCustomers"),
        value: summary.totalCustomers ?? summary.activeCompanies ?? 0,
        icon: Building2,
        iconClassName: "bg-sky-100 text-sky-700",
      },
      {
        key: "activeShipments",
        label: t("summary.activeShipments"),
        value: summary.activeShipments ?? 0,
        icon: Truck,
        iconClassName: "bg-indigo-100 text-indigo-700",
      },
      {
        key: "bookingsToday",
        label: t("summary.bookingsToday"),
        value: summary.bookingsToday ?? 0,
        icon: FileText,
        iconClassName: "bg-emerald-100 text-emerald-700",
      },
      {
        key: "revenueThisMonth",
        label: t("summary.revenueThisMonth"),
        value: formatDashboardCurrency(summary.revenueThisMonth ?? 0),
        icon: Receipt,
        iconClassName: "bg-violet-100 text-violet-700",
      },
      {
        key: "outstandingReceivable",
        label: t("summary.outstandingReceivable"),
        value: formatDashboardCurrency(summary.outstandingReceivable ?? 0),
        icon: Wallet,
        iconClassName: "bg-amber-100 text-amber-700",
      },
      {
        key: "outstandingPayable",
        label: t("summary.outstandingPayable"),
        value: formatDashboardCurrency(summary.outstandingPayable ?? 0),
        icon: Wallet,
        iconClassName: "bg-rose-100 text-rose-700",
      },
    ].map((card) => ({
      ...card,
      onClick: () => {
        const links: Record<string, string> = {
          totalCustomers: "/dashboard/admin/customer/customers",
          activeShipments: "/dashboard/admin/customer/shipments",
          bookingsToday: "/dashboard/admin/customer/bookings",
          revenueThisMonth: "/dashboard/admin/customer/invoices",
          outstandingReceivable: "/dashboard/admin/customer/invoices",
          outstandingPayable: "/dashboard/admin/vendor/invoices",
        };
        const href = links[card.key];
        if (href) router.push(href);
      },
    }));
  }, [summary, t, router]);

  const bookingItems = BOOKING_STATUS_KEYS.map((key) => ({
    key,
    value: data?.bookingStatusBreakdown?.[key] ?? 0,
  }));

  const shipmentItems = SHIPMENT_STATUS_KEYS.map((key) => ({
    key,
    value: data?.shipmentStatusBreakdown?.[key] ?? 0,
  }));

  if (loading) {
    return <p className="text-sm text-muted-foreground">{t("loading")}</p>;
  }

  return (
    <div className="flex min-w-0 w-full flex-1 flex-col gap-6">
      <AdminFilterBar>
        <div className="grid min-w-0 flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted-foreground">{t("filters.period")}</span>
            <select
              className="h-9 rounded-md border border-input bg-background px-3"
              value={localPeriod}
              onChange={(e) => setLocalPeriod(e.target.value as AdminDashboardPeriod)}
            >
              <option value="today">{t("filters.periodToday")}</option>
              <option value="week">{t("filters.periodWeek")}</option>
              <option value="month">{t("filters.periodMonth")}</option>
              <option value="custom">{t("filters.periodCustom")}</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted-foreground">{t("filters.businessDate")}</span>
            <input
              type="date"
              className="h-9 rounded-md border border-input bg-background px-3"
              value={businessDate}
              onChange={(e) => setBusinessDate(e.target.value)}
            />
          </label>
          {localPeriod === "custom" ? (
            <>
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-muted-foreground">{t("filters.dateFrom")}</span>
                <input
                  type="date"
                  className="h-9 rounded-md border border-input bg-background px-3"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-muted-foreground">{t("filters.dateTo")}</span>
                <input
                  type="date"
                  className="h-9 rounded-md border border-input bg-background px-3"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </label>
            </>
          ) : null}
        </div>
        <Button
          type="button"
          onClick={() =>
            applyFilters({
              period: localPeriod,
              businessDate,
              dateFrom: localPeriod === "custom" ? dateFrom : undefined,
              dateTo: localPeriod === "custom" ? dateTo : undefined,
            })
          }
        >
          {t("filters.apply")}
        </Button>
      </AdminFilterBar>

      <AdminStatsCards cards={summaryCards} columns={3} loading={loading} />

      <div className="grid min-w-0 gap-4 xl:grid-cols-2">
        <StatusCountGrid
          title={t("sections.bookingSummary")}
          items={bookingItems}
          labelPrefix="bookingStatus"
          linkForKey={adminDashboardBookingLink}
        />
        <StatusCountGrid
          title={t("sections.shipmentSummary")}
          items={shipmentItems}
          labelPrefix="shipmentStatus"
          linkForKey={adminDashboardShipmentLink}
        />
      </div>

      <div className="grid min-w-0 gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("sections.todayOperations")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {operations ? (
              Object.entries(operations).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between gap-2">
                  <span>{t(`operations.${key}` as Parameters<typeof t>[0])}</span>
                  <span className="font-semibold tabular-nums">{value}</span>
                </div>
              ))
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("sections.financeSummary")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {finance ? (
              Object.entries(finance).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between gap-2">
                  <span>{t(`finance.${key}` as Parameters<typeof t>[0])}</span>
                  <span className="font-semibold tabular-nums">{formatDashboardCurrency(Number(value))}</span>
                </div>
              ))
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("sections.containerSummary")}</CardTitle>
            <CardDescription>Container asset registry akan aktif di Fase 4.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {containers ? (
              Object.entries(containers).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between gap-2">
                  <span>{t(`container.${key}` as Parameters<typeof t>[0])}</span>
                  <span className="font-semibold tabular-nums">{value}</span>
                </div>
              ))
            ) : null}
          </CardContent>
        </Card>
      </div>

      <div className="grid min-w-0 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="h-4 w-4" />
              {t("sections.recentActivity")}
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("activity.time")}</TableHead>
                  <TableHead>{t("activity.module")}</TableHead>
                  <TableHead>{t("activity.activity")}</TableHead>
                  <TableHead>{t("activity.user")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data?.recentActivity ?? []).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      {t("activity.empty")}
                    </TableCell>
                  </TableRow>
                ) : (
                  data?.recentActivity.map((row, index) => (
                    <TableRow key={`${row.time}-${index}`}>
                      <TableCell>{row.time}</TableCell>
                      <TableCell>{row.module}</TableCell>
                      <TableCell>{row.activity}</TableCell>
                      <TableCell>{row.user}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Bell className="h-4 w-4" />
              {t("sections.notifications")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {(data?.notifications ?? []).length === 0 ? (
              <p className="text-muted-foreground">{t("notifications.empty")}</p>
            ) : (
              data?.notifications.map((item) => (
                <Link
                  key={item.key}
                  href={item.link ?? "/dashboard"}
                  className="block rounded-md border border-border px-3 py-2 transition-colors hover:bg-muted/50"
                >
                  {t(`notifications.${item.key}` as Parameters<typeof t>[0], { count: item.count })}
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("sections.quickActions")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Link href="/dashboard/admin/customer/customers/create" className={buttonVariants()}>
            <Plus className="mr-2 h-4 w-4" />
            {t("quickActions.createCustomer")}
          </Link>
          <Link href="/dashboard/admin/customer/bookings/create" className={buttonVariants({ variant: "outline" })}>
            <FileText className="mr-2 h-4 w-4" />
            {t("quickActions.createBooking")}
          </Link>
          <Link href="/dashboard/admin/customer/shipments" className={buttonVariants({ variant: "outline" })}>
            <Truck className="mr-2 h-4 w-4" />
            {t("quickActions.shipmentPlanning")}
          </Link>
          <Link href="/dashboard/admin/customer/invoices" className={buttonVariants({ variant: "outline" })}>
            <Receipt className="mr-2 h-4 w-4" />
            {t("quickActions.customerInvoice")}
          </Link>
          <Link href="/dashboard/admin/vendor/job-orders" className={buttonVariants({ variant: "outline" })}>
            <ClipboardList className="mr-2 h-4 w-4" />
            {t("quickActions.vendorJobOrder")}
          </Link>
          <Link href="/dashboard/admin/reports/shipment" className={buttonVariants({ variant: "outline" })}>
            <BarChart3 className="mr-2 h-4 w-4" />
            {t("quickActions.reports")}
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
