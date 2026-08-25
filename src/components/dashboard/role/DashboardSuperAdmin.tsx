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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  adminDashboardContainerLink,
  adminDashboardFinanceLink,
  adminDashboardOperationsLink,
  adminDashboardShipmentLink,
  adminDashboardSummaryLink,
} from "@/lib/admin-dashboard-links";
import { hasFeatureAccess } from "@/lib/feature-access";
import { useAuthStore } from "@/lib/store";
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

function StatusCountTable({
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
    <div className="min-w-0">
      <h3 className="mb-3 text-sm font-medium text-muted-foreground">{title}</h3>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("table.status")}</TableHead>
            <TableHead className="text-right">{t("table.total")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map(({ key, value }) => (
            <TableRow key={key} className="hover:bg-muted/50">
              <TableCell>
                <Link
                  href={linkForKey(key)}
                  className="block w-full text-foreground hover:underline"
                >
                  {t(`${labelPrefix}.${key}` as Parameters<typeof t>[0])}
                </Link>
              </TableCell>
              <TableCell className="text-right font-semibold tabular-nums">
                <Link href={linkForKey(key)} className="block w-full">
                  {value}
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function ClickableMetricList({
  items,
  labelPrefix,
  linkForKey,
  formatValue,
}: {
  items: Array<{ key: string; value: number }>;
  labelPrefix: "operations" | "finance" | "container";
  linkForKey: (key: string) => string;
  formatValue?: (value: number) => string;
}) {
  const t = useTranslations("DashboardAdmin");

  return (
    <div className="space-y-2 text-sm">
      {items.map(({ key, value }) => (
        <Link
          key={key}
          href={linkForKey(key)}
          className={cn(
            buttonVariants({ variant: "outline" }),
            "flex h-auto min-h-10 w-full cursor-pointer items-center justify-between gap-2 px-3 py-2 font-normal"
          )}
        >
          <span>{t(`${labelPrefix}.${key}` as Parameters<typeof t>[0])}</span>
          <span className="font-semibold tabular-nums">
            {formatValue ? formatValue(value) : value}
          </span>
        </Link>
      ))}
    </div>
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
  const { user } = useAuthStore();
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

  const sections = data?.sections;
  const summary = data?.summary;
  const finance = data?.financeSummary;
  const operations = data?.todayOperations;
  const containers = data?.containerSummary;
  const dateRange = {
    dateFrom: data?.filters?.dateFrom ?? filters.dateFrom,
    dateTo: data?.filters?.dateTo ?? filters.dateTo,
  };

  const summaryCards = useMemo<AdminStatCard[]>(() => {
    if (!summary) return [];
    return [
      {
        key: "totalCustomers",
        label: t("summary.totalCustomers"),
        value: summary.totalCustomers ?? 0,
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
        router.push(adminDashboardSummaryLink(card.key, filters.businessDate));
      },
    }));
  }, [summary, t, router, filters.businessDate]);

  const bookingItems = BOOKING_STATUS_KEYS.map((key) => ({
    key,
    value: data?.bookingStatusBreakdown?.[key] ?? 0,
  }));

  const shipmentItems = SHIPMENT_STATUS_KEYS.map((key) => ({
    key,
    value: data?.shipmentStatusBreakdown?.[key] ?? 0,
  }));

  const operationItems = operations
    ? Object.entries(operations).map(([key, value]) => ({ key, value: Number(value) }))
    : [];

  const financeItems = finance
    ? Object.entries(finance).map(([key, value]) => ({ key, value: Number(value) }))
    : [];

  const containerItems = containers
    ? Object.entries(containers).map(([key, value]) => ({ key, value: Number(value) }))
    : [];

  const quickActions = [
    {
      key: "createCustomer",
      href: "/dashboard/admin/customer/customers/create",
      icon: Plus,
      variant: "default" as const,
      visible: hasFeatureAccess(user, "create_companies"),
    },
    {
      key: "createBooking",
      href: "/dashboard/admin/customer/bookings/create",
      icon: FileText,
      variant: "outline" as const,
      visible: hasFeatureAccess(user, "create_bookings"),
    },
    {
      key: "shipmentPlanning",
      href: "/dashboard/admin/customer/shipments?status=created",
      icon: Truck,
      variant: "outline" as const,
      visible: hasFeatureAccess(user, "view_shipments"),
    },
    {
      key: "customerInvoice",
      href: "/dashboard/admin/customer/invoices?action=create",
      icon: Receipt,
      variant: "outline" as const,
      visible: hasFeatureAccess(user, "create_invoices") || hasFeatureAccess(user, "view_invoices"),
    },
    {
      key: "vendorJobOrder",
      href: "/dashboard/admin/vendor/job-orders",
      icon: ClipboardList,
      variant: "outline" as const,
      visible:
        hasFeatureAccess(user, "view_vendor_job_orders_admin") ||
        hasFeatureAccess(user, "manage_vendor_job_orders_admin"),
    },
    {
      key: "reports",
      href: "/dashboard/admin/reports/booking",
      icon: BarChart3,
      variant: "outline" as const,
      visible: hasFeatureAccess(user, "view_reports"),
    },
  ].filter((action) => action.visible);

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

      {sections?.summary && summaryCards.length > 0 ? (
        <AdminStatsCards cards={summaryCards} columns={3} loading={loading} />
      ) : null}

      {sections?.bookingStatus || sections?.shipmentStatus ? (
        <Card className="min-w-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t("sections.bookingSummary")}</CardTitle>
          </CardHeader>
          <CardContent className="grid min-w-0 gap-6 xl:grid-cols-2">
            {sections?.bookingStatus ? (
              <StatusCountTable
                title={t("subsections.bookingStatus")}
                items={bookingItems}
                labelPrefix="bookingStatus"
                linkForKey={adminDashboardBookingLink}
              />
            ) : null}
            {sections?.shipmentStatus ? (
              <StatusCountTable
                title={t("subsections.shipmentStatus")}
                items={shipmentItems}
                labelPrefix="shipmentStatus"
                linkForKey={adminDashboardShipmentLink}
              />
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {sections?.todayOperations || sections?.financeSummary || sections?.containerSummary ? (
        <div className="grid min-w-0 gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {sections?.todayOperations && operations ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t("sections.todayOperations")}</CardTitle>
              </CardHeader>
              <CardContent>
                <ClickableMetricList
                  items={operationItems}
                  labelPrefix="operations"
                  linkForKey={(key) => adminDashboardOperationsLink(key, filters.businessDate)}
                />
              </CardContent>
            </Card>
          ) : null}

          {sections?.financeSummary && finance ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t("sections.financeSummary")}</CardTitle>
              </CardHeader>
              <CardContent>
                <ClickableMetricList
                  items={financeItems}
                  labelPrefix="finance"
                  linkForKey={(key) => adminDashboardFinanceLink(key, dateRange)}
                  formatValue={(value) => formatDashboardCurrency(value)}
                />
              </CardContent>
            </Card>
          ) : null}

          {sections?.containerSummary && containers ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t("sections.containerSummary")}</CardTitle>
              </CardHeader>
              <CardContent>
                <ClickableMetricList
                  items={containerItems}
                  labelPrefix="container"
                  linkForKey={adminDashboardContainerLink}
                />
              </CardContent>
            </Card>
          ) : null}
        </div>
      ) : null}

      {sections?.recentActivity || sections?.notifications ? (
        <div className="grid min-w-0 gap-4 xl:grid-cols-3">
          {sections?.recentActivity ? (
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
                      data?.recentActivity?.map((row, index) => (
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
          ) : null}

          {sections?.notifications ? (
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
                  data?.notifications?.map((item) => (
                    <Link
                      key={item.key}
                      href={item.link ?? "/dashboard"}
                      className="block cursor-pointer rounded-md border border-border px-3 py-2 transition-colors hover:bg-muted/50"
                    >
                      {t(`notifications.${item.key}` as Parameters<typeof t>[0], { count: item.count })}
                    </Link>
                  ))
                )}
              </CardContent>
            </Card>
          ) : null}
        </div>
      ) : null}

      {sections?.quickActions && quickActions.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("sections.quickActions")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.key}
                  href={action.href}
                  className={cn(buttonVariants({ variant: action.variant }), "cursor-pointer")}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  {t(`quickActions.${action.key}` as Parameters<typeof t>[0])}
                </Link>
              );
            })}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
