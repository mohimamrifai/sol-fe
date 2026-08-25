"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SearchableCombobox } from "@/components/searchable-combobox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PaginationBar } from "@/components/data-table/pagination-bar";
import { TableToolbar } from "@/components/data-table/table-toolbar";
import { MasterTableShell } from "@/components/shared/master-table-shell";
import { useMasterPageActions } from "@/components/shared/master-page-actions";
import { MasterRowActions } from "@/components/shared/master-row-actions";
import { actionsCellClass, actionsHeadClass } from "@/components/shared/master-table-classes";
import { STATUS_FILTER_OPTIONS } from "@/components/shared/master-filters";
import { AdminStatsCards } from "@/components/dashboard/admin/shared/admin-stats-cards";
import { useAuthPersistHydrated } from "@/hooks/use-auth-hydrated";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import {
  createAdminCustomerPricing,
  deactivateAdminCustomerPricing,
  fetchAdminAdditionalCharges,
  fetchAdminCargoCategories,
  fetchAdminCompanies,
  fetchAdminContainerTypes,
  fetchAdminCustomerPricing,
  fetchAdminCustomerPricingStats,
  fetchAdminCustomerPricings,
  fetchAdminLocations,
  updateAdminCustomerPricing,
} from "@/lib/admin-api";
import { ApiError } from "@/lib/api-client";
import { formatIdr } from "@/lib/vendor-fsd-options";
import { rowNumber } from "@/lib/list-query";
import type { LaravelPaginated } from "@/lib/types-api";
import { cn } from "@/lib/utils";
import { DollarSign, Plus } from "lucide-react";
import { useTranslations } from "next-intl";

const PER_PAGE = 10;

type PricingChargeRow = {
  additional_charge_id: string;
  additional_charge_label?: string;
  charge_type: "fixed" | "percentage";
  amount: string;
};

export default function MasterCustomerPricingPage() {
  const authHydrated = useAuthPersistHydrated();
  const t = useTranslations("AdminFsdMaster");
  const tc = useTranslations("AdminCommon");
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [meta, setMeta] = useState<LaravelPaginated<Record<string, unknown>> | null>(null);
  const [stats, setStats] = useState<Record<string, number> | null>(null);
  const [companies, setCompanies] = useState<{ id: number; label: string }[]>([]);
  const [locations, setLocations] = useState<{ id: number; label: string }[]>([]);
  const [categories, setCategories] = useState<{ id: number; label: string }[]>([]);
  const [containerTypes, setContainerTypes] = useState<{ id: number; label: string }[]>([]);
  const [additionalCharges, setAdditionalCharges] = useState<{ id: number; label: string }[]>([]);
  const [charges, setCharges] = useState<PricingChargeRow[]>([]);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 400);
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogRow, setDialogRow] = useState<Record<string, unknown> | null>(null);
  const [form, setForm] = useState({
    company_id: "", origin_location_id: "", destination_location_id: "", cargo_category_id: "",
    service_type: "lcl", shipment_coverage: "port_to_port", pricing_basis: "per_kg",
    rate: "", minimum_charge: "", container_type_id: "", status: "active", remark: "",
  });
  const [saving, setSaving] = useState(false);

  const companyOptions = useMemo(
    () => companies.map((c) => ({ value: String(c.id), label: c.label })),
    [companies]
  );
  const locationOptions = useMemo(
    () => locations.map((l) => ({ value: String(l.id), label: l.label })),
    [locations]
  );
  const additionalChargeOptions = useMemo(() => {
    const map = new Map(additionalCharges.map((ac) => [String(ac.id), ac.label]));
    for (const row of charges) {
      if (row.additional_charge_id && row.additional_charge_label && !map.has(row.additional_charge_id)) {
        map.set(row.additional_charge_id, row.additional_charge_label);
      }
    }
    return Array.from(map.entries()).map(([value, label]) => ({ value, label }));
  }, [additionalCharges, charges]);

  const load = useCallback(async () => {
    if (!authHydrated) return;
    setLoading(true);
    try {
      const [listRes, statsRes] = await Promise.all([
        fetchAdminCustomerPricings({ page, perPage: PER_PAGE, search: debouncedSearch || undefined, status: statusFilter === "all" ? undefined : statusFilter }),
        fetchAdminCustomerPricingStats(),
      ]);
      setRows((listRes as LaravelPaginated<Record<string, unknown>>).data ?? []);
      setMeta(listRes as LaravelPaginated<Record<string, unknown>>);
      setStats((statsRes as { data: Record<string, number> }).data);
    } finally { setLoading(false); }
  }, [authHydrated, page, debouncedSearch, statusFilter]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    if (!authHydrated) return;
    void Promise.all([
      fetchAdminCompanies({ perPage: 500 }),
      fetchAdminLocations({ perPage: 500 }),
      fetchAdminCargoCategories({ perPage: 200 }),
      fetchAdminContainerTypes({ perPage: 200 }),
      fetchAdminAdditionalCharges({ perPage: 200, status: "active" }),
    ]).then(([cRes, lRes, catRes, ctRes, acRes]) => {
      setCompanies(((cRes as LaravelPaginated<Record<string, unknown>>).data ?? []).map((r) => ({ id: Number(r.id), label: String(r.name ?? r.code) })));
      setLocations(((lRes as LaravelPaginated<Record<string, unknown>>).data ?? []).map((r) => ({ id: Number(r.id), label: `${r.code ?? ""} · ${r.name ?? r.id}`.trim() })));
      setCategories(((catRes as LaravelPaginated<Record<string, unknown>>).data ?? []).map((r) => ({ id: Number(r.id), label: String(r.name ?? r.code) })));
      setContainerTypes(((ctRes as LaravelPaginated<Record<string, unknown>>).data ?? []).map((r) => ({ id: Number(r.id), label: String(r.name ?? r.code) })));
      setAdditionalCharges(((acRes as LaravelPaginated<Record<string, unknown>>).data ?? []).map((r) => ({ id: Number(r.id), label: String(r.name ?? r.code) })));
    });
  }, [authHydrated]);

  const openEdit = async (row: Record<string, unknown> | null) => {
    setDialogRow(row);
    setForm(row ? {
      company_id: String(row.company_id ?? ""), origin_location_id: String(row.origin_location_id ?? ""),
      destination_location_id: String(row.destination_location_id ?? ""), cargo_category_id: String(row.cargo_category_id ?? ""),
      service_type: String(row.service_type ?? "lcl"), shipment_coverage: String(row.shipment_coverage ?? "port_to_port"),
      pricing_basis: String(row.pricing_basis ?? "per_kg"), rate: String(row.rate ?? ""), minimum_charge: String(row.minimum_charge ?? ""),
      container_type_id: String(row.container_type_id ?? ""), status: String(row.status ?? "active"), remark: String(row.remark ?? ""),
    } : { company_id: "", origin_location_id: "", destination_location_id: "", cargo_category_id: "", service_type: "lcl", shipment_coverage: "port_to_port", pricing_basis: "per_kg", rate: "", minimum_charge: "", container_type_id: "", status: "active", remark: "" });

    if (row?.id) {
      try {
        const res = await fetchAdminCustomerPricing(Number(row.id));
        const detail = (res as { data: Record<string, unknown> }).data;
        const chargeRows = (detail.charges as Record<string, unknown>[] | undefined) ?? [];
        setCharges(
          chargeRows.map((c) => ({
            additional_charge_id: String(c.additional_charge_id ?? ""),
            additional_charge_label: String(c.additional_charge ?? ""),
            charge_type: (String(c.charge_type ?? "fixed") as "fixed" | "percentage"),
            amount: String(c.amount ?? ""),
          }))
        );
      } catch {
        setCharges([]);
      }
    } else {
      setCharges([]);
    }
    setDialogOpen(true);
  };

  const addChargeRow = () => {
    setCharges((prev) => [...prev, { additional_charge_id: "", charge_type: "fixed", amount: "" }]);
  };

  const removeChargeRow = (index: number) => {
    setCharges((prev) => prev.filter((_, i) => i !== index));
  };

  const updateChargeRow = (index: number, patch: Partial<PricingChargeRow>) => {
    setCharges((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };

  const save = async () => {
    setSaving(true);
    try {
      const body = {
        ...form,
        company_id: Number(form.company_id),
        origin_location_id: Number(form.origin_location_id),
        destination_location_id: Number(form.destination_location_id),
        cargo_category_id: Number(form.cargo_category_id),
        rate: Number(form.rate),
        minimum_charge: form.minimum_charge ? Number(form.minimum_charge) : undefined,
        container_type_id: form.container_type_id ? Number(form.container_type_id) : undefined,
        charges: charges
          .filter((c) => c.additional_charge_id && c.amount)
          .map((c) => ({
            additional_charge_id: Number(c.additional_charge_id),
            charge_type: c.charge_type,
            amount: Number(c.amount),
          })),
      };
      if (dialogRow?.id) await updateAdminCustomerPricing(Number(dialogRow.id), body);
      else await createAdminCustomerPricing(body);
      toast.success(t("customerPricing.saved"));
      setDialogOpen(false);
      await load();
    } catch (e) { toast.error(e instanceof ApiError ? e.message : tc("actions.loading")); }
    finally { setSaving(false); }
  };

  useMasterPageActions(
    useMemo(
      () => (
        <Button type="button" className="gap-1.5" onClick={() => void openEdit(null)}>
          <Plus className="h-4 w-4" />
          {t("customerPricing.add")}
        </Button>
      ),
      [t]
    )
  );

  return (
    <>
      <AdminStatsCards className="sm:grid-cols-2 lg:grid-cols-4" cards={[
        { key: "total", label: t("customerPricing.stats.total"), value: stats?.total ?? 0, icon: DollarSign, iconClassName: "text-zinc-700 bg-zinc-100" },
        { key: "active", label: t("customerPricing.stats.active"), value: stats?.active ?? 0, icon: DollarSign, iconClassName: "text-emerald-700 bg-emerald-100" },
        { key: "inactive", label: t("customerPricing.stats.inactive"), value: stats?.inactive ?? 0, icon: DollarSign, iconClassName: "text-red-700 bg-red-100" },
        { key: "customers", label: t("customerPricing.stats.customers"), value: stats?.customers ?? 0, icon: DollarSign, iconClassName: "text-sky-700 bg-sky-100" },
      ]} />
      <MasterTableShell title={t("customerPricing.listTitle")} description={t("customerPricing.search")} loading={loading} toolbar={
        <TableToolbar searchPlaceholder={t("customerPricing.search")} searchValue={search} onSearchChange={setSearch} filterLabel={tc("filters.status")} filterValue={statusFilter} onFilterChange={setStatusFilter} filterOptions={STATUS_FILTER_OPTIONS} />
      }>
        <Table>
          <TableHeader><TableRow>
            <TableHead className="w-14">{tc("table.no")}</TableHead>
            <TableHead>{t("customerPricing.columns.customer")}</TableHead>
            <TableHead>{t("customerPricing.columns.route")}</TableHead>
            <TableHead>{t("customerPricing.columns.service")}</TableHead>
            <TableHead className="text-right">{t("customerPricing.columns.rate")}</TableHead>
            <TableHead>{tc("table.status")}</TableHead>
            <TableHead className={actionsHeadClass}><span className="max-md:sr-only">{tc("table.actions")}</span></TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {rows.map((r, i) => (
              <TableRow key={String(r.id)}>
                <TableCell className="tabular-nums text-muted-foreground">{rowNumber(meta?.current_page ?? page, PER_PAGE, i)}</TableCell>
                <TableCell className="font-medium">{String(r.customer ?? "—")}</TableCell>
                <TableCell>{String(r.route ?? "—")}</TableCell>
                <TableCell>{String(r.service_type ?? "—")}</TableCell>
                <TableCell className="text-right tabular-nums">{formatIdr(r.rate as string)}</TableCell>
                <TableCell><Badge variant="outline">{String(r.status ?? "—")}</Badge></TableCell>
                <TableCell className={cn(actionsCellClass, "p-2 text-right")}>
                  <MasterRowActions entityLabel="pricing" canManage onView={() => void openEdit(r)} onEdit={() => void openEdit(r)} onDelete={r.status === "active" ? () => void deactivateAdminCustomerPricing(Number(r.id)).then(load) : undefined} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          {rows.length === 0 ? <TableCaption className="text-xs">{tc("table.empty")}</TableCaption> : null}
        </Table>
        {meta ? <PaginationBar currentPage={meta.current_page} lastPage={meta.last_page} total={meta.total} from={meta.from} to={meta.to} onPageChange={setPage} /> : null}
      </MasterTableShell>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{dialogRow ? t("customerPricing.edit") : t("customerPricing.add")}</DialogTitle></DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label>{t("customerPricing.columns.customer")}</Label>
              <SearchableCombobox
                value={form.company_id}
                onChange={(v) => setForm((f) => ({ ...f, company_id: v }))}
                options={companyOptions}
                placeholder={t("customerPricing.columns.customer")}
                searchPlaceholder="Cari customer…"
                aria-label={t("customerPricing.columns.customer")}
              />
            </div>
            <div className="space-y-2">
              <Label>Origin</Label>
              <SearchableCombobox
                value={form.origin_location_id}
                onChange={(v) => setForm((f) => ({ ...f, origin_location_id: v }))}
                options={locationOptions}
                placeholder="Origin"
                searchPlaceholder="Cari lokasi…"
                aria-label="Origin"
              />
            </div>
            <div className="space-y-2">
              <Label>Destination</Label>
              <SearchableCombobox
                value={form.destination_location_id}
                onChange={(v) => setForm((f) => ({ ...f, destination_location_id: v }))}
                options={locationOptions}
                placeholder="Destination"
                searchPlaceholder="Cari lokasi…"
                aria-label="Destination"
              />
            </div>
            <div className="space-y-2">
              <Label>Cargo Category</Label>
              <Select value={form.cargo_category_id} onValueChange={(v) => v && setForm((f) => ({ ...f, cargo_category_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Category">{form.cargo_category_id ? categories.find((c) => String(c.id) === form.cargo_category_id)?.label ?? "—" : "Category"}</SelectValue></SelectTrigger>
                <SelectContent>{categories.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("customerPricing.columns.service")}</Label>
              <Select value={form.service_type} onValueChange={(v) => v && setForm((f) => ({ ...f, service_type: v }))}>
                <SelectTrigger><SelectValue placeholder="Service">{form.service_type}</SelectValue></SelectTrigger>
                <SelectContent><SelectItem value="lcl">LCL</SelectItem><SelectItem value="fcl">FCL</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>{t("customerPricing.columns.rate")}</Label><Input type="number" value={form.rate} onChange={(e) => setForm((f) => ({ ...f, rate: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Minimum Charge</Label><Input type="number" value={form.minimum_charge} onChange={(e) => setForm((f) => ({ ...f, minimum_charge: e.target.value }))} /></div>
            {form.service_type === "fcl" ? (
              <div className="space-y-2 sm:col-span-2">
                <Label>Container Type</Label>
                <Select value={form.container_type_id || "none"} onValueChange={(v) => setForm((f) => ({ ...f, container_type_id: !v || v === "none" ? "" : v }))}>
                  <SelectTrigger><SelectValue placeholder="Container Type">{form.container_type_id ? containerTypes.find((c) => String(c.id) === form.container_type_id)?.label ?? "—" : "Container Type"}</SelectValue></SelectTrigger>
                  <SelectContent><SelectItem value="none">—</SelectItem>{containerTypes.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            ) : null}
            <div className="space-y-2 sm:col-span-2"><Label>Remark</Label><Textarea value={form.remark} onChange={(e) => setForm((f) => ({ ...f, remark: e.target.value }))} /></div>
            <div className="space-y-3 sm:col-span-2 rounded-lg border p-3">
              <div className="flex items-center justify-between gap-2">
                <Label>{t("customerPricing.additionalCharges")}</Label>
                <Button type="button" variant="outline" size="sm" onClick={addChargeRow}>
                  <Plus className="h-4 w-4" />
                  {t("customerPricing.addCharge")}
                </Button>
              </div>
              {charges.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("customerPricing.noCharges")}</p>
              ) : (
                <div className="space-y-3">
                  {charges.map((charge, index) => {
                    const chargeTypeLabel =
                      charge.charge_type === "fixed"
                        ? t("customerPricing.chargeFixed")
                        : t("customerPricing.chargePercentage");

                    return (
                      <div key={index} className="space-y-3 rounded-md border bg-muted/20 p-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-medium text-muted-foreground">#{index + 1}</span>
                          <Button type="button" variant="ghost" size="sm" onClick={() => removeChargeRow(index)}>
                            {tc("actions.delete")}
                          </Button>
                        </div>
                        <div className="space-y-2">
                          <Label>{t("customerPricing.chargeName")}</Label>
                          <SearchableCombobox
                            value={charge.additional_charge_id}
                            onChange={(v) => {
                              const label = additionalChargeOptions.find((o) => o.value === v)?.label;
                              updateChargeRow(index, {
                                additional_charge_id: v,
                                ...(label ? { additional_charge_label: label } : {}),
                              });
                            }}
                            options={additionalChargeOptions}
                            placeholder={t("customerPricing.chargeName")}
                            searchPlaceholder="Cari charge…"
                            aria-label={t("customerPricing.chargeName")}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Charge Type</Label>
                          <Select
                            value={charge.charge_type}
                            onValueChange={(v) => v && updateChargeRow(index, { charge_type: v as "fixed" | "percentage" })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Charge Type">{chargeTypeLabel}</SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="fixed">{t("customerPricing.chargeFixed")}</SelectItem>
                              <SelectItem value="percentage">{t("customerPricing.chargePercentage")}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>{t("customerPricing.chargeAmount")}</Label>
                          <Input
                            type="number"
                            className="w-full"
                            value={charge.amount}
                            onChange={(e) => updateChargeRow(index, { amount: e.target.value })}
                            placeholder={t("customerPricing.chargeAmount")}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
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
