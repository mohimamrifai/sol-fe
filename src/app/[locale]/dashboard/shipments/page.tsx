"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, RefreshCcw } from "lucide-react";
import { ShipmentStatsCards } from "@/components/shipments/shipment-stats-cards";
import {
  ShipmentFilters,
  SHIPMENT_FILTER_DEFAULTS,
  type ShipmentFiltersValue,
} from "@/components/shipments/shipment-filters";
import { ShipmentTable } from "@/components/shipments/shipment-table";
import { useCustomerShipmentStats } from "@/hooks/use-customer-shipment-stats";
import { useCustomerShipmentsList } from "@/hooks/use-customer-shipments-list";
import { apiFetch } from "@/lib/api-client";
import { Button } from "@/components/ui/button";

interface LocationOption { id: number; name: string; code: string }

const PER_PAGE = 15;

export default function CustomerShipmentsPage() {
  const t = useTranslations("Shipments");
  const [filters, setFilters] = React.useState<ShipmentFiltersValue>(SHIPMENT_FILTER_DEFAULTS);
  const [page, setPage] = React.useState(1);

  React.useEffect(() => {
    setPage(1);
  }, [filters]);
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0 });
    }
  }, [page]);

  const stats = useCustomerShipmentStats();
  const list = useCustomerShipmentsList(filters, page, PER_PAGE);
  const locationsQuery = useLocations();
  const locations = locationsQuery.data ?? [];

  const rows = (list.data?.data ?? []) as unknown as Parameters<typeof ShipmentTable>[0]["rows"];
  const total = list.data?.total ?? 0;

  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">{t("title")}</h1>
        <p className="text-sm text-zinc-500">{t("subtitle")}</p>
      </header>

      <ShipmentStatsCards
        counts={stats.data ?? { planning: 0, in_progress: 0, completed: 0, cancelled: 0 }}
      />

      <ShipmentFilters
        value={filters}
        onChange={setFilters}
        originOptions={locations}
        destinationOptions={locations}
      />

      {list.error ? (
        <ErrorBanner message={t("loadError")} onRetry={() => list.refetch()} />
      ) : (
        <ShipmentTable
          rows={rows}
          page={page}
          perPage={PER_PAGE}
          total={total}
          onPageChange={setPage}
          loading={list.isLoading}
        />
      )}
    </div>
  );
}

function ErrorBanner({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
      <div className="flex items-center gap-2">
        <AlertCircle className="h-4 w-4" />
        <span>{message}</span>
      </div>
      <Button variant="outline" size="sm" onClick={onRetry} className="h-8 gap-1 px-2 text-xs">
        <RefreshCcw className="h-3 w-3" />
        Retry
      </Button>
    </div>
  );
}

function useLocations() {
  return useQuery({
    queryKey: ["customer", "shipments", "locations"],
    queryFn: async ({ signal }) => {
      const res = await apiFetch<{ data: LocationOption[] }>(
        `/customer/master/locations?per_page=200`,
        { method: "GET", signal }
      );
      return res.data ?? [];
    },
    staleTime: 5 * 60_000,
  });
}
