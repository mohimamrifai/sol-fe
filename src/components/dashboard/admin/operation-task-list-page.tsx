"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PaginationBar } from "@/components/data-table/pagination-bar";
import { TableToolbar } from "@/components/data-table/table-toolbar";
import { AdminListFilters } from "@/components/data-table/admin-list-filters";
import { AdminPageHeader } from "@/components/dashboard/admin/shared/admin-page-header";
import { actionsCellClass, actionsHeadClass, ADMIN_LIST_PAGE_CLASS } from "@/components/dashboard/admin/shared/admin-list-table-styles";
import { AdminStatsCards } from "@/components/dashboard/admin/shared/admin-stats-cards";
import { useAuthPersistHydrated } from "@/hooks/use-auth-hydrated";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { fetchAdminLocations, fetchAdminOperationTasks, fetchAdminOperationTaskStats, fetchAdminVendors } from "@/lib/admin-api";
import { rowNumber } from "@/lib/list-query";
import type { LaravelPaginated } from "@/lib/types-api";
import { cn } from "@/lib/utils";
import { AlertTriangle, Ban, CheckCircle2, Clock, Eye, MoreHorizontal, PlayCircle, type LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";

const PER_PAGE = 10;
const STATUS_OPTIONS = ["waiting", "in_progress", "completed", "cancelled"] as const;

const STATUS_META: Record<(typeof STATUS_OPTIONS)[number], { icon: LucideIcon; iconClassName: string }> = {
  waiting: { icon: Clock, iconClassName: "text-amber-700 bg-amber-100" },
  in_progress: { icon: PlayCircle, iconClassName: "text-sky-700 bg-sky-100" },
  completed: { icon: CheckCircle2, iconClassName: "text-emerald-700 bg-emerald-100" },
  cancelled: { icon: Ban, iconClassName: "text-red-700 bg-red-100" },
};

type Props = {
  operationType: string;
  title: string;
  description: string;
  basePath: string;
  icon: LucideIcon;
};

export function OperationTaskListPage({ operationType, title, description, basePath, icon: Icon }: Props) {
  const router = useRouter();
  const authHydrated = useAuthPersistHydrated();
  const t = useTranslations("AdminFsdOperations");
  const tc = useTranslations("AdminCommon");

  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [meta, setMeta] = useState<LaravelPaginated<Record<string, unknown>> | null>(null);
  const [stats, setStats] = useState<Record<string, number> | null>(null);
  const [vendors, setVendors] = useState<{ id: number; label: string }[]>([]);
  const [locations, setLocations] = useState<{ id: number; label: string }[]>([]);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 400);
  const [statusFilter, setStatusFilter] = useState("all");
  const [vendorFilter, setVendorFilter] = useState("all");
  const [originFilter, setOriginFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [loading, setLoading] = useState(true);

  const statusLabel = useCallback(
    (value: string) => {
      const key = value.toLowerCase().replace(/\s+/g, "_") as (typeof STATUS_OPTIONS)[number];
      if (t.has(`statuses.${key}`)) return t(`statuses.${key}` as "statuses.waiting");
      return value;
    },
    [t]
  );

  const statusFilterOptions = useMemo(
    () => [
      { value: "all", label: tc("filters.allStatus") },
      ...STATUS_OPTIONS.map((key) => ({
        value: key,
        label: t(`statuses.${key}` as "statuses.waiting"),
      })),
    ],
    [t, tc]
  );

  const vendorFilterOptions = useMemo(
    () => [
      { value: "all", label: t("filters.allVendor") },
      ...vendors.map((v) => ({ value: String(v.id), label: v.label })),
    ],
    [t, vendors]
  );

  const originFilterOptions = useMemo(
    () => [
      { value: "all", label: t("filters.allOrigin") },
      ...locations.map((l) => ({ value: String(l.id), label: l.label })),
    ],
    [t, locations]
  );

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, vendorFilter, originFilter, dateFrom, dateTo]);

  const load = useCallback(async () => {
    if (!authHydrated) return;
    setLoading(true);
    try {
      const [listRes, statsRes] = await Promise.all([
        fetchAdminOperationTasks(operationType, {
          page,
          perPage: PER_PAGE,
          search: debouncedSearch || undefined,
          status: statusFilter === "all" ? undefined : statusFilter,
          vendor_id: vendorFilter === "all" ? undefined : vendorFilter,
          origin_location_id: originFilter === "all" ? undefined : originFilter,
          date_from: dateFrom || undefined,
          date_to: dateTo || undefined,
        }),
        fetchAdminOperationTaskStats(operationType),
      ]);
      setRows((listRes as LaravelPaginated<Record<string, unknown>>).data ?? []);
      setMeta(listRes as LaravelPaginated<Record<string, unknown>>);
      setStats((statsRes as { data: Record<string, number> }).data);
    } catch {
      setRows([]);
      setMeta(null);
    } finally {
      setLoading(false);
    }
  }, [authHydrated, operationType, page, debouncedSearch, statusFilter, vendorFilter, originFilter, dateFrom, dateTo]);

  useEffect(() => { void load(); }, [load]);

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

  const statCards = [
    { key: "waiting", label: t("stats.waiting"), value: stats?.waiting ?? 0, icon: STATUS_META.waiting.icon, iconClassName: STATUS_META.waiting.iconClassName },
    { key: "in_progress", label: t("stats.inProgress"), value: stats?.in_progress ?? 0, icon: STATUS_META.in_progress.icon, iconClassName: STATUS_META.in_progress.iconClassName },
    { key: "completed_today", label: t("stats.completedToday"), value: stats?.completed_today ?? 0, icon: STATUS_META.completed.icon, iconClassName: STATUS_META.completed.iconClassName },
    { key: "overdue", label: t("stats.overdue"), value: stats?.overdue ?? 0, icon: AlertTriangle, iconClassName: "text-orange-700 bg-orange-100" },
    { key: "cancelled", label: t("stats.cancelled"), value: stats?.cancelled ?? 0, icon: STATUS_META.cancelled.icon, iconClassName: STATUS_META.cancelled.iconClassName },
  ];

  return (
    <div className={ADMIN_LIST_PAGE_CLASS}>
      <AdminPageHeader icon={Icon} title={title} description={description} />

      <AdminStatsCards className="sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5" cards={statCards} />

      <Card className="min-w-0 overflow-hidden">
        <CardHeader className="space-y-1 pb-3">
          <CardTitle className="text-base">{t("filterTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <TableToolbar searchPlaceholder={t("searchPlaceholder")} searchValue={search} onSearchChange={setSearch} />
          <AdminListFilters
            selects={[
              {
                id: "op-status",
                label: tc("table.status"),
                value: statusFilter,
                onChange: setStatusFilter,
                options: statusFilterOptions,
              },
              {
                id: "op-vendor",
                label: t("columns.vendor"),
                value: vendorFilter,
                onChange: setVendorFilter,
                options: vendorFilterOptions,
                searchable: true,
              },
              {
                id: "op-origin",
                label: t("filters.origin"),
                value: originFilter,
                onChange: setOriginFilter,
                options: originFilterOptions,
                searchable: true,
              },
            ]}
            dates={[
              {
                id: "op-date-from",
                label: `${t("filters.plannedDate")} (${tc("filters.from")})`,
                value: dateFrom,
                onChange: setDateFrom,
              },
              {
                id: "op-date-to",
                label: `${t("filters.plannedDate")} (${tc("filters.to")})`,
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
                    <TableHead>{t("columns.shipment")}</TableHead>
                    <TableHead>{t("columns.booking")}</TableHead>
                    <TableHead>{t("columns.customer")}</TableHead>
                    <TableHead>{t("columns.plannedDate")}</TableHead>
                    <TableHead>{t("columns.vendor")}</TableHead>
                    <TableHead>{tc("table.status")}</TableHead>
                    <TableHead className={actionsHeadClass}>
                      <span className="max-md:sr-only">{tc("table.actions")}</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r, i) => (
                    <TableRow key={String(r.id)} className="group">
                      <TableCell className="tabular-nums text-muted-foreground">{rowNumber(meta?.current_page ?? page, PER_PAGE, i)}</TableCell>
                      <TableCell className="font-mono text-xs">{String(r.shipment_number ?? "—")}</TableCell>
                      <TableCell className="text-sm">{String(r.booking_number ?? "—")}</TableCell>
                      <TableCell className="font-medium">{String(r.customer ?? "—")}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{String(r.planned_date ?? "—")}</TableCell>
                      <TableCell>{String(r.vendor ?? "—")}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {r.status ? statusLabel(String(r.status)) : String(r.status_label ?? "—")}
                        </Badge>
                      </TableCell>
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
