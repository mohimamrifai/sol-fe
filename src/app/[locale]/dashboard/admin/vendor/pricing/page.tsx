"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
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
import { VendorPricingCreateDialog } from "@/components/dashboard/admin/vendor/vendor-pricing-create-dialog";
import { useAuthPersistHydrated } from "@/hooks/use-auth-hydrated";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useAuthStore } from "@/lib/store";
import {
  deactivateAdminPricing,
  fetchAdminPricingStats,
  fetchAdminPricings,
  fetchAdminVendors,
} from "@/lib/admin-api";
import { ApiError } from "@/lib/api-client";
import { rowNumber } from "@/lib/list-query";
import type { LaravelPaginated } from "@/lib/types-api";
import {
  formatIdr,
  SERVICE_CATEGORY_OPTIONS,
  serviceCategoryLabel,
} from "@/lib/vendor-fsd-options";
import { cn } from "@/lib/utils";
import { CheckCircle2, Eye, Layers, MoreHorizontal, Plus, Store, Tags, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

const PER_PAGE = 10;

type PricingRow = Record<string, unknown>;

export default function AdminVendorPricingPage() {
  const params = useParams();
  const router = useRouter();
  const locale = String(params?.locale ?? "id");
  const basePath = `/${locale}/dashboard/admin/vendor/pricing`;
  const authHydrated = useAuthPersistHydrated();
  const t = useTranslations("AdminVendorPricing");
  const tc = useTranslations("AdminCommon");
  const searchParams = useSearchParams();
  const { user } = useAuthStore();
  const roles = user?.roles ?? [];
  const canManage = authHydrated && (roles.includes("super_admin") || roles.includes("sales"));

  const [rows, setRows] = useState<PricingRow[]>([]);
  const [meta, setMeta] = useState<LaravelPaginated<PricingRow> | null>(null);
  const [stats, setStats] = useState<Record<string, number> | null>(null);
  const [vendorOptions, setVendorOptions] = useState<{ id: number; label: string }[]>([]);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 400);
  const [vendorFilter, setVendorFilter] = useState("all");
  const [serviceFilter, setServiceFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, vendorFilter, serviceFilter, statusFilter]);

  const loadStats = useCallback(async () => {
    if (!authHydrated) return;
    try {
      const res = await fetchAdminPricingStats();
      setStats((res as { data: Record<string, number> }).data);
    } catch {
      setStats(null);
    }
  }, [authHydrated]);

  const loadVendors = useCallback(async () => {
    if (!authHydrated) return;
    try {
      const res = await fetchAdminVendors({ perPage: 500 });
      setVendorOptions(((res as LaravelPaginated<Record<string, unknown>>).data ?? []).map((v) => ({
        id: Number(v.id),
        label: String(v.name ?? v.code ?? v.id),
      })));
    } catch {
      setVendorOptions([]);
    }
  }, [authHydrated]);

  const load = useCallback(async () => {
    if (!authHydrated) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetchAdminPricings({
        page,
        perPage: PER_PAGE,
        search: debouncedSearch.trim() || undefined,
        vendor_id: vendorFilter === "all" ? undefined : vendorFilter,
        service_category: serviceFilter === "all" ? undefined : serviceFilter,
        status: statusFilter === "all" ? undefined : statusFilter,
      });
      const paginated = res as LaravelPaginated<PricingRow>;
      setRows(paginated.data ?? []);
      setMeta(paginated);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Gagal memuat pricing.");
      setRows([]);
      setMeta(null);
    } finally {
      setLoading(false);
    }
  }, [authHydrated, page, debouncedSearch, vendorFilter, serviceFilter, statusFilter]);

  useEffect(() => { void loadStats(); void loadVendors(); }, [loadStats, loadVendors]);
  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    if (searchParams.get("create") === "1") {
      setCreateOpen(true);
      const url = new URL(window.location.href);
      url.searchParams.delete("create");
      window.history.replaceState({}, "", url.toString());
    }
  }, [searchParams]);

  const deactivate = async (id: number) => {
    try {
      await deactivateAdminPricing(id);
      toast.success("Pricing dinonaktifkan.");
      void load();
      void loadStats();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Gagal menonaktifkan pricing.");
    }
  };

  return (
    <div className={ADMIN_LIST_PAGE_CLASS}>
      <VendorPricingCreateDialog open={createOpen} onOpenChange={setCreateOpen} onSaved={() => { void load(); void loadStats(); }} />

      <AdminPageHeader
        icon={Tags}
        title={t("pageTitle")}
        description={t("pageSubtitle")}
        actions={
          canManage ? (
            <Button className="h-9 w-full gap-1.5 px-4 sm:w-auto" type="button" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4 shrink-0" />
              {t("addPricing")}
            </Button>
          ) : null
        }
      />

      {error ? (
        <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      ) : null}

      <AdminStatsCards
        className="sm:grid-cols-2 xl:grid-cols-4"
        cards={[
          { key: "active", label: t("stats.active"), value: stats?.active ?? 0, icon: CheckCircle2, iconClassName: "text-emerald-700 bg-emerald-100" },
          { key: "inactive", label: t("stats.inactive"), value: stats?.inactive ?? 0, icon: XCircle, iconClassName: "text-zinc-600 bg-zinc-100" },
          { key: "vendors", label: t("stats.vendors"), value: stats?.vendors ?? 0, icon: Store, iconClassName: "text-sky-700 bg-sky-100" },
          { key: "total", label: t("stats.total"), value: stats?.total ?? 0, icon: Layers, iconClassName: "text-violet-700 bg-violet-100" },
        ]}
      />

      <Card className="min-w-0 overflow-hidden">
        <CardHeader className="space-y-1">
          <CardTitle>{t("listTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <TableToolbar searchPlaceholder={t("searchPlaceholder")} searchValue={searchInput} onSearchChange={setSearchInput} />
          <div className="flex flex-wrap gap-3">
            <Select value={vendorFilter} onValueChange={(v) => v && setVendorFilter(v)}>
              <SelectTrigger className="h-9 w-48">
                <SelectValue placeholder="Vendor">
                  {vendorFilter === "all"
                    ? t("filters.allVendor")
                    : vendorOptions.find((v) => String(v.id) === vendorFilter)?.label ?? "—"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("filters.allVendor")}</SelectItem>
                {vendorOptions.map((v) => (
                  <SelectItem key={v.id} value={String(v.id)}>{v.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={serviceFilter} onValueChange={(v) => v && setServiceFilter(v)}>
              <SelectTrigger className="h-9 w-48">
                <SelectValue placeholder="Service Category">
                  {serviceFilter === "all" ? t("filters.allService") : serviceCategoryLabel(serviceFilter)}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("filters.allService")}</SelectItem>
                {SERVICE_CATEGORY_OPTIONS.map((o) => (
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
                    <TableHead>{t("columns.vendor")}</TableHead>
                    <TableHead>{t("columns.service")}</TableHead>
                    <TableHead>{t("columns.origin")}</TableHead>
                    <TableHead>{t("columns.destination")}</TableHead>
                    <TableHead>{t("columns.vehicleContainer")}</TableHead>
                    <TableHead className="text-right">{t("columns.price")}</TableHead>
                    <TableHead>{t("columns.status")}</TableHead>
                    <TableHead>{t("columns.createdDate")}</TableHead>
                    <TableHead className={actionsHeadClass}>
                      <span className="max-md:sr-only">{tc("table.actions")}</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row, index) => (
                    <TableRow key={String(row.id)} className="group">
                      <TableCell className="tabular-nums text-muted-foreground">
                        {rowNumber(meta?.current_page ?? page, PER_PAGE, index)}
                      </TableCell>
                      <TableCell className="font-medium">{String(row.vendor ?? "—")}</TableCell>
                      <TableCell>{serviceCategoryLabel(String(row.service_category ?? ""))}</TableCell>
                      <TableCell>{String(row.origin ?? "—")}</TableCell>
                      <TableCell>{String(row.destination ?? "—")}</TableCell>
                      <TableCell>{String(row.vehicle_container_type ?? "—")}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatIdr(row.unit_price as string)}</TableCell>
                      <TableCell>
                        <Badge variant={row.is_active !== false ? "default" : "secondary"}>
                          {row.is_active !== false ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {row.created_at ? new Date(String(row.created_at)).toLocaleDateString("id-ID") : "—"}
                      </TableCell>
                      <TableCell className={cn(actionsCellClass, "p-2 text-right")}>
                        <div className="flex justify-end">
                          <DropdownMenu>
                            <DropdownMenuTrigger className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), "shrink-0")}>
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">{tc("actions.actionsMenu")}</span>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="min-w-44">
                              <DropdownMenuItem className="cursor-pointer" onClick={() => router.push(`${basePath}/${row.id}`)}>
                                <Eye className="h-4 w-4" /> {tc("actions.viewDetail")}
                              </DropdownMenuItem>
                              {row.is_active !== false ? (
                                <DropdownMenuItem className="cursor-pointer" onClick={() => void deactivate(Number(row.id))}>
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
