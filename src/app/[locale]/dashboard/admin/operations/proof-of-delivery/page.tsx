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
import { actionsCellClass, actionsHeadClass, ADMIN_LIST_PAGE_CLASS } from "@/components/dashboard/admin/shared/admin-list-table-styles";
import { AdminStatsCards } from "@/components/dashboard/admin/shared/admin-stats-cards";
import { useAuthPersistHydrated } from "@/hooks/use-auth-hydrated";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { fetchAdminProofOfDeliveries, fetchAdminProofOfDeliveryStats } from "@/lib/admin-api";
import { rowNumber } from "@/lib/list-query";
import type { LaravelPaginated } from "@/lib/types-api";
import { cn } from "@/lib/utils";
import { CheckCircle2, Clock, Eye, FileCheck, MoreHorizontal, XCircle } from "lucide-react";
import { useTranslations } from "next-intl";

const PER_PAGE = 10;
const STATUS_OPTIONS = ["waiting_pod", "received", "verified", "rejected"] as const;

const STATUS_META: Record<(typeof STATUS_OPTIONS)[number], { icon: typeof Clock; className: string }> = {
  waiting_pod: { icon: Clock, className: "bg-amber-100 text-amber-800" },
  received: { icon: FileCheck, className: "bg-sky-100 text-sky-800" },
  verified: { icon: CheckCircle2, className: "bg-emerald-100 text-emerald-800" },
  rejected: { icon: XCircle, className: "bg-red-100 text-red-800" },
};

export default function AdminProofOfDeliveryOperationsPage() {
  const params = useParams();
  const router = useRouter();
  const locale = String(params?.locale ?? "id");
  const basePath = `/${locale}/dashboard/admin/operations/proof-of-delivery`;
  const authHydrated = useAuthPersistHydrated();
  const t = useTranslations("AdminFsdOperations.pod");
  const tc = useTranslations("AdminCommon");

  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [meta, setMeta] = useState<LaravelPaginated<Record<string, unknown>> | null>(null);
  const [stats, setStats] = useState<Record<string, number> | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 400);
  const [statusFilter, setStatusFilter] = useState("all");
  const [podDateFrom, setPodDateFrom] = useState("");
  const [podDateTo, setPodDateTo] = useState("");
  const [loading, setLoading] = useState(true);

  const statusLabel = useCallback(
    (value: string) => {
      const key = value.toLowerCase().replace(/\s+/g, "_") as (typeof STATUS_OPTIONS)[number];
      if (t.has(`status.${key}`)) return t(`status.${key}` as "status.waiting_pod");
      return value;
    },
    [t]
  );

  const statusFilterOptions = useMemo(
    () => [
      { value: "all", label: tc("filters.allStatus") },
      ...STATUS_OPTIONS.map((key) => ({
        value: key,
        label: t(`status.${key}` as "status.waiting_pod"),
      })),
    ],
    [t, tc]
  );

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, podDateFrom, podDateTo]);

  const load = useCallback(async () => {
    if (!authHydrated) return;
    setLoading(true);
    try {
      const [listRes, statsRes] = await Promise.all([
        fetchAdminProofOfDeliveries({
          page,
          perPage: PER_PAGE,
          search: debouncedSearch || undefined,
          status: statusFilter === "all" ? undefined : statusFilter,
          pod_date_from: podDateFrom || undefined,
          pod_date_to: podDateTo || undefined,
        }),
        fetchAdminProofOfDeliveryStats(),
      ]);
      setRows((listRes as LaravelPaginated<Record<string, unknown>>).data ?? []);
      setMeta(listRes as LaravelPaginated<Record<string, unknown>>);
      setStats((statsRes as { data: Record<string, number> }).data);
    } finally {
      setLoading(false);
    }
  }, [authHydrated, page, debouncedSearch, statusFilter, podDateFrom, podDateTo]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className={ADMIN_LIST_PAGE_CLASS}>
      <AdminPageHeader title={t("title")} description={t("description")} icon={FileCheck} />

      <AdminStatsCards
        className="sm:grid-cols-2 xl:grid-cols-4"
        cards={[
          { key: "waiting", label: t("stats.waiting"), value: stats?.waiting_pod ?? 0, icon: Clock, iconClassName: "text-amber-700 bg-amber-100" },
          { key: "received", label: t("stats.received"), value: stats?.received ?? 0, icon: FileCheck, iconClassName: "text-sky-700 bg-sky-100" },
          { key: "verified", label: t("stats.verified"), value: stats?.verified ?? 0, icon: CheckCircle2, iconClassName: "text-emerald-700 bg-emerald-100" },
          { key: "rejected", label: t("stats.rejected"), value: stats?.rejected ?? 0, icon: XCircle, iconClassName: "text-red-700 bg-red-100" },
        ]}
      />

      <Card className="min-w-0 overflow-hidden">
        <CardHeader className="space-y-1 pb-3">
          <CardTitle className="text-base">{t("filterTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <TableToolbar searchPlaceholder={t("search")} searchValue={search} onSearchChange={setSearch} />
          <AdminListFilters
            selects={[
              {
                id: "pod-status",
                label: tc("table.status"),
                value: statusFilter,
                onChange: setStatusFilter,
                options: statusFilterOptions,
              },
            ]}
            dates={[
              {
                id: "pod-date-from",
                label: `${t("filters.podDate")} (${tc("filters.from")})`,
                value: podDateFrom,
                onChange: setPodDateFrom,
              },
              {
                id: "pod-date-to",
                label: `${t("filters.podDate")} (${tc("filters.to")})`,
                value: podDateTo,
                onChange: setPodDateTo,
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
                    <TableHead>{t("columns.shipmentNo")}</TableHead>
                    <TableHead>{t("columns.customer")}</TableHead>
                    <TableHead>{t("columns.deliveryDate")}</TableHead>
                    <TableHead>{t("columns.podDate")}</TableHead>
                    <TableHead>{tc("table.status")}</TableHead>
                    <TableHead className={actionsHeadClass}>
                      <span className="max-md:sr-only">{tc("table.actions")}</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r, i) => {
                    const status = String(r.status ?? "waiting_pod") as (typeof STATUS_OPTIONS)[number];
                    const metaStatus = STATUS_META[status] ?? STATUS_META.waiting_pod;
                    const Icon = metaStatus.icon;
                    return (
                      <TableRow key={String(r.id)} className="group">
                        <TableCell className="tabular-nums text-muted-foreground">{rowNumber(meta?.current_page ?? page, PER_PAGE, i)}</TableCell>
                        <TableCell className="font-mono text-xs">{String(r.shipment_number ?? "—")}</TableCell>
                        <TableCell>{String(r.customer ?? "—")}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {r.delivery_date ? new Date(String(r.delivery_date)).toLocaleDateString("id-ID") : "—"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {r.pod_date ? new Date(String(r.pod_date)).toLocaleDateString("id-ID") : "—"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn("gap-1", metaStatus.className)}>
                            <Icon className="h-3 w-3" />
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
                    );
                  })}
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
