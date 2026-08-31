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
import { SearchableCombobox } from "@/components/searchable-combobox";
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
import { createAdminYard, deactivateAdminYard, fetchAllAdminStations, fetchAdminYardStats, fetchAdminYards, updateAdminYard } from "@/lib/admin-api";
import { ApiError } from "@/lib/api-client";
import { rowNumber } from "@/lib/list-query";
import type { LaravelPaginated } from "@/lib/types-api";
import { cn } from "@/lib/utils";
import { Plus, Warehouse } from "lucide-react";
import { useTranslations } from "next-intl";

const PER_PAGE = 10;

export default function MasterYardPage() {
  const router = useRouter();
  const params = useParams();
  const locale = String(params?.locale ?? "id");
  const authHydrated = useAuthPersistHydrated();
  const t = useTranslations("AdminFsdMaster");
  const ty = useTranslations("AdminFsdMaster.yard");
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
  const [form, setForm] = useState({ name: "", code: "", business_entity: "company", station_id: "", yard_type: "origin_yard", status: "active", remark: "", city: "", province: "", address: "" });
  const [saving, setSaving] = useState(false);

  const yardTypeLabel = useCallback(
    (value: string) => ty(`yardTypes.${value}` as "yardTypes.origin_yard"),
    [ty]
  );

  const stationOptions = useMemo(
    () => stations.map((s) => ({ value: String(s.id), label: s.label })),
    [stations]
  );

  const load = useCallback(async () => {
    if (!authHydrated) return;
    setLoading(true);
    try {
      const [listRes, statsRes] = await Promise.all([
        fetchAdminYards({ page, perPage: PER_PAGE, search: debouncedSearch || undefined, status: statusFilter === "all" ? undefined : statusFilter }),
        fetchAdminYardStats(),
      ]);
      setRows((listRes as LaravelPaginated<Record<string, unknown>>).data ?? []);
      setMeta(listRes as LaravelPaginated<Record<string, unknown>>);
      setStats((statsRes as { data: Record<string, number> }).data);
    } finally { setLoading(false); }
  }, [authHydrated, page, debouncedSearch, statusFilter]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    if (!authHydrated) return;
    void fetchAllAdminStations({ status: "active" }).then((rows) => {
      setStations(rows.map((s) => ({ id: Number(s.id), label: `${s.code ?? ""} · ${s.name ?? s.id}`.trim() })));
    });
  }, [authHydrated]);

  const openEdit = (row: Record<string, unknown> | null) => {
    setDialogRow(row);
    setForm(row ? {
      name: String(row.name ?? ""), code: String(row.code ?? ""), business_entity: String(row.business_entity ?? "company"),
      station_id: String(row.station_id ?? ""), yard_type: String(row.yard_type ?? "origin_yard"), status: String(row.status ?? "active"),
      remark: String(row.remark ?? ""), city: String(row.city ?? ""), province: String(row.province ?? ""), address: String(row.address ?? ""),
    } : { name: "", code: "", business_entity: "company", station_id: "", yard_type: "origin_yard", status: "active", remark: "", city: "", province: "", address: "" });
    setDialogOpen(true);
  };

  useMasterPageActions(
    useMemo(
      () => (
        <Button type="button" className="gap-1.5" onClick={() => openEdit(null)}>
          <Plus className="h-4 w-4" />
          {t("yard.add")}
        </Button>
      ),
      [t]
    )
  );

  const save = async () => {
    setSaving(true);
    try {
      const body = { ...form, station_id: Number(form.station_id) };
      if (dialogRow?.id) await updateAdminYard(Number(dialogRow.id), body);
      else await createAdminYard(body);
      toast.success(t("yard.saved"));
      setDialogOpen(false);
      await load();
    } catch (e) { toast.error(e instanceof ApiError ? e.message : tc("actions.loading")); }
    finally { setSaving(false); }
  };

  return (
    <>
      <AdminStatsCards className="sm:grid-cols-3" cards={[
        { key: "total", label: t("yard.stats.total"), value: stats?.total ?? 0, icon: Warehouse, iconClassName: "text-zinc-700 bg-zinc-100" },
        { key: "active", label: t("yard.stats.active"), value: stats?.active ?? 0, icon: Warehouse, iconClassName: "text-emerald-700 bg-emerald-100" },
        { key: "inactive", label: t("yard.stats.inactive"), value: stats?.inactive ?? 0, icon: Warehouse, iconClassName: "text-red-700 bg-red-100" },
      ]} />
      <MasterTableShell title={t("yard.listTitle")} description={t("yard.search")} loading={loading} toolbar={
        <TableToolbar searchPlaceholder={t("yard.search")} searchValue={search} onSearchChange={setSearch} filterLabel={tc("filters.status")} filterValue={statusFilter} onFilterChange={setStatusFilter} filterOptions={STATUS_FILTER_OPTIONS} />
      }>
        <Table>
          <TableHeader><TableRow>
            <TableHead className="w-14">{tc("table.no")}</TableHead>
            <TableHead>{t("yard.columns.code")}</TableHead>
            <TableHead>{t("yard.columns.name")}</TableHead>
            <TableHead>{t("yard.columns.type")}</TableHead>
            <TableHead>{tc("table.status")}</TableHead>
            <TableHead className={actionsHeadClass}><span className="max-md:sr-only">{tc("table.actions")}</span></TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {rows.map((r, i) => (
              <TableRow key={String(r.id)}>
                <TableCell className="tabular-nums text-muted-foreground">{rowNumber(meta?.current_page ?? page, PER_PAGE, i)}</TableCell>
                <TableCell className="font-mono text-xs">{String(r.code ?? "—")}</TableCell>
                <TableCell className="font-medium">{String(r.name ?? "—")}</TableCell>
                <TableCell>{yardTypeLabel(String(r.yard_type ?? ""))}</TableCell>
                <TableCell><MasterActiveBadge active={r.status === "active"} /></TableCell>
                <TableCell className={cn(actionsCellClass, "p-2 text-right")}>
                  <MasterRowActions entityLabel="yard" canManage onView={() => router.push(`/${locale}/dashboard/admin/master/yard/${r.id}`)} onEdit={() => openEdit(r)} onDelete={r.status === "active" ? () => void deactivateAdminYard(Number(r.id)).then(load) : undefined} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          {rows.length === 0 ? <TableCaption className="text-xs">{tc("table.empty")}</TableCaption> : null}
        </Table>
        {meta ? <PaginationBar currentPage={meta.current_page} lastPage={meta.last_page} total={meta.total} from={meta.from} to={meta.to} onPageChange={setPage} /> : null}
      </MasterTableShell>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{dialogRow ? t("yard.edit") : t("yard.add")}</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div className="space-y-2"><Label>{t("yard.columns.name")}</Label><Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></div>
            <div className="space-y-2">
              <Label>{ty("fields.station")}</Label>
              <SearchableCombobox
                value={form.station_id}
                onChange={(v) => setForm((f) => ({ ...f, station_id: v }))}
                options={stationOptions}
                placeholder={ty("fields.station")}
                searchPlaceholder={t("station.search") || ty("search")}
                aria-label={ty("fields.station")}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("yard.columns.type")}</Label>
              <Select value={form.yard_type} onValueChange={(v) => v && setForm((f) => ({ ...f, yard_type: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder={t("yard.columns.type")}>
                    {form.yard_type ? yardTypeLabel(form.yard_type) : t("yard.columns.type")}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="origin_yard">{ty("yardTypes.origin_yard")}</SelectItem>
                  <SelectItem value="destination_yard">{ty("yardTypes.destination_yard")}</SelectItem>
                  <SelectItem value="hub_yard">{ty("yardTypes.hub_yard")}</SelectItem>
                </SelectContent>
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
