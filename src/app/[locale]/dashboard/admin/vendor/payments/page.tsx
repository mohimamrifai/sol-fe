"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PaginationBar } from "@/components/data-table/pagination-bar";
import { TableToolbar } from "@/components/data-table/table-toolbar";
import { AdminListFilters } from "@/components/data-table/admin-list-filters";
import { AdminPageHeader } from "@/components/dashboard/admin/shared/admin-page-header";
import {
  actionsCellClass,
  actionsHeadClass,
  ADMIN_LIST_PAGE_CLASS,
} from "@/components/dashboard/admin/shared/admin-list-table-styles";
import { AdminStatsCards } from "@/components/dashboard/admin/shared/admin-stats-cards";
import { useAuthPersistHydrated } from "@/hooks/use-auth-hydrated";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useVendorPaymentStatusLabel } from "@/hooks/use-admin-status-labels";
import { fetchAdminVendorPayments, fetchAdminVendorPaymentStats, fetchAdminVendors } from "@/lib/admin-api";
import { rowNumber } from "@/lib/list-query";
import type { LaravelPaginated } from "@/lib/types-api";
import { formatIdr, VENDOR_PAYMENT_METHOD_OPTIONS } from "@/lib/vendor-fsd-options";
import { cn } from "@/lib/utils";
import {
  Ban,
  CheckCircle2,
  Clock,
  CreditCard,
  Eye,
  MoreHorizontal,
  Wallet,
} from "lucide-react";
import { useTranslations } from "next-intl";

const PER_PAGE = 10;
const STATUS = ["waiting_approval", "ready_to_pay", "paid", "cancelled"] as const;

const STATUS_META: Record<(typeof STATUS)[number], { icon: typeof Clock; iconClassName: string }> = {
  waiting_approval: { icon: Clock, iconClassName: "text-amber-700 bg-amber-100" },
  ready_to_pay: { icon: Wallet, iconClassName: "text-sky-700 bg-sky-100" },
  paid: { icon: CheckCircle2, iconClassName: "text-emerald-700 bg-emerald-100" },
  cancelled: { icon: Ban, iconClassName: "text-red-700 bg-red-100" },
};

export default function AdminVendorPaymentsPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = String(params?.locale ?? "id");
  const basePath = `/${locale}/dashboard/admin/vendor/payments`;
  const authHydrated = useAuthPersistHydrated();
  const t = useTranslations("AdminVendorPayments");
  const tc = useTranslations("AdminCommon");
  const vendorPaymentStatusLabel = useVendorPaymentStatusLabel();

  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [meta, setMeta] = useState<LaravelPaginated<Record<string, unknown>> | null>(null);
  const [stats, setStats] = useState<Record<string, number> | null>(null);
  const [vendors, setVendors] = useState<{ id: number; label: string }[]>([]);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 400);
  const [vendorFilter, setVendorFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const dateFromParam = searchParams.get("date_from");
    const dateToParam = searchParams.get("date_to");
    if (dateFromParam) setDateFrom(dateFromParam);
    if (dateToParam) setDateTo(dateToParam);
  }, [searchParams]);

  const vendorFilterOptions = useMemo(
    () => [
      { value: "all", label: t("filters.allVendor") },
      ...vendors.map((v) => ({ value: String(v.id), label: v.label })),
    ],
    [t, vendors]
  );

  const statusFilterOptions = useMemo(
    () => [
      { value: "all", label: t("filters.allStatus") },
      ...STATUS.map((key) => ({
        value: key,
        label: t(`stats.${key}` as "stats.paid"),
      })),
    ],
    [t]
  );

  const paymentMethodFilterOptions = useMemo(
    () => [
      { value: "all", label: t("filters.allMethod") },
      ...VENDOR_PAYMENT_METHOD_OPTIONS.map((m) => ({
        value: m.value,
        label: t(`paymentMethods.${m.value}` as "paymentMethods.transfer"),
      })),
    ],
    [t]
  );

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, vendorFilter, statusFilter, paymentMethodFilter, dateFrom, dateTo]);

  const load = useCallback(async () => {
    if (!authHydrated) return;
    setLoading(true);
    try {
      const [listRes, statsRes] = await Promise.all([
        fetchAdminVendorPayments({
          page,
          perPage: PER_PAGE,
          search: debouncedSearch || undefined,
          vendor_id: vendorFilter === "all" ? undefined : vendorFilter,
          status: statusFilter === "all" ? undefined : statusFilter,
          payment_method: paymentMethodFilter === "all" ? undefined : paymentMethodFilter,
          date_from: dateFrom || undefined,
          date_to: dateTo || undefined,
        }),
        fetchAdminVendorPaymentStats(),
      ]);
      setRows((listRes as LaravelPaginated<Record<string, unknown>>).data ?? []);
      setMeta(listRes as LaravelPaginated<Record<string, unknown>>);
      setStats((statsRes as { data: Record<string, number> }).data);
    } finally {
      setLoading(false);
    }
  }, [authHydrated, page, debouncedSearch, vendorFilter, statusFilter, paymentMethodFilter, dateFrom, dateTo]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    if (!authHydrated) return;
    void fetchAdminVendors({ perPage: 500 }).then((res) => {
      setVendors(((res as LaravelPaginated<Record<string, unknown>>).data ?? []).map((v) => ({
        id: Number(v.id),
        label: String(v.name ?? v.code),
      })));
    });
  }, [authHydrated]);

  return (
    <div className={ADMIN_LIST_PAGE_CLASS}>
      <AdminPageHeader
        icon={CreditCard}
        title={t("pageTitle")}
        description={t("pageSubtitle")}
      />

      <AdminStatsCards
        className="sm:grid-cols-2 xl:grid-cols-4"
        cards={STATUS.map((st) => {
          const meta = STATUS_META[st];
          return {
            key: st,
            label: t(`stats.${st}` as "stats.paid"),
            value: stats?.[st] ?? 0,
            icon: meta.icon,
            iconClassName: meta.iconClassName,
          };
        })}
      />

      <Card className="min-w-0 overflow-hidden">
        <CardHeader className="space-y-1 pb-3">
          <CardTitle className="text-base">{t("filterTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <TableToolbar searchPlaceholder={t("searchPlaceholder")} searchValue={search} onSearchChange={setSearch} />
          <AdminListFilters
            selects={[
              {
                id: "vp-vendor",
                label: t("columns.vendor"),
                value: vendorFilter,
                searchable: true,
                onChange: setVendorFilter,
                options: vendorFilterOptions,
              },
              {
                id: "vp-status",
                label: t("columns.status"),
                value: statusFilter,
                onChange: setStatusFilter,
                options: statusFilterOptions,
              },
              {
                id: "vp-method",
                label: t("columns.paymentMethod"),
                value: paymentMethodFilter,
                onChange: setPaymentMethodFilter,
                options: paymentMethodFilterOptions,
              },
            ]}
            dates={[
              {
                id: "vp-date-from",
                label: `${t("filters.paymentDate")} (${tc("filters.from")})`,
                value: dateFrom,
                onChange: setDateFrom,
              },
              {
                id: "vp-date-to",
                label: `${t("filters.paymentDate")} (${tc("filters.to")})`,
                value: dateTo,
                onChange: setDateTo,
              },
            ]}
          />
        </CardContent>
      </Card>

      <Card className="min-w-0 overflow-hidden">
        <CardHeader className="space-y-1">
          <CardTitle>{t("listTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <p className="text-sm text-muted-foreground">{tc("actions.loading")}</p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-14">{tc("table.no")}</TableHead>
                    <TableHead>{t("columns.paymentNo")}</TableHead>
                    <TableHead>{t("columns.vendor")}</TableHead>
                    <TableHead>{t("columns.invoiceNo")}</TableHead>
                    <TableHead className="text-right">{t("columns.invoiceAmount")}</TableHead>
                    <TableHead className="text-right">{t("columns.paid")}</TableHead>
                    <TableHead>{t("columns.date")}</TableHead>
                    <TableHead>{t("columns.status")}</TableHead>
                    <TableHead className={actionsHeadClass}>
                      <span className="max-md:sr-only">{tc("table.actions")}</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r, i) => (
                    <TableRow key={String(r.id)} className="group">
                      <TableCell className="tabular-nums text-muted-foreground">{rowNumber(meta?.current_page ?? page, PER_PAGE, i)}</TableCell>
                      <TableCell className="font-mono text-xs">{String(r.payment_number)}</TableCell>
                      <TableCell className="font-medium">{String(r.vendor)}</TableCell>
                      <TableCell>{String(r.vendor_invoice_no)}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatIdr(r.invoice_amount as string)}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatIdr(r.paid_amount as string)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{String(r.payment_date ?? "—")}</TableCell>
                      <TableCell><Badge variant="outline">{vendorPaymentStatusLabel(String(r.status))}</Badge></TableCell>
                      <TableCell className={cn(actionsCellClass, "p-2 text-right")}>
                        <div className="flex justify-end">
                          <DropdownMenu>
                            <DropdownMenuTrigger className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), "shrink-0")}>
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">{tc("actions.actionsMenu")}</span>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="min-w-44">
                              <DropdownMenuItem className="cursor-pointer" onClick={() => router.push(`${basePath}/${r.id}`)}>
                                <Eye className="h-4 w-4" /> {tc("actions.viewDetail")}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                {rows.length === 0 ? (
                  <TableCaption className="text-xs">{t("empty")}</TableCaption>
                ) : (
                  <TableCaption className="text-xs">{tc("table.rowsOnPage")}</TableCaption>
                )}
              </Table>
              {meta ? (
                <PaginationBar currentPage={meta.current_page} lastPage={meta.last_page} total={meta.total} from={meta.from} to={meta.to} onPageChange={setPage} />
              ) : null}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
