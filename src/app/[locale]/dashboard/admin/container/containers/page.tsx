"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { ContainerCreateDialog } from "@/components/dashboard/admin/container-create-dialog";
import { useAuthPersistHydrated } from "@/hooks/use-auth-hydrated";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { fetchAdminContainerStats, fetchAdminContainers, fetchAdminContainerTypes, fetchAdminVendors, fetchAdminYards } from "@/lib/admin-api";
import { rowNumber } from "@/lib/list-query";
import type { LaravelPaginated } from "@/lib/types-api";
import { cn } from "@/lib/utils";
import { Box, Container, Eye, MoreHorizontal, Plus, Truck } from "lucide-react";
import { useTranslations } from "next-intl";

const PER_PAGE = 10;
const STATUS_OPTIONS = ["available", "reserved", "in_transit", "maintenance", "inactive"] as const;
const OWNERSHIP_OPTIONS = ["company", "vendor"] as const;

export default function AdminContainersPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = String(params?.locale ?? "id");
  const basePath = `/${locale}/dashboard/admin/container/containers`;
  const authHydrated = useAuthPersistHydrated();
  const t = useTranslations("AdminFsdContainers");
  const tc = useTranslations("AdminCommon");

  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [meta, setMeta] = useState<LaravelPaginated<Record<string, unknown>> | null>(null);
  const [stats, setStats] = useState<Record<string, number> | null>(null);
  const [types, setTypes] = useState<{ id: number; label: string }[]>([]);
  const [yards, setYards] = useState<{ id: number; label: string }[]>([]);
  const [vendors, setVendors] = useState<{ id: number; label: string }[]>([]);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 400);
  const [ownershipFilter, setOwnershipFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [yardFilter, setYardFilter] = useState("all");
  const [vendorFilter, setVendorFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    const status = searchParams.get("status");
    const storageExceeded = searchParams.get("storage_exceeded");
    if (status) setStatusFilter(status);
    if (storageExceeded === "1") {
      setOwnershipFilter("all");
    }
  }, [searchParams]);

  const storageExceededFilter = searchParams.get("storage_exceeded") === "1";

  const ownershipLabel = useCallback(
    (value: string) => {
      if (value === "company") return t("filters.company");
      if (value === "vendor") return t("filters.vendor");
      return value;
    },
    [t]
  );

  const statusLabel = useCallback(
    (value: string) => {
      const key = value.toLowerCase().replace(/\s+/g, "_") as (typeof STATUS_OPTIONS)[number];
      if (t.has(`statuses.${key}`)) return t(`statuses.${key}` as "statuses.available");
      return value;
    },
    [t]
  );

  const ownershipFilterOptions = useMemo(
    () => [
      { value: "all", label: t("filters.allOwnership") },
      ...OWNERSHIP_OPTIONS.map((key) => ({
        value: key,
        label: t(`filters.${key}` as "filters.company"),
      })),
    ],
    [t]
  );

  const statusFilterOptions = useMemo(
    () => [
      { value: "all", label: tc("filters.allStatus") },
      ...STATUS_OPTIONS.map((key) => ({
        value: key,
        label: t(`statuses.${key}` as "statuses.available"),
      })),
    ],
    [t, tc]
  );

  const typeFilterOptions = useMemo(
    () => [
      { value: "all", label: t("filters.allType") },
      ...types.map((x) => ({ value: String(x.id), label: x.label })),
    ],
    [t, types]
  );

  const yardFilterOptions = useMemo(
    () => [
      { value: "all", label: t("filters.allYard") },
      ...yards.map((x) => ({ value: String(x.id), label: x.label })),
    ],
    [t, yards]
  );

  const vendorFilterOptions = useMemo(
    () => [
      { value: "all", label: t("filters.allVendor") },
      ...vendors.map((x) => ({ value: String(x.id), label: x.label })),
    ],
    [t, vendors]
  );

  const filterSelects = useMemo(() => {
    const selects = [
      {
        id: "ct-ownership",
        label: t("filters.ownership"),
        value: ownershipFilter,
        onChange: setOwnershipFilter,
        options: ownershipFilterOptions,
      },
      {
        id: "ct-status",
        label: tc("table.status"),
        value: statusFilter,
        onChange: setStatusFilter,
        options: statusFilterOptions,
      },
      {
        id: "ct-type",
        label: t("columns.type"),
        value: typeFilter,
        onChange: setTypeFilter,
        options: typeFilterOptions,
        searchable: true,
      },
      {
        id: "ct-yard",
        label: t("columns.yard"),
        value: yardFilter,
        onChange: setYardFilter,
        options: yardFilterOptions,
        searchable: true,
      },
    ];

    if (ownershipFilter === "vendor") {
      selects.push({
        id: "ct-vendor",
        label: t("filters.vendor"),
        value: vendorFilter,
        onChange: setVendorFilter,
        options: vendorFilterOptions,
      });
    }

    return selects;
  }, [
    t,
    tc,
    ownershipFilter,
    statusFilter,
    typeFilter,
    yardFilter,
    vendorFilter,
    ownershipFilterOptions,
    statusFilterOptions,
    typeFilterOptions,
    yardFilterOptions,
    vendorFilterOptions,
  ]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, ownershipFilter, statusFilter, typeFilter, yardFilter, vendorFilter, storageExceededFilter]);

  useEffect(() => {
    if (ownershipFilter !== "vendor") setVendorFilter("all");
  }, [ownershipFilter]);

  const load = useCallback(async () => {
    if (!authHydrated) return;
    setLoading(true);
    try {
      const [listRes, statsRes] = await Promise.all([
        fetchAdminContainers({
          page,
          perPage: PER_PAGE,
          search: debouncedSearch || undefined,
          ownership: ownershipFilter === "all" ? undefined : ownershipFilter,
          status: statusFilter === "all" ? undefined : statusFilter,
          container_type_id: typeFilter === "all" ? undefined : typeFilter,
          current_yard_id: yardFilter === "all" ? undefined : yardFilter,
          vendor_id: vendorFilter === "all" ? undefined : vendorFilter,
          storage_exceeded: storageExceededFilter ? "1" : undefined,
        }),
        fetchAdminContainerStats(),
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
  }, [authHydrated, page, debouncedSearch, ownershipFilter, statusFilter, typeFilter, yardFilter, vendorFilter, storageExceededFilter]);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    if (!authHydrated) return;
    void Promise.all([
      fetchAdminContainerTypes({ perPage: 200 }),
      fetchAdminYards({ perPage: 200 }),
      fetchAdminVendors({ perPage: 200 }),
    ]).then(([typeRes, yardRes, vendorRes]) => {
      setTypes(((typeRes as LaravelPaginated<Record<string, unknown>>).data ?? []).map((r) => ({
        id: Number(r.id),
        label: String(r.name ?? r.code),
      })));
      setYards(((yardRes as LaravelPaginated<Record<string, unknown>>).data ?? []).map((r) => ({
        id: Number(r.id),
        label: `${r.code ?? ""} · ${r.name ?? r.id}`.trim(),
      })));
      setVendors(((vendorRes as LaravelPaginated<Record<string, unknown>>).data ?? []).map((r) => ({
        id: Number(r.id),
        label: String(r.name ?? r.code),
      })));
    });
  }, [authHydrated]);

  return (
    <div className={ADMIN_LIST_PAGE_CLASS}>
      <AdminPageHeader
        icon={Container}
        title={t("pageTitle")}
        description={t("pageSubtitle")}
        actions={
          <Button type="button" className="h-9 gap-1.5" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            {t("addContainer")}
          </Button>
        }
      />

      <AdminStatsCards
        className="sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        cards={[
          { key: "company", label: t("stats.company"), value: stats?.total_company ?? 0, icon: Box, iconClassName: "text-zinc-700 bg-zinc-100" },
          { key: "vendor", label: t("stats.vendor"), value: stats?.total_vendor ?? 0, icon: Truck, iconClassName: "text-sky-700 bg-sky-100" },
          { key: "available", label: t("stats.available"), value: stats?.available ?? 0, icon: Container, iconClassName: "text-emerald-700 bg-emerald-100" },
          { key: "reserved", label: t("stats.reserved"), value: stats?.reserved ?? 0, icon: Box, iconClassName: "text-violet-700 bg-violet-100" },
          { key: "in_transit", label: t("stats.inTransit"), value: stats?.in_transit ?? 0, icon: Truck, iconClassName: "text-amber-700 bg-amber-100" },
          { key: "maintenance", label: t("stats.maintenance"), value: stats?.maintenance ?? 0, icon: Box, iconClassName: "text-orange-700 bg-orange-100" },
          { key: "inactive", label: t("stats.inactive"), value: stats?.inactive ?? 0, icon: Box, iconClassName: "text-red-700 bg-red-100" },
        ]}
      />

      <Card className="min-w-0 overflow-hidden">
        <CardHeader className="space-y-1 pb-3">
          <CardTitle className="text-base">{t("filterTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <TableToolbar searchPlaceholder={t("searchPlaceholder")} searchValue={search} onSearchChange={setSearch} />
          <AdminListFilters selects={filterSelects} />
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
                    <TableHead>{t("columns.containerNo")}</TableHead>
                    <TableHead>{t("columns.type")}</TableHead>
                    <TableHead>{t("columns.ownership")}</TableHead>
                    <TableHead>{t("columns.yard")}</TableHead>
                    <TableHead>{t("columns.utilization")}</TableHead>
                    <TableHead>{tc("table.status")}</TableHead>
                    <TableHead className={actionsHeadClass}><span className="max-md:sr-only">{tc("table.actions")}</span></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r, i) => (
                    <TableRow key={String(r.id)}>
                      <TableCell className="tabular-nums text-muted-foreground">{rowNumber(meta?.current_page ?? page, PER_PAGE, i)}</TableCell>
                      <TableCell className="font-mono text-xs">{String(r.container_number)}</TableCell>
                      <TableCell>{String(r.container_type ?? "—")}</TableCell>
                      <TableCell>{ownershipLabel(String(r.ownership ?? "—"))}</TableCell>
                      <TableCell>{String(r.current_yard ?? "—")}</TableCell>
                      <TableCell className="tabular-nums">{String(r.utilization_pct ?? 0)}%</TableCell>
                      <TableCell><Badge variant="outline">{statusLabel(String(r.status ?? "—"))}</Badge></TableCell>
                      <TableCell className={cn(actionsCellClass, "p-2 text-right")}>
                        <DropdownMenu>
                          <DropdownMenuTrigger className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }))}>
                            <MoreHorizontal className="h-4 w-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem className="cursor-pointer" onClick={() => router.push(`${basePath}/${r.id}`)}>
                              <Eye className="h-4 w-4" /> {tc("actions.viewDetail")}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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
              {meta ? <PaginationBar currentPage={meta.current_page} lastPage={meta.last_page} total={meta.total} from={meta.from} to={meta.to} onPageChange={setPage} /> : null}
            </>
          )}
        </CardContent>
      </Card>

      <ContainerCreateDialog open={createOpen} onOpenChange={setCreateOpen} onCreated={() => void load()} />
    </div>
  );
}
