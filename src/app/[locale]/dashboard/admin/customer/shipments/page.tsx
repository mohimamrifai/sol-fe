"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PaginationBar } from "@/components/data-table/pagination-bar";
import { TableToolbar } from "@/components/data-table/table-toolbar";
import { PackageSearch } from "lucide-react";
import { fetchAdminShipments, fetchAdminShipmentStats } from "@/lib/admin-api";
import type { LaravelPaginated } from "@/lib/types-api";
import { ApiError } from "@/lib/api-client";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useAuthPersistHydrated } from "@/hooks/use-auth-hydrated";
import { useShipmentStatusLabel } from "@/hooks/use-admin-status-labels";
import { useTranslations } from "next-intl";
import { ShipmentStatsCards } from "./components/shipment-stats-cards";
import { ShipmentTable } from "./components/shipment-table";
import {
  AdminListFilters,
  dateParamFromFilter,
  masterSelectOptions,
  paramFromFilter,
  stringParamFromFilter,
} from "@/components/data-table/admin-list-filters";
import { COVERAGE_FILTER_OPTIONS, useAdminListMasters } from "@/hooks/use-admin-list-masters";

const PER_PAGE = 10;

type ShipRow = Record<string, unknown>;

export default function AdminShipmentsPage() {
  const t = useTranslations("AdminShipments");
  const tc = useTranslations("AdminCommon");
  const shipmentStatusLabel = useShipmentStatusLabel();
  const authHydrated = useAuthPersistHydrated();
  const masters = useAdminListMasters();
  const [rows, setRows] = useState<ShipRow[]>([]);
  const [shipmentStats, setShipmentStats] = useState<Record<string, number> | null>(null);
  const [meta, setMeta] = useState<LaravelPaginated<ShipRow> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 400);
  const [statusFilter, setStatusFilter] = useState("all");
  const [companyFilter, setCompanyFilter] = useState("all");
  const [serviceTypeFilter, setServiceTypeFilter] = useState("all");
  const [coverageFilter, setCoverageFilter] = useState("all");
  const [originFilter, setOriginFilter] = useState("all");
  const [destinationFilter, setDestinationFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const shipmentStatusFilters = useMemo(
    () => [
      { value: "all", label: tc("filters.allStatus") },
      { value: "planning", label: shipmentStatusLabel("planning") },
      { value: "ready_for_departure", label: shipmentStatusLabel("ready_for_departure") },
      { value: "in_transit", label: shipmentStatusLabel("in_transit") },
      { value: "completed", label: shipmentStatusLabel("completed") },
      { value: "cancelled", label: shipmentStatusLabel("cancelled") },
    ],
    [tc, shipmentStatusLabel]
  );

  useEffect(() => {
    setPage(1);
  }, [
    debouncedSearch,
    statusFilter,
    companyFilter,
    serviceTypeFilter,
    coverageFilter,
    originFilter,
    destinationFilter,
    dateFrom,
    dateTo,
  ]);

  const statusParam = statusFilter === "all" ? undefined : statusFilter;

  const loadStats = useCallback(async () => {
    if (!authHydrated) return;
    try {
      const res = await fetchAdminShipmentStats();
      setShipmentStats((res as { data: Record<string, number> }).data);
    } catch {
      setShipmentStats(null);
    }
  }, [authHydrated]);

  const load = useCallback(async () => {
    if (!authHydrated) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetchAdminShipments({
        page,
        perPage: PER_PAGE,
        search: debouncedSearch.trim() || undefined,
        status: statusParam,
        companyId: paramFromFilter(companyFilter),
        serviceTypeId: paramFromFilter(serviceTypeFilter),
        shipmentCoverage: stringParamFromFilter(coverageFilter),
        originLocationId: paramFromFilter(originFilter),
        destinationLocationId: paramFromFilter(destinationFilter),
        dateFrom: dateParamFromFilter(dateFrom),
        dateTo: dateParamFromFilter(dateTo),
      });
      const paginated = res as LaravelPaginated<ShipRow>;
      setRows(paginated.data ?? []);
      setMeta(paginated);
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
    statusParam,
    companyFilter,
    serviceTypeFilter,
    coverageFilter,
    originFilter,
    destinationFilter,
    dateFrom,
    dateTo,
    t,
  ]);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="flex min-w-0 w-full flex-1 flex-col gap-6 md:px-2">
      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-900 text-white">
            <PackageSearch className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 sm:text-2xl uppercase">{t("pageTitle")}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{t("pageSubtitle")}</p>
          </div>
        </div>
      </div>

      {error ? (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
      ) : null}

      <ShipmentStatsCards
        planning={shipmentStats?.planning ?? 0}
        readyForDeparture={shipmentStats?.ready_for_departure ?? 0}
        inTransit={shipmentStats?.in_transit ?? 0}
        completed={shipmentStats?.completed ?? 0}
        cancelled={shipmentStats?.cancelled ?? 0}
      />

      <Card className="min-w-0 overflow-hidden border-zinc-200/60 shadow-sm">
        <CardHeader className="space-y-1 bg-zinc-50/50 border-b border-zinc-100">
          <CardTitle className="text-lg font-bold">{t("listTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="p-4 border-b border-zinc-50">
            <TableToolbar
              searchPlaceholder={t("searchPlaceholder")}
              searchValue={searchInput}
              onSearchChange={setSearchInput}
              filterLabel={t("filterStatus")}
              filterValue={statusFilter}
              onFilterChange={setStatusFilter}
              filterOptions={shipmentStatusFilters}
            />
            <AdminListFilters
              className="mt-3"
              selects={[
                {
                  id: "shipment-company",
                  label: tc("table.customer"),
                  value: companyFilter,
                  onChange: setCompanyFilter,
                  options: masterSelectOptions(masters.companies, tc("filters.all")),
                },
                {
                  id: "shipment-service",
                  label: t("table.service"),
                  value: serviceTypeFilter,
                  onChange: setServiceTypeFilter,
                  options: masterSelectOptions(masters.serviceTypes, tc("filters.all")),
                },
                {
                  id: "shipment-coverage",
                  label: t("columns.coverage"),
                  value: coverageFilter,
                  onChange: setCoverageFilter,
                  options: [
                    { value: "all", label: tc("filters.all") },
                    ...COVERAGE_FILTER_OPTIONS.filter((o) => o.value !== "all").map((o) => ({
                      value: o.value,
                      label: o.label,
                    })),
                  ],
                },
                {
                  id: "shipment-origin",
                  label: t("filters.origin"),
                  value: originFilter,
                  onChange: setOriginFilter,
                  options: masterSelectOptions(masters.locations, tc("filters.all")),
                },
                {
                  id: "shipment-destination",
                  label: t("filters.destination"),
                  value: destinationFilter,
                  onChange: setDestinationFilter,
                  options: masterSelectOptions(masters.locations, tc("filters.all")),
                },
              ]}
              dates={[
                {
                  id: "shipment-date-from",
                  label: `${t("filters.departureDate")} (${tc("filters.from")})`,
                  value: dateFrom,
                  onChange: setDateFrom,
                },
                {
                  id: "shipment-date-to",
                  label: `${t("filters.departureDate")} (${tc("filters.to")})`,
                  value: dateTo,
                  onChange: setDateTo,
                },
              ]}
            />
          </div>

          <ShipmentTable
            rows={rows}
            meta={meta}
            perPage={PER_PAGE}
            loading={loading}
          />

          {meta && meta.last_page > 1 && (
            <div className="p-4 border-t border-zinc-50">
              <PaginationBar
                currentPage={meta.current_page}
                lastPage={meta.last_page}
                total={meta.total}
                from={meta.from}
                to={meta.to}
                onPageChange={setPage}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
