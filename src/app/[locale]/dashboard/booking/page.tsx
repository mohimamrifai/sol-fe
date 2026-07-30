"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "@/i18n/routing";
import { useSearchParams as useNextSearchParams, useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import {
  fetchCustomerBookings,
  fetchCustomerBookingStats,
  fetchCustomerMasterServiceTypes,
} from "@/lib/customer-api";
import { BOOKING_STATUS_META, BOOKING_STATUS_KEYS, SHIPMENT_COVERAGE_LABELS, bookingStatusBadgeClass, bookingStatusLabelFromApi } from "@/lib/booking-status";
import { formatShortDate } from "@/components/dashboard/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchableCombobox, type ComboboxOption } from "@/components/searchable-combobox";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FileText,
  CheckCircle2,
  XCircle,
  Send,
  Plus,
  Search,
  Calendar,
  Eye,
  ClipboardList,
  SlidersHorizontal,
  X,
} from "lucide-react";
import type { LaravelPaginated } from "@/lib/types-api";

type BookingRow = {
  id: number;
  booking_number: string;
  booking_date?: string | null;
  created_at?: string | null;
  origin?: { name?: string; code?: string } | string | null;
  destination?: { name?: string; code?: string } | string | null;
  origin_name?: string | null;
  destination_name?: string | null;
  service_type?: { name?: string; code?: string; id?: number } | null;
  shipment_coverage?: string | null;
  status: string;
};

const STATUS_ICONS: Record<string, typeof FileText> = {
  draft: FileText,
  submitted: Send,
  approved: CheckCircle2,
  rejected: XCircle,
};

const ALL = "__all__";

export default function CustomerBookingsListPage() {
  const t = useTranslations("Bookings");
  const tStat = useTranslations("Bookings.stats");
  const router = useRouter();
  const pathname = usePathname();
  const search = useNextSearchParams();
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? "id";

  const searchTerm = search.get("search") ?? "";
  const statusFilter = search.get("status") ?? "";
  const serviceTypeFilter = search.get("service_type") ?? "";
  const coverageFilter = search.get("coverage") ?? "";
  const dateFrom = search.get("date_from") ?? "";
  const dateTo = search.get("date_to") ?? "";
  const page = Math.max(1, Number(search.get("page") ?? "1") || 1);

  const [searchInput, setSearchInput] = useState(searchTerm);
  useEffect(() => {
    setSearchInput(searchTerm);
  }, [searchTerm]);
  const debouncedSearch = useDebouncedValue(searchInput, 300);

  useEffect(() => {
    if (debouncedSearch === searchTerm) return;
    updateUrl({ search: debouncedSearch, page: "1" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  function updateUrl(patch: Record<string, string | null>) {
    const sp = new URLSearchParams(Array.from(search.entries()));
    for (const [k, v] of Object.entries(patch)) {
      if (v === null || v === "") sp.delete(k);
      else sp.set(k, v);
    }
    const qs = sp.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  const { data: serviceTypesData } = useQuery({
    queryKey: ["customer", "master", "serviceTypes"],
    queryFn: () => fetchCustomerMasterServiceTypes(),
    staleTime: 5 * 60 * 1000,
  });
  const serviceTypes = useMemo(
    () =>
      (serviceTypesData as { data?: Array<{ id: number; name: string; code?: string }> } | undefined)?.data ?? [],
    [serviceTypesData],
  );

  const { data: statsData } = useQuery({
    queryKey: ["customer", "bookings", "stats"],
    queryFn: () => fetchCustomerBookingStats(),
    staleTime: 30_000,
  });
  const stats = (statsData as { data?: Record<string, number> } | undefined)?.data ?? {};

  const { data: listData, isLoading: listLoading } = useQuery({
    queryKey: ["customer", "bookings", "list", {
      search: searchTerm, status: statusFilter, serviceType: serviceTypeFilter,
      coverage: coverageFilter, dateFrom, dateTo, page,
    }],
    queryFn: ({ signal }) =>
      fetchCustomerBookings({
        search: searchTerm || undefined,
        status: statusFilter || undefined,
        serviceTypeId: serviceTypeFilter ? Number(serviceTypeFilter) : undefined,
        shipmentCoverage: coverageFilter || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        page,
        perPage: 20,
      }, signal),
    placeholderData: (prev) => prev as LaravelPaginated<BookingRow> | undefined,
  });

  const list = listData as LaravelPaginated<BookingRow> | undefined;
  const rows = useMemo(() => (list?.data ?? []) as BookingRow[], [list?.data]);

  const statusOptions: ComboboxOption[] = useMemo(
    () => [
      { value: ALL, label: t("filter.allStatus") },
      ...BOOKING_STATUS_KEYS.map((k) => ({ value: k, label: bookingStatusLabelFromApi(k) })),
    ],
    [t],
  );
  const serviceTypeOptions: ComboboxOption[] = useMemo(
    () => [
      { value: ALL, label: t("filter.allServiceTypes") },
      ...serviceTypes.map((st) => ({ value: String(st.id), label: st.name })),
    ],
    [serviceTypes, t],
  );
  const coverageOptions: ComboboxOption[] = useMemo(
    () => [
      { value: ALL, label: t("filter.allCoverages") },
      ...Object.entries(SHIPMENT_COVERAGE_LABELS).map(([value, label]) => ({ value, label })),
    ],
    [t],
  );

  const hasActiveFilter =
    !!searchTerm || !!statusFilter || !!serviceTypeFilter || !!coverageFilter || !!dateFrom || !!dateTo;

  function clearFilters() {
    setSearchInput("");
    updateUrl({
      search: null,
      status: null,
      service_type: null,
      coverage: null,
      date_from: null,
      date_to: null,
      page: "1",
    });
  }

  return (
    <div className="flex min-w-0 w-full flex-1 flex-col gap-6 md:px-2 pb-24">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="flex min-w-0 items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-white shadow-lg">
            <ClipboardList className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 sm:text-2xl uppercase">{t("title")}</h1>
            <p className="mt-1 text-sm text-balance text-muted-foreground">{t("subtitle")}</p>
          </div>
        </div>
        <Button
          type="button"
          onClick={() => router.push("/dashboard/booking/create")}
          className="bg-zinc-900 text-white hover:bg-zinc-800 shadow-md"
        >
          <Plus className="mr-2 h-4 w-4" />
          {t("createButton")}
        </Button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {BOOKING_STATUS_KEYS.map((key) => {
          const meta = BOOKING_STATUS_META[key];
          const Icon = STATUS_ICONS[key] ?? FileText;
          const value = Number(stats?.[key] ?? 0);
          return (
            <BookingStatCard
              key={key}
              label={t("table.title")}
              description={tStat(key)}
              value={value}
              icon={<Icon className={`h-5 w-5 ${meta.iconColor}`} />}
              iconBg={meta.iconBg}
            />
          );
        })}
      </div>

      {/* Filter bar — Search takes its own row so dropdowns can share a single grid below */}
      <Card className="border-zinc-200 shadow-[0_1px_2px_0_rgb(0_0_0/0.04)]">
        <CardContent className="p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span>{t("filter.title")}</span>
            </div>
            {hasActiveFilter ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-7 gap-1 px-2 text-xs text-zinc-600 hover:text-zinc-900"
              >
                <X className="h-3.5 w-3.5" />
                {t("filter.clear")}
              </Button>
            ) : null}
          </div>

          {/* Row 1 — full-width search */}
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={t("filter.searchPlaceholder")}
              className="h-10 pl-9"
            />
          </div>

          {/* Row 2 — Status / Service Type / Coverage share a 3-col grid */}
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <FilterField label={t("filter.status")}>
              <SearchableCombobox
                value={statusFilter || ALL}
                onChange={(v) => updateUrl({ status: v === ALL ? null : v, page: "1" })}
                options={statusOptions}
                placeholder={t("filter.allStatus")}
                searchPlaceholder={t("filter.searchPlaceholder")}
                aria-label={t("filter.status")}
              />
            </FilterField>

            <FilterField label={t("filter.serviceType")}>
              <SearchableCombobox
                value={serviceTypeFilter || ALL}
                onChange={(v) => updateUrl({ service_type: v === ALL ? null : v, page: "1" })}
                options={serviceTypeOptions}
                placeholder={t("filter.allServiceTypes")}
                searchPlaceholder={t("filter.searchPlaceholder")}
                aria-label={t("filter.serviceType")}
              />
            </FilterField>

            <FilterField label={t("filter.coverage")}>
              <SearchableCombobox
                value={coverageFilter || ALL}
                onChange={(v) => updateUrl({ coverage: v === ALL ? null : v, page: "1" })}
                options={coverageOptions}
                placeholder={t("filter.allCoverages")}
                searchPlaceholder={t("filter.searchPlaceholder")}
                aria-label={t("filter.coverage")}
              />
            </FilterField>
          </div>

          {/* Row 3 — Date range gets its own full-width row so each input
              has enough horizontal space for dd/mm/yyyy + calendar icon */}
          <div className="mt-3">
            <FilterField label={t("filter.bookingDate")}>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div className="relative">
                  <Calendar className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => updateUrl({ date_from: e.target.value || null, page: "1" })}
                    aria-label={t("filter.dateFrom")}
                    placeholder={t("filter.dateFrom")}
                    className="h-10 pl-9"
                  />
                </div>
                <div className="relative">
                  <Calendar className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => updateUrl({ date_to: e.target.value || null, page: "1" })}
                    aria-label={t("filter.dateTo")}
                    placeholder={t("filter.dateTo")}
                    className="h-10 pl-9"
                  />
                </div>
              </div>
            </FilterField>
          </div>
        </CardContent>
      </Card>

      {/* Table — matches dashboard styling (Table primitives, no outer Card) */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[140px]">{t("table.columns.bookingNo")}</TableHead>
            <TableHead>{t("table.columns.bookingDate")}</TableHead>
            <TableHead>{t("table.columns.origin")}</TableHead>
            <TableHead>{t("table.columns.destination")}</TableHead>
            <TableHead>{t("table.columns.service")}</TableHead>
            <TableHead>{t("table.columns.coverage")}</TableHead>
            <TableHead>{t("table.columns.status")}</TableHead>
            <TableHead className="w-20 text-right">{t("table.columns.action")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {listLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <TableRow key={i}>
                {Array.from({ length: 8 }).map((__, j) => (
                  <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                ))}
              </TableRow>
            ))
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="h-32 text-center text-sm text-zinc-500">
                {t("table.empty")}
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => {
              const originName = readLocationName(row.origin) ?? row.origin_name ?? "—";
              const destName = readLocationName(row.destination) ?? row.destination_name ?? "—";
              const serviceLabel = row.service_type?.name ?? "—";
              const coverage = row.shipment_coverage ? SHIPMENT_COVERAGE_LABELS[row.shipment_coverage] ?? "—" : "—";
              const bookingDate = row.booking_date ?? row.created_at ?? null;
              return (
                <TableRow key={row.id}>
                  <TableCell>
                    <button
                      type="button"
                      onClick={() => router.push(`/dashboard/booking/${row.id}`)}
                      className="font-mono text-xs text-zinc-700 hover:text-zinc-900 hover:underline"
                    >
                      {row.booking_number}
                    </button>
                  </TableCell>
                  <TableCell className="text-sm tabular-nums text-zinc-600">
                    {bookingDate ? formatShortDate(bookingDate, locale) : "—"}
                  </TableCell>
                  <TableCell className="text-sm text-zinc-700">{originName}</TableCell>
                  <TableCell className="text-sm text-zinc-700">{destName}</TableCell>
                  <TableCell className="text-sm text-zinc-600">{serviceLabel}</TableCell>
                  <TableCell className="text-sm text-zinc-700">{coverage}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={bookingStatusBadgeClass(row.status)}
                    >
                      {bookingStatusLabelFromApi(row.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => router.push(`/dashboard/booking/${row.id}`)}
                      aria-label={t("table.actionDetail")}
                      className="text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>

      {/* Pagination */}
      {list && (list.last_page ?? 1) > 1 ? (
        <div className="flex items-center justify-between rounded-lg border border-zinc-100 bg-zinc-50/40 px-4 py-3 text-xs text-zinc-500">
          <span>
            {t("pagination.summary", {
              current: list.current_page ?? 1,
              last: list.last_page ?? 1,
              total: list.total ?? 0,
            })}
          </span>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={!list.prev_page_url}
              onClick={() => updateUrl({ page: String(Math.max(1, (list.current_page ?? 1) - 1)) })}
            >
              {t("pagination.prev")}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={!list.next_page_url}
              onClick={() => updateUrl({ page: String((list.current_page ?? 1) + 1) })}
            >
              {t("pagination.next")}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function readLocationName(loc: BookingRow["origin"] | BookingRow["destination"]): string | undefined {
  if (!loc) return undefined;
  if (typeof loc === "string") return loc;
  return loc.name;
}

function FilterField({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
        {label}
      </label>
      {children}
    </div>
  );
}

function BookingStatCard({
  label,
  description,
  value,
  icon,
  iconBg,
}: {
  label: string;
  description: string;
  value: number;
  icon: React.ReactNode;
  iconBg: string;
}) {
  return (
    <Card className="border-zinc-200 shadow-[0_1px_2px_0_rgb(0_0_0/0.04)]">
      <CardContent className="flex items-start gap-4 p-5">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">{label}</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-zinc-900">{value}</p>
          <p className="mt-0.5 text-xs text-zinc-500">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}
