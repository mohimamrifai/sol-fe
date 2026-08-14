"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
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
  createAdminAdditionalCharge,
  fetchAdminAdditionalChargeStats,
  fetchAdminAdditionalCharges,
} from "@/lib/admin-api";
import { ApiError } from "@/lib/api-client";
import { rowNumber } from "@/lib/list-query";
import type { LaravelPaginated } from "@/lib/types-api";
import { cn } from "@/lib/utils";
import { PackagePlus, Plus } from "lucide-react";
import { useTranslations } from "next-intl";

const PER_PAGE = 10;
const CATEGORIES = ["handling", "storage", "documentation", "container", "trucking", "rail", "other"];
const PRICING_BASES = ["per_shipment", "per_container", "per_trip", "per_ton", "per_kg", "per_cbm", "per_day", "per_hour", "per_seal", "per_document"];

export default function MasterAdditionalChargePage() {
  const params = useParams();
  const router = useRouter();
  const locale = String(params?.locale ?? "id");
  const basePath = `/${locale}/dashboard/admin/master/additional-charge`;
  const authHydrated = useAuthPersistHydrated();
  const t = useTranslations("AdminFsdMaster.additionalCharge");
  const tc = useTranslations("AdminCommon");
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [meta, setMeta] = useState<LaravelPaginated<Record<string, unknown>> | null>(null);
  const [stats, setStats] = useState<Record<string, number> | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 400);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: "", charge_category: "other", pricing_basis: "per_shipment", description: "", is_active: true });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!authHydrated) return;
    setLoading(true);
    try {
      const [listRes, statsRes] = await Promise.all([
        fetchAdminAdditionalCharges({
          page,
          perPage: PER_PAGE,
          search: debouncedSearch || undefined,
          charge_category: categoryFilter === "all" ? undefined : categoryFilter,
          status: statusFilter === "all" ? undefined : statusFilter,
        }),
        fetchAdminAdditionalChargeStats(),
      ]);
      setRows((listRes as LaravelPaginated<Record<string, unknown>>).data ?? []);
      setMeta(listRes as LaravelPaginated<Record<string, unknown>>);
      setStats((statsRes as { data: Record<string, number> }).data);
    } finally { setLoading(false); }
  }, [authHydrated, page, debouncedSearch, categoryFilter, statusFilter]);

  useEffect(() => { void load(); }, [load]);

  useMasterPageActions(
    useMemo(
      () => (
        <Button type="button" className="gap-1.5" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          {t("add")}
        </Button>
      ),
      [t]
    )
  );

  const save = async () => {
    setSaving(true);
    try {
      await createAdminAdditionalCharge(form);
      toast.success(t("saved"));
      setDialogOpen(false);
      setForm({ name: "", charge_category: "other", pricing_basis: "per_shipment", description: "", is_active: true });
      await load();
    } catch (e) { toast.error(e instanceof ApiError ? e.message : tc("actions.loading")); }
    finally { setSaving(false); }
  };

  return (
    <>
      <AdminStatsCards className="sm:grid-cols-3" cards={[
        { key: "total", label: t("stats.total"), value: stats?.total ?? 0, icon: PackagePlus, iconClassName: "text-zinc-700 bg-zinc-100" },
        { key: "active", label: t("stats.active"), value: stats?.active ?? 0, icon: PackagePlus, iconClassName: "text-emerald-700 bg-emerald-100" },
        { key: "inactive", label: t("stats.inactive"), value: stats?.inactive ?? 0, icon: PackagePlus, iconClassName: "text-red-700 bg-red-100" },
      ]} />
      <MasterTableShell title={t("listTitle")} description={t("search")} loading={loading} toolbar={
        <div className="space-y-3">
          <TableToolbar searchPlaceholder={t("search")} searchValue={search} onSearchChange={setSearch} filterLabel={tc("filters.status")} filterValue={statusFilter} onFilterChange={setStatusFilter} filterOptions={STATUS_FILTER_OPTIONS} />
          <div className="max-w-xs space-y-1">
            <Label className="text-xs">{t("filters.category")}</Label>
            <Select value={categoryFilter} onValueChange={(v) => v && setCategoryFilter(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{tc("filters.all")}</SelectItem>
                {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{t(`categories.${c}` as "categories.other")}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      }>
        <Table>
          <TableHeader><TableRow>
            <TableHead className="w-14">{tc("table.no")}</TableHead>
            <TableHead>{t("columns.code")}</TableHead>
            <TableHead>{t("columns.name")}</TableHead>
            <TableHead>{t("columns.category")}</TableHead>
            <TableHead>{t("columns.pricingBasis")}</TableHead>
            <TableHead>{tc("table.status")}</TableHead>
            <TableHead className={actionsHeadClass}><span className="max-md:sr-only">{tc("table.actions")}</span></TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {rows.map((r, i) => (
              <TableRow key={String(r.id)}>
                <TableCell className="tabular-nums text-muted-foreground">{rowNumber(meta?.current_page ?? page, PER_PAGE, i)}</TableCell>
                <TableCell className="font-mono text-xs">{String(r.code ?? "—")}</TableCell>
                <TableCell className="font-medium">{String(r.name ?? "—")}</TableCell>
                <TableCell>{String(r.charge_category_label ?? r.charge_category ?? "—")}</TableCell>
                <TableCell>{String(r.pricing_basis_label ?? r.pricing_basis ?? "—")}</TableCell>
                <TableCell><MasterActiveBadge active={r.is_active !== false} /></TableCell>
                <TableCell className={cn(actionsCellClass, "p-2 text-right")}>
                  <MasterRowActions entityLabel="charge" canManage onView={() => router.push(`${basePath}/${r.id}`)} onEdit={() => router.push(`${basePath}/${r.id}`)} />
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
          <DialogHeader><DialogTitle>{t("add")}</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div className="space-y-2"><Label>{t("columns.name")}</Label><Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></div>
            <div className="space-y-2">
              <Label>{t("columns.category")}</Label>
              <Select value={form.charge_category} onValueChange={(v) => v && setForm((f) => ({ ...f, charge_category: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{t(`categories.${c}` as "categories.other")}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("columns.pricingBasis")}</Label>
              <Select value={form.pricing_basis} onValueChange={(v) => v && setForm((f) => ({ ...f, pricing_basis: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PRICING_BASES.map((p) => <SelectItem key={p} value={p}>{t(`pricingBasis.${p}` as "pricingBasis.per_shipment")}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>{t("fields.description")}</Label><Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} /></div>
            <label className="flex items-center gap-2 text-sm"><Checkbox checked={form.is_active} onCheckedChange={(v) => setForm((f) => ({ ...f, is_active: v === true }))} /> Active</label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{tc("actions.cancel")}</Button>
            <Button disabled={saving || !form.name.trim()} onClick={() => void save()}>{saving ? tc("actions.saving") : tc("actions.save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
