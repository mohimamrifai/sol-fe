"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PaginationBar } from "@/components/data-table/pagination-bar";
import { TableToolbar } from "@/components/data-table/table-toolbar";
import { AdminListFilters } from "@/components/data-table/admin-list-filters";
import { useMasterPageActions } from "@/components/shared/master-page-actions";
import { MasterRowActions } from "@/components/shared/master-row-actions";
import { actionsCellClass, actionsHeadClass } from "@/components/shared/master-table-classes";
import { AdminStatsCards } from "@/components/dashboard/admin/shared/admin-stats-cards";
import { useAuthPersistHydrated } from "@/hooks/use-auth-hydrated";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import {
  createAdminTrainSchedule,
  fetchAdminRoutes,
  fetchAdminTrainScheduleStats,
  fetchAdminTrainSchedules,
} from "@/lib/admin-api";
import { BUSINESS_ENTITY_OPTIONS, TRAIN_SCHEDULE_STATUS_OPTIONS } from "@/lib/admin-fsd-options";
import { ApiError } from "@/lib/api-client";
import { rowNumber } from "@/lib/list-query";
import type { LaravelPaginated } from "@/lib/types-api";
import { cn } from "@/lib/utils";
import { Ban, CalendarClock, CheckCircle2, Clock, Plus, Train } from "lucide-react";
import { useTranslations } from "next-intl";

const PER_PAGE = 10;
const BUSINESS_ENTITY_KEYS = BUSINESS_ENTITY_OPTIONS.map((o) => o.value);
const STATUS_KEYS = TRAIN_SCHEDULE_STATUS_OPTIONS.map((s) => s.value);

function statusBadgeClass(status: string): string {
  switch (status) {
    case "upcoming":
      return "bg-sky-100 text-sky-800 border-sky-200";
    case "departed":
      return "bg-amber-100 text-amber-800 border-amber-200";
    case "completed":
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    case "cancelled":
      return "bg-red-100 text-red-800 border-red-200";
    default:
      return "";
  }
}

export default function MasterTrainSchedulePage() {
  const router = useRouter();
  const params = useParams();
  const locale = String(params?.locale ?? "id");
  const authHydrated = useAuthPersistHydrated();
  const t = useTranslations("AdminFsdMaster.trainSchedule");
  const tc = useTranslations("AdminCommon");

  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [meta, setMeta] = useState<LaravelPaginated<Record<string, unknown>> | null>(null);
  const [stats, setStats] = useState<Record<string, number> | null>(null);
  const [routes, setRoutes] = useState<{ id: number; label: string }[]>([]);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 400);
  const [businessEntityFilter, setBusinessEntityFilter] = useState("all");
  const [routeFilter, setRouteFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    business_entity: "company",
    train_number: "",
    route_id: "",
    departure_at: "",
    estimated_arrival_at: "",
    max_containers: "",
    status: "upcoming",
    remark: "",
  });

  const statusLabel = useCallback(
    (value: string) => {
      const key = value as (typeof STATUS_KEYS)[number];
      if (t.has(`statuses.${key}`)) return t(`statuses.${key}` as "statuses.upcoming");
      return value;
    },
    [t]
  );

  const businessEntityFilterOptions = useMemo(
    () => [
      { value: "all", label: t("filters.allBusinessEntity") },
      ...BUSINESS_ENTITY_KEYS.map((key) => ({
        value: key,
        label: t(`businessEntities.${key}` as "businessEntities.company"),
      })),
    ],
    [t]
  );

  const routeFilterOptions = useMemo(
    () => [{ value: "all", label: t("filters.allRoutes") }, ...routes.map((r) => ({ value: String(r.id), label: r.label }))],
    [routes, t]
  );

  const statusFilterOptions = useMemo(
    () => [
      { value: "all", label: tc("filters.allStatus") },
      ...STATUS_KEYS.map((key) => ({
        value: key,
        label: t(`statuses.${key}` as "statuses.upcoming"),
      })),
    ],
    [t, tc]
  );

  const businessEntityFormOptions = useMemo(
    () =>
      BUSINESS_ENTITY_KEYS.map((key) => ({
        value: key,
        label: t(`businessEntities.${key}` as "businessEntities.company"),
      })),
    [t]
  );

  const statusFormOptions = useMemo(
    () =>
      STATUS_KEYS.map((key) => ({
        value: key,
        label: t(`statuses.${key}` as "statuses.upcoming"),
      })),
    [t]
  );

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, businessEntityFilter, routeFilter, statusFilter, dateFrom, dateTo]);

  const load = useCallback(async () => {
    if (!authHydrated) return;
    setLoading(true);
    try {
      const [listRes, statsRes] = await Promise.all([
        fetchAdminTrainSchedules({
          page,
          perPage: PER_PAGE,
          search: debouncedSearch || undefined,
          business_entity: businessEntityFilter === "all" ? undefined : businessEntityFilter,
          route_id: routeFilter === "all" ? undefined : routeFilter,
          status: statusFilter === "all" ? undefined : statusFilter,
          departure_date_from: dateFrom || undefined,
          departure_date_to: dateTo || undefined,
        }),
        fetchAdminTrainScheduleStats(),
      ]);
      setRows((listRes as LaravelPaginated<Record<string, unknown>>).data ?? []);
      setMeta(listRes as LaravelPaginated<Record<string, unknown>>);
      setStats((statsRes as { data: Record<string, number> }).data);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : tc("actions.loading"));
      setRows([]);
      setMeta(null);
    } finally {
      setLoading(false);
    }
  }, [authHydrated, page, debouncedSearch, businessEntityFilter, routeFilter, statusFilter, dateFrom, dateTo, tc]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!authHydrated) return;
    void fetchAdminRoutes({ perPage: 500, status: "active" }).then((res) => {
      setRoutes(((res as LaravelPaginated<Record<string, unknown>>).data ?? []).map((r) => ({
        id: Number(r.id),
        label: String(r.code ?? r.route ?? r.id),
      })));
    });
  }, [authHydrated]);

  const openCreate = () => {
    setForm({
      business_entity: "company",
      train_number: "",
      route_id: "",
      departure_at: "",
      estimated_arrival_at: "",
      max_containers: "",
      status: "upcoming",
      remark: "",
    });
    setDialogOpen(true);
  };

  useMasterPageActions(
    useMemo(
      () => (
        <Button type="button" className="gap-1.5" onClick={openCreate}>
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
      await createAdminTrainSchedule({
        ...form,
        route_id: Number(form.route_id),
        max_containers: form.max_containers ? Number(form.max_containers) : undefined,
      });
      toast.success(t("saved"));
      setDialogOpen(false);
      await load();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : tc("actions.loading"));
    } finally {
      setSaving(false);
    }
  };

  const goDetail = (id: number) => {
    router.push(`/${locale}/dashboard/admin/master/train-schedule/${id}`);
  };

  return (
    <>
      <AdminStatsCards
        className="sm:grid-cols-2 lg:grid-cols-5"
        cards={[
          { key: "total", label: t("stats.total"), value: stats?.total ?? 0, icon: Train, iconClassName: "text-zinc-700 bg-zinc-100" },
          { key: "upcoming", label: t("stats.upcoming"), value: stats?.upcoming ?? 0, icon: Clock, iconClassName: "text-sky-700 bg-sky-100" },
          { key: "departed", label: t("stats.departed"), value: stats?.departed ?? 0, icon: CalendarClock, iconClassName: "text-amber-700 bg-amber-100" },
          { key: "completed", label: t("stats.completed"), value: stats?.completed ?? 0, icon: CheckCircle2, iconClassName: "text-emerald-700 bg-emerald-100" },
          { key: "cancelled", label: t("stats.cancelled"), value: stats?.cancelled ?? 0, icon: Ban, iconClassName: "text-red-700 bg-red-100" },
        ]}
      />

      <Card className="min-w-0 overflow-hidden">
        <CardHeader className="space-y-1 pb-3">
          <CardTitle className="text-base">{t("filterTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <TableToolbar searchPlaceholder={t("search")} searchValue={search} onSearchChange={setSearch} />
          <AdminListFilters
            selects={[
              {
                id: "ts-business-entity",
                label: t("filters.businessEntity"),
                value: businessEntityFilter,
                onChange: setBusinessEntityFilter,
                options: businessEntityFilterOptions,
              },
              {
                id: "ts-route",
                label: t("filters.route"),
                value: routeFilter,
                onChange: setRouteFilter,
                options: routeFilterOptions,
              },
              {
                id: "ts-status",
                label: tc("table.status"),
                value: statusFilter,
                onChange: setStatusFilter,
                options: statusFilterOptions,
              },
            ]}
            dates={[
              {
                id: "ts-departure-from",
                label: `${t("filters.departureDate")} (${tc("filters.from")})`,
                value: dateFrom,
                onChange: setDateFrom,
              },
              {
                id: "ts-departure-to",
                label: `${t("filters.departureDate")} (${tc("filters.to")})`,
                value: dateTo,
                onChange: setDateTo,
              },
            ]}
          />
        </CardContent>
      </Card>

      <Card className="min-w-0 overflow-hidden">
        <CardHeader className="space-y-1">
          <CardTitle>{t("listTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <p className="text-sm text-muted-foreground">{tc("actions.loading")}</p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-14">{tc("table.no")}</TableHead>
                    <TableHead>{t("columns.trainNo")}</TableHead>
                    <TableHead>{t("columns.route")}</TableHead>
                    <TableHead>{t("columns.departure")}</TableHead>
                    <TableHead>{t("columns.eta")}</TableHead>
                    <TableHead>{tc("table.status")}</TableHead>
                    <TableHead>{t("columns.assignedShipments")}</TableHead>
                    <TableHead className={actionsHeadClass}>
                      <span className="max-md:sr-only">{tc("table.actions")}</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r, i) => {
                    const status = String(r.status ?? "upcoming");
                    return (
                      <TableRow key={String(r.id)}>
                        <TableCell className="tabular-nums text-muted-foreground">{rowNumber(meta?.current_page ?? page, PER_PAGE, i)}</TableCell>
                        <TableCell className="font-mono text-xs">{String(r.train_number ?? "—")}</TableCell>
                        <TableCell>{String(r.route ?? "—")}</TableCell>
                        <TableCell>{String(r.departure_at ?? r.departure ?? "—")}</TableCell>
                        <TableCell>{String(r.estimated_arrival_at ?? r.eta ?? "—")}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={statusBadgeClass(status)}>
                            {statusLabel(status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="tabular-nums">{String(r.assigned_shipments_count ?? r.assigned_shipments ?? 0)}</TableCell>
                        <TableCell className={cn(actionsCellClass, "p-2 text-right")}>
                          <MasterRowActions entityLabel={t("entityLabel")} canManage onView={() => goDetail(Number(r.id))} />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
                {rows.length === 0 ? (
                  <TableCaption className="text-xs">{tc("table.empty")}</TableCaption>
                ) : (
                  <TableCaption className="text-xs">{tc("table.rowsOnPage")}</TableCaption>
                )}
              </Table>
              {meta ? (
                <PaginationBar currentPage={meta.current_page} lastPage={meta.last_page} total={meta.total} from={meta.from} to={meta.to} onPageChange={setPage} />
              ) : null}
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("add")}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="space-y-2">
              <Label>{t("fields.businessEntity")}</Label>
              <Select value={form.business_entity} onValueChange={(v) => v && setForm((f) => ({ ...f, business_entity: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {businessEntityFormOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("fields.trainNumber")}</Label>
              <Input value={form.train_number} onChange={(e) => setForm((f) => ({ ...f, train_number: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>{t("fields.route")}</Label>
              <Select value={form.route_id} onValueChange={(v) => v && setForm((f) => ({ ...f, route_id: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder={t("fields.route")}>
                    {form.route_id ? routes.find((r) => String(r.id) === form.route_id)?.label ?? "—" : t("fields.route")}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {routes.map((r) => (
                    <SelectItem key={r.id} value={String(r.id)}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>{t("fields.departure")}</Label>
                <Input type="datetime-local" value={form.departure_at} onChange={(e) => setForm((f) => ({ ...f, departure_at: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>{t("fields.eta")}</Label>
                <Input type="datetime-local" value={form.estimated_arrival_at} onChange={(e) => setForm((f) => ({ ...f, estimated_arrival_at: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t("fields.maxContainers")}</Label>
              <Input type="number" value={form.max_containers} onChange={(e) => setForm((f) => ({ ...f, max_containers: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>{tc("table.status")}</Label>
              <Select value={form.status} onValueChange={(v) => v && setForm((f) => ({ ...f, status: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusFormOptions.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("fields.remark")}</Label>
              <Textarea value={form.remark} onChange={(e) => setForm((f) => ({ ...f, remark: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {tc("actions.cancel")}
            </Button>
            <Button disabled={saving || !form.train_number.trim() || !form.route_id} onClick={() => void save()}>
              {saving ? tc("actions.saving") : tc("actions.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
