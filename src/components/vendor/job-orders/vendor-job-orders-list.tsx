"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ClipboardList } from "lucide-react";
import { VendorJobOrdersStatsCards } from "@/components/vendor/job-orders/vendor-job-orders-stats-cards";
import { VendorJobOrdersFilters } from "@/components/vendor/job-orders/vendor-job-orders-filters";
import { VendorJobOrdersTable } from "@/components/vendor/job-orders/vendor-job-orders-table";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";

export function VendorJobOrdersList() {
  const t = useTranslations("Vendor.jobOrders");
  const [filters, setFilters] = useState<Record<string, unknown>>({});
  const [page, setPage] = useState(1);

  const { data: serviceTypes } = useQuery({
    queryKey: ["vendor", "master", "service-types"],
    queryFn: () => apiFetch<{ data: Array<{ id: number; name: string }> }>("/vendor/master/service-types"),
    staleTime: 5 * 60 * 1000,
  });

  return (
    <div className="flex min-w-0 w-full flex-1 flex-col gap-6">
      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-900/5 text-zinc-900">
            <ClipboardList className="h-4 w-4" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-zinc-900 sm:text-2xl">
              {t("title")}
            </h1>
            <p className="text-sm text-zinc-500">{t("subtitle")}</p>
          </div>
        </div>
      </div>

      <VendorJobOrdersStatsCards />
      <VendorJobOrdersFilters onChange={setFilters} serviceTypes={serviceTypes?.data ?? []} />
      <VendorJobOrdersTable filters={filters} page={page} setPage={setPage} />
    </div>
  );
}
