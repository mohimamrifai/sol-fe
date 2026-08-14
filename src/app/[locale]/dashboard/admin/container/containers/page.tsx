"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PaginationBar } from "@/components/data-table/pagination-bar";
import { TableToolbar } from "@/components/data-table/table-toolbar";
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

export default function AdminContainersPage() {
  const params = useParams();
  const router = useRouter();
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
    setPage(1);
  }, [debouncedSearch, ownershipFilter, statusFilter, typeFilter, yardFilter, vendorFilter]);

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
  }, [authHydrated, page, debouncedSearch, ownershipFilter, statusFilter, typeFilter, yardFilter, vendorFilter]);

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
        <CardHeader><CardTitle>{t("listTitle")}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <TableToolbar searchPlaceholder={t("searchPlaceholder")} searchValue={search} onSearchChange={setSearch} />
          <div className="flex flex-wrap gap-3">
            <Select value={ownershipFilter} onValueChange={(v) => v && setOwnershipFilter(v)}>
              <SelectTrigger className="h-9 w-40">
                <SelectValue placeholder={t("filters.ownership")}>
                  {ownershipFilter === "all" ? t("filters.allOwnership") : ownershipFilter}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("filters.allOwnership")}</SelectItem>
                <SelectItem value="company">{t("filters.company")}</SelectItem>
                <SelectItem value="vendor">{t("filters.vendor")}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v) => v && setStatusFilter(v)}>
              <SelectTrigger className="h-9 w-40">
                <SelectValue placeholder={tc("table.status")}>
                  {statusFilter === "all" ? tc("filters.allStatus") : statusFilter}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{tc("filters.allStatus")}</SelectItem>
                {STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={(v) => v && setTypeFilter(v)}>
              <SelectTrigger className="h-9 w-44">
                <SelectValue placeholder={t("columns.type")}>
                  {typeFilter === "all" ? t("filters.allType") : types.find((x) => String(x.id) === typeFilter)?.label ?? "—"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("filters.allType")}</SelectItem>
                {types.map((x) => <SelectItem key={x.id} value={String(x.id)}>{x.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={yardFilter} onValueChange={(v) => v && setYardFilter(v)}>
              <SelectTrigger className="h-9 w-44">
                <SelectValue placeholder={t("columns.yard")}>
                  {yardFilter === "all" ? t("filters.allYard") : yards.find((x) => String(x.id) === yardFilter)?.label ?? "—"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("filters.allYard")}</SelectItem>
                {yards.map((x) => <SelectItem key={x.id} value={String(x.id)}>{x.label}</SelectItem>)}
              </SelectContent>
            </Select>
            {ownershipFilter === "vendor" ? (
              <Select value={vendorFilter} onValueChange={(v) => v && setVendorFilter(v)}>
                <SelectTrigger className="h-9 w-44">
                  <SelectValue placeholder={t("filters.vendor")}>
                    {vendorFilter === "all" ? t("filters.allVendor") : vendors.find((x) => String(x.id) === vendorFilter)?.label ?? "—"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("filters.allVendor")}</SelectItem>
                  {vendors.map((x) => <SelectItem key={x.id} value={String(x.id)}>{x.label}</SelectItem>)}
                </SelectContent>
              </Select>
            ) : null}
          </div>

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
                      <TableCell>{String(r.ownership ?? "—")}</TableCell>
                      <TableCell>{String(r.current_yard ?? "—")}</TableCell>
                      <TableCell className="tabular-nums">{String(r.utilization_pct ?? 0)}%</TableCell>
                      <TableCell><Badge variant="outline">{String(r.status ?? "—")}</Badge></TableCell>
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
                {rows.length === 0 ? <TableCaption className="text-xs">{t("empty")}</TableCaption> : null}
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
