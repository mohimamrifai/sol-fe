"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import { createAdminStation, deactivateAdminStation, fetchAdminStationStats, fetchAdminStations, updateAdminStation } from "@/lib/admin-api";
import { ApiError } from "@/lib/api-client";
import { rowNumber } from "@/lib/list-query";
import type { LaravelPaginated } from "@/lib/types-api";
import { cn } from "@/lib/utils";
import { MapPin, Plus } from "lucide-react";
import { useTranslations } from "next-intl";

const PER_PAGE = 10;

export default function MasterStationPage() {
  const router = useRouter();
  const params = useParams();
  const locale = String(params?.locale ?? "id");
  const authHydrated = useAuthPersistHydrated();
  const t = useTranslations("AdminFsdMaster");
  const tc = useTranslations("AdminCommon");
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [meta, setMeta] = useState<LaravelPaginated<Record<string, unknown>> | null>(null);
  const [stats, setStats] = useState<Record<string, number> | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 400);
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogRow, setDialogRow] = useState<Record<string, unknown> | null>(null);
  const [form, setForm] = useState({ name: "", code: "", business_entity: "company", city: "", province: "", address: "", status: "active", remark: "" });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!authHydrated) return;
    setLoading(true);
    try {
      const [listRes, statsRes] = await Promise.all([
        fetchAdminStations({ page, perPage: PER_PAGE, search: debouncedSearch || undefined, status: statusFilter === "all" ? undefined : statusFilter }),
        fetchAdminStationStats(),
      ]);
      setRows((listRes as LaravelPaginated<Record<string, unknown>>).data ?? []);
      setMeta(listRes as LaravelPaginated<Record<string, unknown>>);
      setStats((statsRes as { data: Record<string, number> }).data);
    } finally { setLoading(false); }
  }, [authHydrated, page, debouncedSearch, statusFilter]);

  useEffect(() => { void load(); }, [load]);

  const openEdit = (row: Record<string, unknown> | null) => {
    setDialogRow(row);
    setForm(row ? {
      name: String(row.name ?? ""), code: String(row.code ?? ""), business_entity: String(row.business_entity ?? "company"),
      city: String(row.city ?? ""), province: String(row.province ?? ""), address: String(row.address ?? ""),
      status: String(row.status ?? "active"), remark: String(row.remark ?? ""),
    } : { name: "", code: "", business_entity: "company", city: "", province: "", address: "", status: "active", remark: "" });
    setDialogOpen(true);
  };

  useMasterPageActions(
    useMemo(
      () => (
        <Button type="button" className="gap-1.5" onClick={() => openEdit(null)}>
          <Plus className="h-4 w-4" />
          {t("station.add")}
        </Button>
      ),
      [t]
    )
  );

  const save = async () => {
    setSaving(true);
    try {
      if (dialogRow?.id) await updateAdminStation(Number(dialogRow.id), form);
      else await createAdminStation(form);
      toast.success(t("station.saved"));
      setDialogOpen(false);
      await load();
    } catch (e) { toast.error(e instanceof ApiError ? e.message : tc("actions.loading")); }
    finally { setSaving(false); }
  };

  return (
    <>
      <AdminStatsCards className="sm:grid-cols-3" cards={[
        { key: "total", label: t("station.stats.total"), value: stats?.total ?? 0, icon: MapPin, iconClassName: "text-zinc-700 bg-zinc-100" },
        { key: "active", label: t("station.stats.active"), value: stats?.active ?? 0, icon: MapPin, iconClassName: "text-emerald-700 bg-emerald-100" },
        { key: "inactive", label: t("station.stats.inactive"), value: stats?.inactive ?? 0, icon: MapPin, iconClassName: "text-red-700 bg-red-100" },
      ]} />
      <MasterTableShell title={t("station.listTitle")} description={t("station.search")} loading={loading} toolbar={
        <TableToolbar searchPlaceholder={t("station.search")} searchValue={search} onSearchChange={setSearch} filterLabel={tc("filters.status")} filterValue={statusFilter} onFilterChange={setStatusFilter} filterOptions={STATUS_FILTER_OPTIONS} />
      }>
        <Table>
          <TableHeader><TableRow>
            <TableHead className="w-14">{tc("table.no")}</TableHead>
            <TableHead>{t("station.columns.code")}</TableHead>
            <TableHead>{t("station.columns.name")}</TableHead>
            <TableHead>{t("station.columns.city")}</TableHead>
            <TableHead>{tc("table.status")}</TableHead>
            <TableHead className={actionsHeadClass}><span className="max-md:sr-only">{tc("table.actions")}</span></TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {rows.map((r, i) => (
              <TableRow key={String(r.id)}>
                <TableCell className="tabular-nums text-muted-foreground">{rowNumber(meta?.current_page ?? page, PER_PAGE, i)}</TableCell>
                <TableCell className="font-mono text-xs">{String(r.code ?? "—")}</TableCell>
                <TableCell className="font-medium">{String(r.name ?? "—")}</TableCell>
                <TableCell>{String(r.city ?? "—")}</TableCell>
                <TableCell><MasterActiveBadge active={r.status === "active"} /></TableCell>
                <TableCell className={cn(actionsCellClass, "p-2 text-right")}>
                  <MasterRowActions entityLabel="station" canManage onView={() => router.push(`/${locale}/dashboard/admin/master/station/${r.id}`)} onEdit={() => openEdit(r)} onDelete={r.status === "active" ? () => void deactivateAdminStation(Number(r.id)).then(load) : undefined} />
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
          <DialogHeader><DialogTitle>{dialogRow ? t("station.edit") : t("station.add")}</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div className="space-y-2"><Label>{t("station.columns.name")}</Label><Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>{t("station.columns.code")}</Label><Input value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} /></div>
              <div className="space-y-2"><Label>{t("station.columns.city")}</Label><Input value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} /></div>
            </div>
            <div className="space-y-2"><Label>Province</Label><Input value={form.province} onChange={(e) => setForm((f) => ({ ...f, province: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Address</Label><Textarea value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} /></div>
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
