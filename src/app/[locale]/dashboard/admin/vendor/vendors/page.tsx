"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PaginationBar } from "@/components/data-table/pagination-bar";
import { TableToolbar } from "@/components/data-table/table-toolbar";
import { AdminPageHeader } from "@/components/dashboard/admin/shared/admin-page-header";
import {
  actionsCellClass,
  actionsHeadClass,
  ADMIN_LIST_PAGE_CLASS,
} from "@/components/dashboard/admin/shared/admin-list-table-styles";
import { AdminStatsCards } from "@/components/dashboard/admin/shared/admin-stats-cards";
import { useAuthPersistHydrated } from "@/hooks/use-auth-hydrated";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useAuthStore } from "@/lib/store";
import { deactivateAdminVendor, fetchAdminVendorStats, fetchAdminVendors } from "@/lib/admin-api";
import { ApiError } from "@/lib/api-client";
import { rowNumber } from "@/lib/list-query";
import type { LaravelPaginated } from "@/lib/types-api";
import {
  BUSINESS_ENTITY_OPTIONS,
  vendorTypesLabel,
  VENDOR_TYPE_FILTER_OPTIONS,
  businessEntityLabel,
  vendorTypeLabel,
} from "@/lib/vendor-fsd-options";
import { cn } from "@/lib/utils";
import { Building2, Container, Eye, MoreHorizontal, Plus, Store, Train, Truck, UserCheck, UserX } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

const PER_PAGE = 10;

type VendorRow = Record<string, unknown>;

export default function AdminVendorListPage() {
  const params = useParams();
  const router = useRouter();
  const locale = String(params?.locale ?? "id");
  const basePath = `/${locale}/dashboard/admin/vendor/vendors`;
  const authHydrated = useAuthPersistHydrated();
  const t = useTranslations("AdminVendorVendors");
  const tc = useTranslations("AdminCommon");
  const { user } = useAuthStore();
  const roles = user?.roles ?? [];
  const canManageVendor = authHydrated && (roles.includes("super_admin") || roles.includes("sales"));

  const [rows, setRows] = useState<VendorRow[]>([]);
  const [meta, setMeta] = useState<LaravelPaginated<VendorRow> | null>(null);
  const [stats, setStats] = useState<Record<string, number> | null>(null);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 400);
  const [businessEntityFilter, setBusinessEntityFilter] = useState("all");
  const [vendorTypeFilter, setVendorTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, businessEntityFilter, vendorTypeFilter, statusFilter]);

  const loadStats = useCallback(async () => {
    if (!authHydrated) return;
    try {
      const res = await fetchAdminVendorStats();
      setStats((res as { data: Record<string, number> }).data);
    } catch {
      setStats(null);
    }
  }, [authHydrated]);

  const load = useCallback(async () => {
    if (!authHydrated) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetchAdminVendors({
        page,
        perPage: PER_PAGE,
        search: debouncedSearch.trim() || undefined,
        business_entity: businessEntityFilter === "all" ? undefined : businessEntityFilter,
        vendor_type: vendorTypeFilter === "all" ? undefined : vendorTypeFilter,
        status: statusFilter === "all" ? undefined : statusFilter,
      });
      const paginated = res as LaravelPaginated<VendorRow>;
      setRows(paginated.data ?? []);
      setMeta(paginated);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Gagal memuat vendor.");
      setRows([]);
      setMeta(null);
    } finally {
      setLoading(false);
    }
  }, [authHydrated, page, debouncedSearch, businessEntityFilter, vendorTypeFilter, statusFilter]);

  useEffect(() => { void loadStats(); }, [loadStats]);
  useEffect(() => { void load(); }, [load]);

  const deactivate = async (id: number) => {
    try {
      await deactivateAdminVendor(id);
      toast.success("Vendor dinonaktifkan.");
      void load();
      void loadStats();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Gagal menonaktifkan vendor.");
    }
  };

  return (
    <div className={ADMIN_LIST_PAGE_CLASS}>
      <AdminPageHeader
        icon={Building2}
        title={t("pageTitle")}
        description={t("pageSubtitle")}
        actions={
          canManageVendor ? (
            <Button className="h-9 w-full gap-1.5 px-4 sm:w-auto" type="button" onClick={() => router.push(`${basePath}/create`)}>
              <Plus className="h-4 w-4 shrink-0" />
              {t("addVendor")}
            </Button>
          ) : null
        }
      />

      {error ? (
        <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      ) : null}

      <AdminStatsCards
        className="sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"
        cards={[
          { key: "active", label: t("stats.active"), value: stats?.active ?? 0, hint: t("stats.activeHint"), icon: UserCheck, iconClassName: "text-emerald-700 bg-emerald-100" },
          { key: "inactive", label: t("stats.inactive"), value: stats?.inactive ?? 0, hint: t("stats.inactiveHint"), icon: UserX, iconClassName: "text-zinc-600 bg-zinc-100" },
          { key: "total", label: t("stats.total"), value: stats?.total ?? 0, hint: t("stats.totalHint"), icon: Store, iconClassName: "text-sky-700 bg-sky-100" },
          { key: "trucking", label: t("stats.trucking"), value: stats?.trucking ?? 0, icon: Truck, iconClassName: "text-amber-700 bg-amber-100" },
          { key: "rail", label: t("stats.rail"), value: stats?.rail ?? 0, icon: Train, iconClassName: "text-indigo-700 bg-indigo-100" },
          { key: "container", label: t("stats.container"), value: stats?.container_provider ?? 0, icon: Container, iconClassName: "text-violet-700 bg-violet-100" },
        ]}
      />

      <Card className="min-w-0 overflow-hidden">
        <CardHeader className="space-y-1">
          <CardTitle>{t("listTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <TableToolbar
            searchPlaceholder={t("searchPlaceholder")}
            searchValue={searchInput}
            onSearchChange={setSearchInput}
          />
          <div className="flex flex-wrap gap-3">
            <Select value={businessEntityFilter} onValueChange={(v) => v && setBusinessEntityFilter(v)}>
              <SelectTrigger className="h-9 w-44">
                <SelectValue placeholder="Business Entity">
                  {businessEntityFilter === "all"
                    ? t("filters.allEntity")
                    : businessEntityLabel(businessEntityFilter)}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("filters.allEntity")}</SelectItem>
                {BUSINESS_ENTITY_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={vendorTypeFilter} onValueChange={(v) => v && setVendorTypeFilter(v)}>
              <SelectTrigger className="h-9 w-44">
                <SelectValue placeholder="Vendor Type">
                  {vendorTypeFilter === "all" ? t("filters.allType") : vendorTypeLabel(vendorTypeFilter)}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("filters.allType")}</SelectItem>
                {VENDOR_TYPE_FILTER_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v) => v && setStatusFilter(v)}>
              <SelectTrigger className="h-9 w-36">
                <SelectValue placeholder="Status">
                  {statusFilter === "all"
                    ? t("filters.allStatus")
                    : statusFilter === "active"
                      ? t("filters.active")
                      : t("filters.inactive")}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("filters.allStatus")}</SelectItem>
                <SelectItem value="active">{t("filters.active")}</SelectItem>
                <SelectItem value="inactive">{t("filters.inactive")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <p className="text-sm text-muted-foreground">{tc("actions.loading")}</p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-14">{tc("table.no")}</TableHead>
                    <TableHead>{t("columns.code")}</TableHead>
                    <TableHead>{t("columns.name")}</TableHead>
                    <TableHead>{t("columns.type")}</TableHead>
                    <TableHead>{t("columns.entity")}</TableHead>
                    <TableHead>{t("columns.status")}</TableHead>
                    <TableHead className={actionsHeadClass}>
                      <span className="max-md:sr-only">{tc("table.actions")}</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((v, index) => (
                    <TableRow key={String(v.id)} className="group">
                      <TableCell className="tabular-nums text-muted-foreground">
                        {rowNumber(meta?.current_page ?? page, PER_PAGE, index)}
                      </TableCell>
                      <TableCell className="font-mono text-xs">{String(v.code ?? "—")}</TableCell>
                      <TableCell className="font-medium">{String(v.name ?? "—")}</TableCell>
                      <TableCell className="text-sm">{vendorTypesLabel(v.vendor_types as string[])}</TableCell>
                      <TableCell>{businessEntityLabel(String(v.business_entity ?? ""))}</TableCell>
                      <TableCell>
                        <Badge variant={v.is_active !== false ? "default" : "secondary"}>
                          {v.is_active !== false ? "Active" : "Inactive"}
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
                              <DropdownMenuItem className="cursor-pointer" onClick={() => router.push(`${basePath}/${v.id}`)}>
                                <Eye className="h-4 w-4" /> {tc("actions.viewDetail")}
                              </DropdownMenuItem>
                              {v.is_active !== false ? (
                                <DropdownMenuItem className="cursor-pointer" onClick={() => void deactivate(Number(v.id))}>
                                  {t("actions.deactivate")}
                                </DropdownMenuItem>
                              ) : null}
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
