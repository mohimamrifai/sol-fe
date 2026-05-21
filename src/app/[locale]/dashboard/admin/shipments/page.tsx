"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PaginationBar } from "@/components/data-table/pagination-bar";
import { TableToolbar } from "@/components/data-table/table-toolbar";
import { SHIPMENT_STATUS_KEYS, shipmentStatusLabel } from "@/lib/shipment-status";
import { useAuthPersistHydrated } from "@/lib/use-auth-hydrated";
import { PackageSearch } from "lucide-react";
import { fetchAdminShipments } from "@/lib/admin-api";
import type { LaravelPaginated } from "@/lib/types-api";
import { ApiError } from "@/lib/api-client";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { ShipmentStatsCards } from "./components/shipment-stats-cards";
import { ShipmentTable } from "./components/shipment-table";

const PER_PAGE = 10;
const STATS_CAP = 1000;

const SHIPMENT_STATUS_FILTERS = [
  { value: "all", label: "Semua status" },
  ...SHIPMENT_STATUS_KEYS.map((k) => ({
    value: k,
    label: shipmentStatusLabel(k),
  })),
];

type ShipRow = Record<string, unknown>;

function isInTransitStatus(st: string): boolean {
  const k = st.toLowerCase();
  return ["departed", "arrived", "unloading"].includes(k);
}

export default function AdminShipmentsPage() {
  const authHydrated = useAuthPersistHydrated();
  const [rows, setRows] = useState<ShipRow[]>([]);
  const [statsRows, setStatsRows] = useState<ShipRow[]>([]);
  const [statsMeta, setStatsMeta] = useState<LaravelPaginated<ShipRow> | null>(null);
  const [meta, setMeta] = useState<LaravelPaginated<ShipRow> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 400);
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter]);



  const statusParam = statusFilter === "all" ? undefined : statusFilter;

  const loadStats = useCallback(async () => {
    if (!authHydrated) return;
    try {
      const res = await fetchAdminShipments({
        page: 1,
        perPage: STATS_CAP,
        search: debouncedSearch.trim() || undefined,
        status: statusParam,
      });
      const paginated = res as LaravelPaginated<ShipRow>;
      setStatsRows(paginated.data ?? []);
      setStatsMeta(paginated);
    } catch {
      setStatsRows([]);
      setStatsMeta(null);
    }
  }, [authHydrated, debouncedSearch, statusParam]);

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
      });
      const paginated = res as LaravelPaginated<ShipRow>;
      setRows(paginated.data ?? []);
      setMeta(paginated);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Gagal memuat shipment.");
      setRows([]);
      setMeta(null);
    } finally {
      setLoading(false);
    }
  }, [authHydrated, page, debouncedSearch, statusParam]);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  useEffect(() => {
    void load();
  }, [load]);

  const countCreated = statsRows.filter((s) => String(s.status).toLowerCase() === "created").length;
  const countInTransit = statsRows.filter((s) => isInTransitStatus(String(s.status))).length;
  const countCompleted = statsRows.filter((s) => String(s.status).toLowerCase() === "completed").length;
  const totalStats = statsMeta?.total ?? 0;

  return (
    <div className="flex min-w-0 w-full flex-1 flex-col gap-6 md:px-2">
      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-900 text-white">
            <PackageSearch className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 sm:text-2xl uppercase">Shipment Management</h1>
            <p className="mt-1 text-sm text-muted-foreground">Monitoring perjalanan, kontainer & rack secara real-time.</p>
          </div>
        </div>
      </div>

      {error ? (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
      ) : null}

      <ShipmentStatsCards
        countCreated={countCreated}
        countInTransit={countInTransit}
        countCompleted={countCompleted}
        totalStats={totalStats}
      />

      <Card className="min-w-0 overflow-hidden border-zinc-200/60 shadow-sm">
        <CardHeader className="space-y-1 bg-zinc-50/50 border-b border-zinc-100">
          <CardTitle className="text-lg font-bold">Daftar Shipment</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="p-4 border-b border-zinc-50">
            <TableToolbar
              searchPlaceholder="Cari Nomor Shipment atau CN…"
              searchValue={searchInput}
              onSearchChange={setSearchInput}
              filterLabel="Filter Status"
              filterValue={statusFilter}
              onFilterChange={setStatusFilter}
              filterOptions={SHIPMENT_STATUS_FILTERS}
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
