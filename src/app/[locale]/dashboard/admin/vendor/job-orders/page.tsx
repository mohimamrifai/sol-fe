"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
import { useVendorJobOrderStatusLabel } from "@/hooks/use-admin-status-labels";
import {
  fetchAdminLocations,
  fetchAdminVendorJobOrders,
  fetchAdminVendorJobOrderStats,
  fetchAdminVendors,
} from "@/lib/admin-api";
import { ApiError } from "@/lib/api-client";
import { rowNumber } from "@/lib/list-query";
import type { LaravelPaginated } from "@/lib/types-api";
import { cn } from "@/lib/utils";
import {
  Ban,
  CheckCircle2,
  ClipboardList,
  Eye,
  FilePenLine,
  MoreHorizontal,
  Send,
  Truck,
} from "lucide-react";
import { useTranslations } from "next-intl";

const PER_PAGE = 10;
const STATUS_OPTIONS = ["draft", "sent", "in_progress", "completed", "cancelled"] as const;
const SERVICE_TYPE_KEYS = ["pickup", "delivery", "rail"] as const;

const STATUS_META: Record<(typeof STATUS_OPTIONS)[number], { icon: typeof FilePenLine; iconClassName: string }> = {
  draft: { icon: FilePenLine, iconClassName: "text-zinc-600 bg-zinc-100" },
  sent: { icon: Send, iconClassName: "text-sky-700 bg-sky-100" },
  in_progress: { icon: Truck, iconClassName: "text-amber-700 bg-amber-100" },
  completed: { icon: CheckCircle2, iconClassName: "text-emerald-700 bg-emerald-100" },
  cancelled: { icon: Ban, iconClassName: "text-red-700 bg-red-100" },
};

export default function AdminVendorJobOrdersPage() {
  const params = useParams();
  const router = useRouter();
  const locale = String(params?.locale ?? "id");
  const basePath = `/${locale}/dashboard/admin/vendor/job-orders`;
  const authHydrated = useAuthPersistHydrated();
  const t = useTranslations("AdminVendorJobOrders");
  const tc = useTranslations("AdminCommon");
  const vendorJobOrderStatusLabel = useVendorJobOrderStatusLabel();

  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [meta, setMeta] = useState<LaravelPaginated<Record<string, unknown>> | null>(null);
  const [stats, setStats] = useState<Record<string, number> | null>(null);
  const [vendors, setVendors] = useState<{ id: number; label: string }[]>([]);
  const [locations, setLocations] = useState<{ id: number; label: string }[]>([]);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 400);
  const [vendorFilter, setVendorFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [serviceTypeFilter, setServiceTypeFilter] = useState("all");
  const [originFilter, setOriginFilter] = useState("all");
  const [destinationFilter, setDestinationFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const vendorFilterOptions = useMemo(
    () => [
      { value: "all", label: t("filters.allVendor") },
      ...vendors.map((v) => ({ value: String(v.id), label: v.label })),
    ],
    [t, vendors]
  );

  const serviceTypeFilterOptions = useMemo(
    () => [
      { value: "all", label: t("filters.allService") },
      ...SERVICE_TYPE_KEYS.map((key) => ({
        value: key,
        label: t(`serviceTypes.${key}`),
      })),
    ],
    [t]
  );

  const statusFilterOptions = useMemo(
    () => [
      { value: "all", label: t("filters.allStatus") },
      ...STATUS_OPTIONS.map((key) => ({
        value: key,
        label: t(`stats.${key}` as "stats.draft"),
      })),
    ],
    [t]
  );

  const originFilterOptions = useMemo(
    () => [
      { value: "all", label: t("filters.allOrigin") },
      ...locations.map((l) => ({ value: String(l.id), label: l.label })),
    ],
    [t, locations]
  );

  const destinationFilterOptions = useMemo(
    () => [
      { value: "all", label: t("filters.allDestination") },
      ...locations.map((l) => ({ value: String(l.id), label: l.label })),
    ],
    [t, locations]
  );

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, vendorFilter, statusFilter, serviceTypeFilter, originFilter, destinationFilter, dateFrom, dateTo]);

  const load = useCallback(async () => {
    if (!authHydrated) return;
    setLoading(true);
    setError(null);
    try {
      const [listRes, statsRes] = await Promise.all([
        fetchAdminVendorJobOrders({
          page,
          perPage: PER_PAGE,
          search: debouncedSearch || undefined,
          vendor_id: vendorFilter === "all" ? undefined : vendorFilter,
          status: statusFilter === "all" ? undefined : statusFilter,
          service_type: serviceTypeFilter === "all" ? undefined : serviceTypeFilter,
          origin_location_id: originFilter === "all" ? undefined : originFilter,
          destination_location_id: destinationFilter === "all" ? undefined : destinationFilter,
          date_from: dateFrom || undefined,
          date_to: dateTo || undefined,
        }),
        fetchAdminVendorJobOrderStats(),
      ]);
      setRows((listRes as LaravelPaginated<Record<string, unknown>>).data ?? []);
      setMeta(listRes as LaravelPaginated<Record<string, unknown>>);
      setStats((statsRes as { data: Record<string, number> }).data);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t("toasts.loadFailed"));
      setRows([]);
      setMeta(null);
    } finally {
      setLoading(false);
    }
  }, [
    authHydrated,
    page,
    debouncedSearch,
    vendorFilter,
    statusFilter,
    serviceTypeFilter,
    originFilter,
    destinationFilter,
    dateFrom,
    dateTo,
    t,
  ]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!authHydrated) return;
    void Promise.all([
      fetchAdminVendors({ perPage: 500 }),
      fetchAdminLocations({ perPage: 500 }),
    ]).then(([vRes, lRes]) => {
      setVendors(((vRes as LaravelPaginated<Record<string, unknown>>).data ?? []).map((v) => ({
        id: Number(v.id),
        label: String(v.name ?? v.code),
      })));
      setLocations(((lRes as LaravelPaginated<Record<string, unknown>>).data ?? []).map((l) => ({
        id: Number(l.id),
        label: `${l.code ?? ""} · ${l.name ?? l.id}`.trim(),
      })));
    });
  }, [authHydrated]);

  return (
    <div className={ADMIN_LIST_PAGE_CLASS}>
      <AdminPageHeader icon={ClipboardList} title={t("pageTitle")} description={t("pageSubtitle")} />

      {error ? (
        <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      ) : null}

      <AdminStatsCards
        className="sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
        cards={STATUS_OPTIONS.map((st) => {
          const meta = STATUS_META[st];
          return {
            key: st,
            label: t(`stats.${st}` as "stats.draft"),
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
            defaultSearchPlaceholder={t("searchPlaceholder")}
            selects={[
              {
                id: "jo-vendor",
                label: t("columns.vendor"),
                value: vendorFilter,
                onChange: setVendorFilter,
                options: vendorFilterOptions,
                searchable: true,
              },
              {
                id: "jo-service",
                label: t("columns.service"),
                value: serviceTypeFilter,
                onChange: setServiceTypeFilter,
                options: serviceTypeFilterOptions,
              },
              {
                id: "jo-status",
                label: t("columns.status"),
                value: statusFilter,
                onChange: setStatusFilter,
                options: statusFilterOptions,
              },
              {
                id: "jo-origin",
                label: t("filters.origin"),
                value: originFilter,
                onChange: setOriginFilter,
                options: originFilterOptions,
                searchable: true,
              },
              {
                id: "jo-destination",
                label: t("filters.destination"),
                value: destinationFilter,
                onChange: setDestinationFilter,
                options: destinationFilterOptions,
                searchable: true,
              },
            ]}
            dates={[
              {
                id: "jo-date-from",
                label: `${t("filters.createdDate")} (${tc("filters.from")})`,
                value: dateFrom,
                onChange: setDateFrom,
              },
              {
                id: "jo-date-to",
                label: `${t("filters.createdDate")} (${tc("filters.to")})`,
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
                    <TableHead>{t("columns.joNo")}</TableHead>
                    <TableHead>{t("columns.shipment")}</TableHead>
                    <TableHead>{t("columns.vendor")}</TableHead>
                    <TableHead>{t("columns.service")}</TableHead>
                    <TableHead>{t("columns.route")}</TableHead>
                    <TableHead>{t("columns.status")}</TableHead>
                    <TableHead>{t("columns.created")}</TableHead>
                    <TableHead className={actionsHeadClass}>
                      <span className="max-md:sr-only">{tc("table.actions")}</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r, i) => (
                    <TableRow key={String(r.id)} className="group">
                      <TableCell className="tabular-nums text-muted-foreground">
                        {rowNumber(meta?.current_page ?? page, PER_PAGE, i)}
                      </TableCell>
                      <TableCell className="font-mono text-xs">{String(r.job_order_number)}</TableCell>
                      <TableCell>{String(r.shipment_number ?? "—")}</TableCell>
                      <TableCell className="font-medium">{String(r.vendor ?? "—")}</TableCell>
                      <TableCell>{String(r.service_label ?? "—")}</TableCell>
                      <TableCell>{String(r.route ?? "—")}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {String(r.status_label ?? vendorJobOrderStatusLabel(String(r.status)))}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {r.created_at ? new Date(String(r.created_at)).toLocaleDateString("id-ID") : "—"}
                      </TableCell>
                      <TableCell className={cn(actionsCellClass, "p-2 text-right")}>
                        <div className="flex justify-end">
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), "shrink-0")}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">{tc("actions.actionsMenu")}</span>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="min-w-44">
                              <DropdownMenuItem
                                className="cursor-pointer"
                                onClick={() => router.push(`${basePath}/${r.id}`)}
                              >
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
                <PaginationBar
                  currentPage={meta.current_page}
                  lastPage={meta.last_page}
                  total={meta.total}
                  from={meta.from}
                  to={meta.to}
                  onPageChange={setPage}
                />
              ) : null}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
