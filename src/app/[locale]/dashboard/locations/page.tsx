"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Plus, MapPin, RefreshCcw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LocationStatsCards } from "@/components/locations/location-stats-cards";
import { LocationFilters, LOCATION_FILTER_DEFAULTS, type LocationFiltersValue } from "@/components/locations/location-filters";
import { LocationTable, type LocationRow } from "@/components/locations/location-table";
import { LocationFormDialog } from "@/components/locations/location-form-dialog";
import { useCustomerLocationStats } from "@/hooks/use-customer-locations-stats";
import { useCustomerLocationsList } from "@/hooks/use-customer-locations-list";

const PER_PAGE = 15;

export default function LocationsPage() {
  const t = useTranslations("Locations");
  const [filters, setFilters] = React.useState<LocationFiltersValue>(LOCATION_FILTER_DEFAULTS);
  const [page, setPage] = React.useState(1);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<LocationRow | null>(null);

  React.useEffect(() => {
    setPage(1);
  }, [filters]);
  React.useEffect(() => {
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }, [page]);

  const stats = useCustomerLocationStats();
  const list = useCustomerLocationsList({
    page,
    perPage: PER_PAGE,
    search: filters.search || undefined,
    type: filters.type || undefined,
    status: filters.status || undefined,
    province: filters.province || undefined,
    city: filters.city || undefined,
  });

  const rows: LocationRow[] = (list.data?.data ?? []) as unknown as LocationRow[];
  const total = list.data?.total ?? 0;

  const handleEdit = (row: LocationRow) => {
    setEditing(row);
    setDialogOpen(true);
  };

  const handleOpenCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-5">
      <header className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-900/5 text-zinc-900">
            <MapPin className="h-4 w-4" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">{t("title")}</h1>
            <p className="text-sm text-zinc-500">{t("subtitle")}</p>
          </div>
        </div>
        <Button onClick={handleOpenCreate} className="h-10 gap-2">
          <Plus className="h-4 w-4" />
          {t("add")}
        </Button>
      </header>

      <LocationStatsCards counts={stats.data?.data ?? {}} />

      <LocationFilters value={filters} onChange={setFilters} />

      {list.isError ? (
        <div className="flex items-center gap-3 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <p>Failed to load locations.</p>
          <Button variant="outline" size="sm" onClick={() => list.refetch()} className="ml-auto h-8">
            <RefreshCcw className="h-3.5 w-3.5" />
            Retry
          </Button>
        </div>
      ) : (
        <LocationTable
          rows={rows}
          total={total}
          page={page}
          perPage={PER_PAGE}
          isLoading={list.isLoading}
          onPageChange={setPage}
          onEdit={handleEdit}
        />
      )}

      <LocationFormDialog
        open={dialogOpen}
        onOpenChange={(o) => {
          setDialogOpen(o);
          if (!o) setEditing(null);
        }}
        row={editing}
      />
    </div>
  );
}
