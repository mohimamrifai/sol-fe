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
import { fetchAdminContainerMovements, fetchAdminContainers, fetchAdminYards } from "@/lib/admin-api";
import { rowNumber } from "@/lib/list-query";
import type { LaravelPaginated } from "@/lib/types-api";
import { ArrowRightLeft } from "lucide-react";
import { useTranslations } from "next-intl";

const PER_PAGE = 20;

export default function AdminContainerMovementPage() {
  const authHydrated = useAuthPersistHydrated();
  const t = useTranslations("AdminFsdContainers");
  const tc = useTranslations("AdminCommon");

  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [meta, setMeta] = useState<LaravelPaginated<Record<string, unknown>> | null>(null);
  const [yards, setYards] = useState<{ id: number; label: string }[]>([]);
  const [containers, setContainers] = useState<{ id: number; label: string }[]>([]);
  const [page, setPage] = useState(1);
  const [containerFilter, setContainerFilter] = useState("all");
  const [yardFilter, setYardFilter] = useState("all");
  const [activityFilter, setActivityFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [loading, setLoading] = useState(true);

  const containerFilterOptions = useMemo(
    () => [
      { value: "all", label: t("filters.allContainer") },
      ...containers.map((x) => ({ value: String(x.id), label: x.label })),
    ],
    [t, containers]
  );

  const yardFilterOptions = useMemo(
    () => [
      { value: "all", label: t("filters.allYard") },
      ...yards.map((x) => ({ value: String(x.id), label: x.label })),
    ],
    [t, yards]
  );

  useEffect(() => {
    setPage(1);
  }, [containerFilter, yardFilter, activityFilter, dateFrom, dateTo]);

  const load = useCallback(async () => {
    if (!authHydrated) return;
    setLoading(true);
    try {
      const res = await fetchAdminContainerMovements({
        page,
        perPage: PER_PAGE,
        container_asset_id: containerFilter === "all" ? undefined : containerFilter,
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
  }, [authHydrated, page, containerFilter, yardFilter, activityFilter, dateFrom, dateTo]);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    if (!authHydrated) return;
    void Promise.all([
      fetchAdminYards({ perPage: 200 }),
      fetchAdminContainers({ perPage: 500 }),
    ]).then(([yardRes, containerRes]) => {
      setYards(((yardRes as LaravelPaginated<Record<string, unknown>>).data ?? []).map((r) => ({
        id: Number(r.id),
        label: `${r.code ?? ""} · ${r.name ?? r.id}`.trim(),
      })));
      setContainers(((containerRes as LaravelPaginated<Record<string, unknown>>).data ?? []).map((r) => ({
        id: Number(r.id),
        label: String(r.container_number ?? r.id),
      })));
    });
  }, [authHydrated]);

  return (
    <div className={ADMIN_LIST_PAGE_CLASS}>
      <AdminPageHeader icon={ArrowRightLeft} title={t("movementTitle")} description={t("movementSubtitle")} />

      <Card className="min-w-0 overflow-hidden">
        <CardHeader><CardTitle>{t("movementListTitle")}</CardTitle></CardHeader>
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
            <Select value={activityFilter} onValueChange={(v) => v && setActivityFilter(v)}>
              <SelectTrigger className="h-9 w-44">
                <SelectValue placeholder="Activity">
                  {activityFilter === "all" ? tc("filters.all") : activityFilter}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{tc("filters.all")}</SelectItem>
                <SelectItem value="registered">Registered</SelectItem>
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="loaded">Loaded</SelectItem>
                <SelectItem value="arrived">Arrived</SelectItem>
                <SelectItem value="released">Released</SelectItem>
              </SelectContent>
            </Select>
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

          {loading ? (
            <p className="text-sm text-muted-foreground">{tc("actions.loading")}</p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-14">{tc("table.no")}</TableHead>
                    <TableHead>{t("movement.occurredAt")}</TableHead>
                    <TableHead>{t("columns.containerNo")}</TableHead>
                    <TableHead>{t("columns.shipment")}</TableHead>
                    <TableHead>{t("movement.activity")}</TableHead>
                    <TableHead>{t("movement.route")}</TableHead>
                    <TableHead>{t("columns.yard")}</TableHead>
                    <TableHead>{t("movement.createdBy")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r, i) => (
                    <TableRow key={String(r.id)}>
                      <TableCell className="tabular-nums text-muted-foreground">{rowNumber(meta?.current_page ?? page, PER_PAGE, i)}</TableCell>
                      <TableCell>{r.occurred_at ? new Date(String(r.occurred_at)).toLocaleString("id-ID") : "—"}</TableCell>
                      <TableCell className="font-mono text-xs">{String(r.container_number ?? "—")}</TableCell>
                      <TableCell>{String(r.shipment_number ?? "—")}</TableCell>
                      <TableCell>{String(r.activity ?? "—")}</TableCell>
                      <TableCell>{String(r.location_from ?? "—")} → {String(r.location_to ?? "—")}</TableCell>
                      <TableCell>{String(r.yard ?? "—")}</TableCell>
                      <TableCell>{String(r.created_by ?? "—")}</TableCell>
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
    </div>
  );
}
