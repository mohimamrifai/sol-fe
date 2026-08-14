"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PaginationBar } from "@/components/data-table/pagination-bar";
import { TableToolbar } from "@/components/data-table/table-toolbar";
import { AdminPageHeader } from "@/components/dashboard/admin/shared/admin-page-header";
import { actionsCellClass, actionsHeadClass, ADMIN_LIST_PAGE_CLASS } from "@/components/dashboard/admin/shared/admin-list-table-styles";
import { AdminStatsCards } from "@/components/dashboard/admin/shared/admin-stats-cards";
import { useAuthPersistHydrated } from "@/hooks/use-auth-hydrated";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { fetchAdminProofOfDeliveries, fetchAdminProofOfDeliveryStats } from "@/lib/admin-api";
import { rowNumber } from "@/lib/list-query";
import type { LaravelPaginated } from "@/lib/types-api";
import { cn } from "@/lib/utils";
import { CheckCircle2, Clock, Eye, FileCheck, XCircle } from "lucide-react";
import { useTranslations } from "next-intl";

const PER_PAGE = 10;
const STATUS_OPTIONS = ["waiting_pod", "received", "verified", "rejected"] as const;

const STATUS_META: Record<(typeof STATUS_OPTIONS)[number], { icon: typeof Clock; className: string }> = {
  waiting_pod: { icon: Clock, className: "bg-amber-100 text-amber-800" },
  received: { icon: FileCheck, className: "bg-sky-100 text-sky-800" },
  verified: { icon: CheckCircle2, className: "bg-emerald-100 text-emerald-800" },
  rejected: { icon: XCircle, className: "bg-red-100 text-red-800" },
};

export default function AdminProofOfDeliveryOperationsPage() {
  const params = useParams();
  const router = useRouter();
  const locale = String(params?.locale ?? "id");
  const basePath = `/${locale}/dashboard/admin/operations/proof-of-delivery`;
  const authHydrated = useAuthPersistHydrated();
  const t = useTranslations("AdminFsdOperations.pod");
  const tc = useTranslations("AdminCommon");

  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [meta, setMeta] = useState<LaravelPaginated<Record<string, unknown>> | null>(null);
  const [stats, setStats] = useState<Record<string, number> | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 400);
  const [statusFilter, setStatusFilter] = useState("all");
  const [podDateFrom, setPodDateFrom] = useState("");
  const [podDateTo, setPodDateTo] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!authHydrated) return;
    setLoading(true);
    try {
      const [listRes, statsRes] = await Promise.all([
        fetchAdminProofOfDeliveries({
          page,
          perPage: PER_PAGE,
          search: debouncedSearch || undefined,
          status: statusFilter === "all" ? undefined : statusFilter,
          pod_date_from: podDateFrom || undefined,
          pod_date_to: podDateTo || undefined,
        }),
        fetchAdminProofOfDeliveryStats(),
      ]);
      setRows((listRes as LaravelPaginated<Record<string, unknown>>).data ?? []);
      setMeta(listRes as LaravelPaginated<Record<string, unknown>>);
      setStats((statsRes as { data: Record<string, number> }).data);
    } finally {
      setLoading(false);
    }
  }, [authHydrated, page, debouncedSearch, statusFilter, podDateFrom, podDateTo]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className={ADMIN_LIST_PAGE_CLASS}>
      <AdminPageHeader title={t("title")} description={t("description")} icon={FileCheck} />
      <AdminStatsCards
        className="sm:grid-cols-4"
        cards={[
          { key: "waiting", label: t("stats.waiting"), value: stats?.waiting_pod ?? 0, icon: Clock, iconClassName: "text-amber-700 bg-amber-100" },
          { key: "received", label: t("stats.received"), value: stats?.received ?? 0, icon: FileCheck, iconClassName: "text-sky-700 bg-sky-100" },
          { key: "verified", label: t("stats.verified"), value: stats?.verified ?? 0, icon: CheckCircle2, iconClassName: "text-emerald-700 bg-emerald-100" },
          { key: "rejected", label: t("stats.rejected"), value: stats?.rejected ?? 0, icon: XCircle, iconClassName: "text-red-700 bg-red-100" },
        ]}
      />
      <div className="rounded-xl border bg-card">
        <div className="space-y-4 p-4">
          <TableToolbar searchPlaceholder={t("search")} searchValue={search} onSearchChange={setSearch} />
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1">
              <Label className="text-xs">{tc("filters.status")}</Label>
              <Select value={statusFilter} onValueChange={(v) => v && setStatusFilter(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{tc("filters.all")}</SelectItem>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>{t(`status.${s}` as "status.waiting_pod")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{t("filters.podDateFrom")}</Label>
              <Input type="date" value={podDateFrom} onChange={(e) => setPodDateFrom(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{t("filters.podDateTo")}</Label>
              <Input type="date" value={podDateTo} onChange={(e) => setPodDateTo(e.target.value)} />
            </div>
          </div>
          {loading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">{tc("actions.loading")}</p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-14">{tc("table.no")}</TableHead>
                    <TableHead>{t("columns.shipmentNo")}</TableHead>
                    <TableHead>{t("columns.customer")}</TableHead>
                    <TableHead>{t("columns.deliveryDate")}</TableHead>
                    <TableHead>{t("columns.podDate")}</TableHead>
                    <TableHead>{tc("table.status")}</TableHead>
                    <TableHead className={actionsHeadClass}><span className="max-md:sr-only">{tc("table.actions")}</span></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r, i) => {
                    const status = String(r.status ?? "waiting_pod") as (typeof STATUS_OPTIONS)[number];
                    const metaStatus = STATUS_META[status] ?? STATUS_META.waiting_pod;
                    const Icon = metaStatus.icon;
                    return (
                      <TableRow key={String(r.id)}>
                        <TableCell className="tabular-nums text-muted-foreground">{rowNumber(meta?.current_page ?? page, PER_PAGE, i)}</TableCell>
                        <TableCell className="font-mono text-xs">{String(r.shipment_number ?? "—")}</TableCell>
                        <TableCell>{String(r.customer ?? "—")}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{r.delivery_date ? new Date(String(r.delivery_date)).toLocaleDateString() : "—"}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{r.pod_date ? new Date(String(r.pod_date)).toLocaleDateString() : "—"}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn("gap-1", metaStatus.className)}>
                            <Icon className="h-3 w-3" />
                            {String(r.status_label ?? status)}
                          </Badge>
                        </TableCell>
                        <TableCell className={cn(actionsCellClass, "p-2 text-right")}>
                          <Button type="button" variant="ghost" size="sm" className="gap-1" onClick={() => router.push(`${basePath}/${r.id}`)}>
                            <Eye className="h-4 w-4" />
                            {tc("actions.detail")}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
                {rows.length === 0 ? <TableCaption className="text-xs">{tc("table.empty")}</TableCaption> : null}
              </Table>
              {meta ? <PaginationBar currentPage={meta.current_page} lastPage={meta.last_page} total={meta.total} from={meta.from} to={meta.to} onPageChange={setPage} /> : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
