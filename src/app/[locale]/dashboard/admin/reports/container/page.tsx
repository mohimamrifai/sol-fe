"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PaginationBar } from "@/components/data-table/pagination-bar";
import { AdminPageHeader } from "@/components/dashboard/admin/shared/admin-page-header";
import { ADMIN_LIST_PAGE_CLASS } from "@/components/dashboard/admin/shared/admin-list-table-styles";
import { useAuthPersistHydrated } from "@/hooks/use-auth-hydrated";
import { AdminReportExportButtons } from "@/components/dashboard/admin/shared/admin-report-export-buttons";
import { adminContainerReportExportUrl, fetchAdminContainerReport, fetchAdminVendors } from "@/lib/admin-api";
import { rowNumber } from "@/lib/list-query";
import type { LaravelPaginated } from "@/lib/types-api";
import { BarChart3 } from "lucide-react";
import { useTranslations } from "next-intl";

const PER_PAGE = 20;

export default function AdminContainerReportPage() {
  const authHydrated = useAuthPersistHydrated();
  const t = useTranslations("AdminFsdReports");
  const tc = useTranslations("AdminCommon");
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [meta, setMeta] = useState<LaravelPaginated<Record<string, unknown>> | null>(null);
  const [vendors, setVendors] = useState<{ id: number; label: string }[]>([]);
  const [page, setPage] = useState(1);
  const [ownershipFilter, setOwnershipFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [vendorFilter, setVendorFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  const filterParams = {
    ownership: ownershipFilter === "all" ? undefined : ownershipFilter,
    status: statusFilter === "all" ? undefined : statusFilter,
    vendor_id: vendorFilter === "all" ? undefined : vendorFilter,
  };

  const load = useCallback(async () => {
    if (!authHydrated) return;
    setLoading(true);
    try {
      const res = await fetchAdminContainerReport({ page, perPage: PER_PAGE, ...filterParams });
      setRows((res as LaravelPaginated<Record<string, unknown>>).data ?? []);
      setMeta(res as LaravelPaginated<Record<string, unknown>>);
    } catch { setRows([]); setMeta(null); }
    finally { setLoading(false); }
  }, [authHydrated, page, ownershipFilter, statusFilter, vendorFilter]);

  useEffect(() => { setPage(1); }, [ownershipFilter, statusFilter, vendorFilter]);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    if (!authHydrated) return;
    void fetchAdminVendors({ perPage: 500 }).then((res) => setVendors(((res as LaravelPaginated<Record<string, unknown>>).data ?? []).map((r) => ({ id: Number(r.id), label: String(r.name ?? r.code) }))));
  }, [authHydrated]);

  return (
    <div className={ADMIN_LIST_PAGE_CLASS}>
      <AdminPageHeader icon={BarChart3} title={t("container.title")} description={t("container.subtitle")} actions={
        <AdminReportExportButtons buildUrl={adminContainerReportExportUrl} params={filterParams} />
      } />
      <Card><CardHeader><CardTitle>{t("reportData")}</CardTitle></CardHeader><CardContent className="space-y-4">
        <div className="flex flex-wrap gap-3">
          <Select value={ownershipFilter} onValueChange={(v) => v && setOwnershipFilter(v)}>
            <SelectTrigger className="h-9 w-40"><SelectValue placeholder="Ownership">{ownershipFilter === "all" ? t("allOwnership") : ownershipFilter}</SelectValue></SelectTrigger>
            <SelectContent><SelectItem value="all">{t("allOwnership")}</SelectItem><SelectItem value="company">company</SelectItem><SelectItem value="vendor">vendor</SelectItem></SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(v) => v && setStatusFilter(v)}>
            <SelectTrigger className="h-9 w-40"><SelectValue placeholder={tc("table.status")}>{statusFilter === "all" ? tc("filters.allStatus") : statusFilter}</SelectValue></SelectTrigger>
            <SelectContent><SelectItem value="all">{tc("filters.allStatus")}</SelectItem><SelectItem value="available">available</SelectItem><SelectItem value="in_transit">in_transit</SelectItem><SelectItem value="maintenance">maintenance</SelectItem></SelectContent>
          </Select>
          <Select value={vendorFilter} onValueChange={(v) => v && setVendorFilter(v)}>
            <SelectTrigger className="h-9 w-48"><SelectValue placeholder="Vendor">{vendorFilter === "all" ? t("allVendor") : vendors.find((v) => String(v.id) === vendorFilter)?.label ?? "—"}</SelectValue></SelectTrigger>
            <SelectContent><SelectItem value="all">{t("allVendor")}</SelectItem>{vendors.map((v) => <SelectItem key={v.id} value={String(v.id)}>{v.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        {loading ? <p className="text-sm text-muted-foreground">{tc("actions.loading")}</p> : (
          <>
            <Table>
              <TableHeader><TableRow>
                <TableHead className="w-14">{tc("table.no")}</TableHead>
                <TableHead>{t("container.columns.containerNo")}</TableHead>
                <TableHead>{t("container.columns.type")}</TableHead>
                <TableHead>{t("container.columns.ownership")}</TableHead>
                <TableHead>{t("container.columns.yard")}</TableHead>
                <TableHead>{tc("table.status")}</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {rows.map((r, i) => (
                  <TableRow key={String(r.id ?? i)}>
                    <TableCell className="tabular-nums text-muted-foreground">{rowNumber(meta?.current_page ?? page, PER_PAGE, i)}</TableCell>
                    <TableCell className="font-mono text-xs">{String(r.container_number ?? "—")}</TableCell>
                    <TableCell>{String(r.container_type ?? "—")}</TableCell>
                    <TableCell>{String(r.ownership ?? "—")}</TableCell>
                    <TableCell>{String(r.current_yard ?? "—")}</TableCell>
                    <TableCell><Badge variant="outline">{String(r.status ?? "—")}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
              {rows.length === 0 ? <TableCaption className="text-xs">{tc("table.empty")}</TableCaption> : null}
            </Table>
            {meta ? <PaginationBar currentPage={meta.current_page} lastPage={meta.last_page} total={meta.total} from={meta.from} to={meta.to} onPageChange={setPage} /> : null}
          </>
        )}
      </CardContent></Card>
    </div>
  );
}
