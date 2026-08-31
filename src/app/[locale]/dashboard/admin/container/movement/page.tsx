"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PaginationBar } from "@/components/data-table/pagination-bar";
import { SearchableCombobox } from "@/components/searchable-combobox";
import { AdminPageHeader } from "@/components/dashboard/admin/shared/admin-page-header";
import { ADMIN_LIST_PAGE_CLASS } from "@/components/dashboard/admin/shared/admin-list-table-styles";
import { useAuthPersistHydrated } from "@/hooks/use-auth-hydrated";
import { fetchAdminContainerMovements, fetchAllAdminContainers, fetchAllAdminShipments, fetchAllAdminYards } from "@/lib/admin-api";
import type { LaravelPaginated } from "@/lib/types-api";
import { ArrowRightLeft } from "lucide-react";
import { useTranslations } from "next-intl";

const PER_PAGE = 20;
const MOVEMENT_ACTIVITIES = ["registered", "assigned", "loaded", "arrived", "released"] as const;

export default function AdminContainerMovementPage() {
  const authHydrated = useAuthPersistHydrated();
  const t = useTranslations("AdminFsdContainers");
  const tc = useTranslations("AdminCommon");

  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [meta, setMeta] = useState<LaravelPaginated<Record<string, unknown>> | null>(null);
  const [yards, setYards] = useState<{ id: number; label: string }[]>([]);
  const [containers, setContainers] = useState<{ id: number; label: string }[]>([]);
  const [shipments, setShipments] = useState<{ id: number; label: string }[]>([]);
  const [page, setPage] = useState(1);
  const [containerFilter, setContainerFilter] = useState("all");
  const [shipmentFilter, setShipmentFilter] = useState("all");
  const [yardFilter, setYardFilter] = useState("all");
  const [activityFilter, setActivityFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [loading, setLoading] = useState(true);

  const activityLabel = useCallback(
    (value: string) => {
      const key = value.toLowerCase();
      if (t.has(`movements.${key}` as "movements.registered")) {
        return t(`movements.${key}` as "movements.registered");
      }
      return value;
    },
    [t]
  );

  const containerFilterOptions = useMemo(
    () => [
      { value: "all", label: t("filters.allContainer") },
      ...containers.map((x) => ({ value: String(x.id), label: x.label })),
    ],
    [t, containers]
  );

  const shipmentFilterOptions = useMemo(
    () => [
      { value: "all", label: tc("filters.all") },
      ...shipments.map((x) => ({ value: String(x.id), label: x.label })),
    ],
    [tc, shipments]
  );

  const yardFilterOptions = useMemo(
    () => [
      { value: "all", label: t("filters.allYard") },
      ...yards.map((x) => ({ value: String(x.id), label: x.label })),
    ],
    [t, yards]
  );

  const activityFilterOptions = useMemo(
    () => [
      { value: "all", label: tc("filters.all") },
      ...MOVEMENT_ACTIVITIES.map((key) => ({
        value: key,
        label: activityLabel(key),
      })),
    ],
    [tc, activityLabel]
  );

  useEffect(() => {
    setPage(1);
  }, [containerFilter, shipmentFilter, yardFilter, activityFilter, dateFrom, dateTo]);

  const load = useCallback(async () => {
    if (!authHydrated) return;
    setLoading(true);
    try {
      const res = await fetchAdminContainerMovements({
        page,
        perPage: PER_PAGE,
        container_asset_id: containerFilter === "all" ? undefined : containerFilter,
        shipment_id: shipmentFilter === "all" ? undefined : shipmentFilter,
        yard_id: yardFilter === "all" ? undefined : yardFilter,
        activity: activityFilter === "all" ? undefined : activityFilter,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
      });
      setRows((res as LaravelPaginated<Record<string, unknown>>).data ?? []);
      setMeta(res as LaravelPaginated<Record<string, unknown>>);
    } catch {
      setRows([]);
      setMeta(null);
    } finally {
      setLoading(false);
    }
  }, [authHydrated, page, containerFilter, shipmentFilter, yardFilter, activityFilter, dateFrom, dateTo]);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    if (!authHydrated) return;
    void Promise.all([
      fetchAllAdminYards(),
      fetchAllAdminContainers(),
      fetchAllAdminShipments(),
    ]).then(([yardRows, containerRows, shipmentRows]) => {
      setYards(yardRows.map((r) => ({
        id: Number(r.id),
        label: `${r.code ?? ""} · ${r.name ?? r.id}`.trim(),
      })));
      setContainers(containerRows.map((r) => ({
        id: Number(r.id),
        label: String(r.container_number ?? r.id),
      })));
      setShipments(shipmentRows.map((r) => ({
        id: Number(r.id),
        label: String(r.shipment_number ?? r.id),
      })));
    });
  }, [authHydrated]);

  const formatDate = (value: unknown) => {
    if (!value) return "—";
    const date = new Date(String(value));
    return date.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
  };

  return (
    <div className={ADMIN_LIST_PAGE_CLASS}>
      <AdminPageHeader icon={ArrowRightLeft} title={t("movementTitle")} description={t("movementSubtitle")} />

      <Card className="min-w-0 overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t("movement.filterTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex w-52 flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">{t("columns.containerNo")}</Label>
              <SearchableCombobox
                value={containerFilter}
                onChange={setContainerFilter}
                options={containerFilterOptions}
                placeholder={t("filters.allContainer")}
                searchPlaceholder={t("searchPlaceholder")}
                className="h-9"
                aria-label={t("columns.containerNo")}
              />
            </div>
            <div className="flex w-52 flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">{t("columns.shipment")}</Label>
              <SearchableCombobox
                value={shipmentFilter}
                onChange={setShipmentFilter}
                options={shipmentFilterOptions}
                placeholder={tc("filters.all")}
                searchPlaceholder={t("searchPlaceholder")}
                className="h-9"
                aria-label={t("columns.shipment")}
              />
            </div>
            <div className="flex w-52 flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">{t("columns.yard")}</Label>
              <SearchableCombobox
                value={yardFilter}
                onChange={setYardFilter}
                options={yardFilterOptions}
                placeholder={t("filters.allYard")}
                searchPlaceholder={t("searchPlaceholder")}
                className="h-9"
                aria-label={t("columns.yard")}
              />
            </div>
            <div className="flex w-44 flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">{t("movement.activity")}</Label>
              <Select value={activityFilter} onValueChange={(v) => v && setActivityFilter(v)}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder={t("movement.activity")} />
                </SelectTrigger>
                <SelectContent>
                  {activityFilterOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-2">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">{tc("filters.from")}</Label>
                <Input className="h-9 w-36" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">{tc("filters.to")}</Label>
                <Input className="h-9 w-36" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="min-w-0 overflow-hidden">
        <CardHeader><CardTitle>{t("movementListTitle")}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <p className="text-sm text-muted-foreground">{tc("actions.loading")}</p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("movement.occurredAt")}</TableHead>
                    <TableHead>{t("columns.containerNo")}</TableHead>
                    <TableHead>{t("columns.shipment")}</TableHead>
                    <TableHead>{t("movement.from")}</TableHead>
                    <TableHead>{t("movement.to")}</TableHead>
                    <TableHead>{t("movement.activity")}</TableHead>
                    <TableHead>{t("movement.createdBy")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={String(r.id)}>
                      <TableCell>{formatDate(r.occurred_at)}</TableCell>
                      <TableCell className="font-mono text-xs">{String(r.container_number ?? "—")}</TableCell>
                      <TableCell className="font-mono text-xs">{String(r.shipment_number ?? "—")}</TableCell>
                      <TableCell>{String(r.location_from ?? "—")}</TableCell>
                      <TableCell>{String(r.location_to ?? "—")}</TableCell>
                      <TableCell>{activityLabel(String(r.activity ?? "—"))}</TableCell>
                      <TableCell>{String(r.created_by ?? "—")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                {rows.length === 0 ? (
                  <TableCaption className="text-xs">{t("movement.empty")}</TableCaption>
                ) : null}
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
