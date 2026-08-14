"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PaginationBar } from "@/components/data-table/pagination-bar";
import { TableToolbar } from "@/components/data-table/table-toolbar";
import { MasterTableShell } from "@/components/shared/master-table-shell";
import { useMasterPageActions } from "@/components/shared/master-page-actions";
import { MasterRowActions } from "@/components/shared/master-row-actions";
import { MasterActiveBadge } from "@/components/shared/master-active-badge";
import { actionsCellClass, actionsHeadClass } from "@/components/shared/master-table-classes";
import { STATUS_FILTER_OPTIONS } from "@/components/shared/master-filters";
import { AdminStatsCards } from "@/components/dashboard/admin/shared/admin-stats-cards";
import { useAuthPersistHydrated } from "@/hooks/use-auth-hydrated";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import {
  createAdminRoute,
  deactivateAdminRoute,
  fetchAdminRouteStats,
  fetchAdminRoutes,
  fetchAdminStations,
  updateAdminRoute,
} from "@/lib/admin-api";
import { ApiError } from "@/lib/api-client";
import { rowNumber } from "@/lib/list-query";
import type { LaravelPaginated } from "@/lib/types-api";
import { cn } from "@/lib/utils";
import { Plus, Route } from "lucide-react";
import { useTranslations } from "next-intl";

const PER_PAGE = 10;

export default function MasterRoutePage() {
  const router = useRouter();
  const params = useParams();
  const locale = String(params?.locale ?? "id");
  const authHydrated = useAuthPersistHydrated();
  const t = useTranslations("AdminFsdMaster");
  const tc = useTranslations("AdminCommon");
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [meta, setMeta] = useState<LaravelPaginated<Record<string, unknown>> | null>(null);
  const [stats, setStats] = useState<Record<string, number> | null>(null);
  const [stations, setStations] = useState<{ id: number; label: string }[]>([]);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 400);
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogRow, setDialogRow] = useState<Record<string, unknown> | null>(null);
  const [form, setForm] = useState({
    business_entity: "company",
    origin_station_id: "",
    destination_station_id: "",
    distance_km: "",
    transit_days: "1",
    status: "active",
    remark: "",
    service_types: ["lcl"] as string[],
    shipment_coverages: ["port_to_port"] as string[],
  });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!authHydrated) return;
    setLoading(true);
    try {
      const [listRes, statsRes] = await Promise.all([
        fetchAdminRoutes({ page, perPage: PER_PAGE, search: debouncedSearch || undefined, status: statusFilter === "all" ? undefined : statusFilter }),
        fetchAdminRouteStats(),
      ]);
      setRows((listRes as LaravelPaginated<Record<string, unknown>>).data ?? []);
      setMeta(listRes as LaravelPaginated<Record<string, unknown>>);
      setStats((statsRes as { data: Record<string, number> }).data);
    } finally {
      setLoading(false);
    }
  }, [authHydrated, page, debouncedSearch, statusFilter]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    if (!authHydrated) return;
    void fetchAdminStations({ perPage: 500, status: "active" }).then((res) => {
      setStations(((res as LaravelPaginated<Record<string, unknown>>).data ?? []).map((s) => ({
        id: Number(s.id),
        label: `${s.code ?? ""} · ${s.name ?? s.id}`.trim(),
      })));
    });
  }, [authHydrated]);

  const openCreate = useCallback(() => {
    setDialogRow(null);
    setForm({ business_entity: "company", origin_station_id: "", destination_station_id: "", distance_km: "", transit_days: "1", status: "active", remark: "", service_types: ["lcl"], shipment_coverages: ["port_to_port"] });
    setDialogOpen(true);
  }, []);

  useMasterPageActions(
    useMemo(
      () => (
        <Button type="button" className="gap-1.5" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          {t("route.add")}
        </Button>
      ),
      [openCreate, t]
    )
  );

  const openEdit = (row: Record<string, unknown>) => {
    setDialogRow(row);
    const origin = row.origin_station as Record<string, unknown> | undefined;
    const dest = row.destination_station as Record<string, unknown> | undefined;
    setForm({
      business_entity: String(row.business_entity ?? "company"),
      origin_station_id: String(row.origin_station_id ?? origin?.id ?? ""),
      destination_station_id: String(row.destination_station_id ?? dest?.id ?? ""),
      distance_km: String(row.distance_km ?? ""),
      transit_days: String(row.transit_days ?? "1"),
      status: String(row.status ?? "active"),
      remark: String(row.remark ?? ""),
      service_types: (row.service_types as string[] | undefined) ?? ["lcl"],
      shipment_coverages: (row.shipment_coverages as string[] | undefined) ?? ["port_to_port"],
    });
    setDialogOpen(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      const body = {
        ...form,
        distance_km: Number(form.distance_km),
        transit_days: Number(form.transit_days),
        origin_station_id: Number(form.origin_station_id),
        destination_station_id: Number(form.destination_station_id),
      };
      if (dialogRow?.id) await updateAdminRoute(Number(dialogRow.id), body);
      else await createAdminRoute(body);
      toast.success(t("route.saved"));
      setDialogOpen(false);
      await load();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : tc("actions.loading"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <AdminStatsCards className="sm:grid-cols-2 lg:grid-cols-4" cards={[
        { key: "total", label: t("route.stats.total"), value: stats?.total ?? 0, icon: Route, iconClassName: "text-zinc-700 bg-zinc-100" },
        { key: "active", label: t("route.stats.active"), value: stats?.active ?? 0, icon: Route, iconClassName: "text-emerald-700 bg-emerald-100" },
        { key: "inactive", label: t("route.stats.inactive"), value: stats?.inactive ?? 0, icon: Route, iconClassName: "text-red-700 bg-red-100" },
        { key: "door", label: t("route.stats.door"), value: stats?.door_services ?? 0, icon: Route, iconClassName: "text-sky-700 bg-sky-100" },
      ]} />

      <MasterTableShell title={t("route.listTitle")} description={t("route.search")} loading={loading} toolbar={
        <TableToolbar searchPlaceholder={t("route.search")} searchValue={search} onSearchChange={setSearch} filterLabel={tc("filters.status")} filterValue={statusFilter} onFilterChange={setStatusFilter} filterOptions={STATUS_FILTER_OPTIONS} />
      }>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-14">{tc("table.no")}</TableHead>
              <TableHead>{t("route.columns.code")}</TableHead>
              <TableHead>{t("route.columns.origin")}</TableHead>
              <TableHead>{t("route.columns.destination")}</TableHead>
              <TableHead>{t("route.columns.distance")}</TableHead>
              <TableHead>{tc("table.status")}</TableHead>
              <TableHead className={actionsHeadClass}><span className="max-md:sr-only">{tc("table.actions")}</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r, i) => {
              const origin = r.origin_station as Record<string, unknown> | undefined;
              const dest = r.destination_station as Record<string, unknown> | undefined;
              return (
                <TableRow key={String(r.id)}>
                  <TableCell className="tabular-nums text-muted-foreground">{rowNumber(meta?.current_page ?? page, PER_PAGE, i)}</TableCell>
                  <TableCell className="font-mono text-xs">{String(r.code ?? "—")}</TableCell>
                  <TableCell>{String(origin?.name ?? "—")}</TableCell>
                  <TableCell>{String(dest?.name ?? "—")}</TableCell>
                  <TableCell>{String(r.distance_km ?? "—")} km</TableCell>
                  <TableCell><MasterActiveBadge active={r.status === "active"} /></TableCell>
                  <TableCell className={cn(actionsCellClass, "p-2 text-right")}>
                    <MasterRowActions entityLabel="route" canManage onView={() => router.push(`/${locale}/dashboard/admin/master/route/${r.id}`)} onEdit={() => openEdit(r)} onDelete={r.status === "active" ? () => void deactivateAdminRoute(Number(r.id)).then(load) : undefined} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
          {rows.length === 0 ? <TableCaption className="text-xs">{tc("table.empty")}</TableCaption> : null}
        </Table>
        {meta ? <PaginationBar currentPage={meta.current_page} lastPage={meta.last_page} total={meta.total} from={meta.from} to={meta.to} onPageChange={setPage} /> : null}
      </MasterTableShell>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{dialogRow ? t("route.edit") : t("route.add")}</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div className="space-y-2">
              <Label>{t("route.columns.origin")}</Label>
              <Select value={form.origin_station_id} onValueChange={(v) => v && setForm((f) => ({ ...f, origin_station_id: v }))}>
                <SelectTrigger><SelectValue placeholder={t("route.columns.origin")}>{form.origin_station_id ? stations.find((s) => String(s.id) === form.origin_station_id)?.label ?? "—" : t("route.columns.origin")}</SelectValue></SelectTrigger>
                <SelectContent>{stations.map((s) => <SelectItem key={s.id} value={String(s.id)}>{s.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("route.columns.destination")}</Label>
              <Select value={form.destination_station_id} onValueChange={(v) => v && setForm((f) => ({ ...f, destination_station_id: v }))}>
                <SelectTrigger><SelectValue placeholder={t("route.columns.destination")}>{form.destination_station_id ? stations.find((s) => String(s.id) === form.destination_station_id)?.label ?? "—" : t("route.columns.destination")}</SelectValue></SelectTrigger>
                <SelectContent>{stations.map((s) => <SelectItem key={s.id} value={String(s.id)}>{s.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>{t("route.columns.distance")}</Label><Input type="number" value={form.distance_km} onChange={(e) => setForm((f) => ({ ...f, distance_km: e.target.value }))} /></div>
              <div className="space-y-2"><Label>{t("route.columns.transitDays")}</Label><Input type="number" value={form.transit_days} onChange={(e) => setForm((f) => ({ ...f, transit_days: e.target.value }))} /></div>
            </div>
            <div className="space-y-2"><Label>{tc("table.status")}</Label>
              <Select value={form.status} onValueChange={(v) => v && setForm((f) => ({ ...f, status: v }))}>
                <SelectTrigger><SelectValue placeholder={tc("table.status")}>{form.status}</SelectValue></SelectTrigger>
                <SelectContent><SelectItem value="active">active</SelectItem><SelectItem value="inactive">inactive</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Remark</Label><Textarea value={form.remark} onChange={(e) => setForm((f) => ({ ...f, remark: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{tc("actions.cancel")}</Button>
            <Button disabled={saving} onClick={() => void save()}>{saving ? tc("actions.saving") : tc("actions.save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
