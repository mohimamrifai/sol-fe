"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PaginationBar } from "@/components/data-table/pagination-bar";
import { AdminPageHeader } from "@/components/dashboard/admin/shared/admin-page-header";
import { ADMIN_LIST_PAGE_CLASS } from "@/components/dashboard/admin/shared/admin-list-table-styles";
import { useAuthPersistHydrated } from "@/hooks/use-auth-hydrated";
import { AdminReportExportButtons } from "@/components/dashboard/admin/shared/admin-report-export-buttons";
import { adminShipmentReportExportUrl, fetchAdminCompanies, fetchAdminShipmentReport, fetchAdminServiceTypes } from "@/lib/admin-api";
import { rowNumber } from "@/lib/list-query";
import type { LaravelPaginated } from "@/lib/types-api";
import { BarChart3 } from "lucide-react";
import { useTranslations } from "next-intl";

const PER_PAGE = 20;

export default function AdminShipmentReportPage() {
  const authHydrated = useAuthPersistHydrated();
  const t = useTranslations("AdminFsdReports");
  const tc = useTranslations("AdminCommon");
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [meta, setMeta] = useState<LaravelPaginated<Record<string, unknown>> | null>(null);
  const [companies, setCompanies] = useState<{ id: number; label: string }[]>([]);
  const [serviceTypes, setServiceTypes] = useState<{ id: number; label: string }[]>([]);
  const [page, setPage] = useState(1);
  const [companyFilter, setCompanyFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [serviceFilter, setServiceFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [loading, setLoading] = useState(true);

  const filterParams = {
    company_id: companyFilter === "all" ? undefined : companyFilter,
    status: statusFilter === "all" ? undefined : statusFilter,
    service_type_id: serviceFilter === "all" ? undefined : serviceFilter,
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
  };

  const load = useCallback(async () => {
    if (!authHydrated) return;
    setLoading(true);
    try {
      const res = await fetchAdminShipmentReport({ page, perPage: PER_PAGE, ...filterParams });
      setRows((res as LaravelPaginated<Record<string, unknown>>).data ?? []);
      setMeta(res as LaravelPaginated<Record<string, unknown>>);
    } catch { setRows([]); setMeta(null); }
    finally { setLoading(false); }
  }, [authHydrated, page, companyFilter, statusFilter, serviceFilter, dateFrom, dateTo]);

  useEffect(() => { setPage(1); }, [companyFilter, statusFilter, serviceFilter, dateFrom, dateTo]);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    if (!authHydrated) return;
    void Promise.all([fetchAdminCompanies({ perPage: 500 }), fetchAdminServiceTypes({ perPage: 100 })]).then(([cRes, sRes]) => {
      setCompanies(((cRes as LaravelPaginated<Record<string, unknown>>).data ?? []).map((r) => ({ id: Number(r.id), label: String(r.name ?? r.code) })));
      setServiceTypes(((sRes as LaravelPaginated<Record<string, unknown>>).data ?? []).map((r) => ({ id: Number(r.id), label: String(r.name ?? r.code) })));
    });
  }, [authHydrated]);

  return (
    <div className={ADMIN_LIST_PAGE_CLASS}>
      <AdminPageHeader icon={BarChart3} title={t("shipment.title")} description={t("shipment.subtitle")} actions={
        <AdminReportExportButtons buildUrl={adminShipmentReportExportUrl} params={filterParams} />
      } />
      <Card><CardHeader><CardTitle>{t("reportData")}</CardTitle></CardHeader><CardContent className="space-y-4">
        <div className="flex flex-wrap gap-3">
          <Select value={companyFilter} onValueChange={(v) => v && setCompanyFilter(v)}>
            <SelectTrigger className="h-9 w-48"><SelectValue placeholder={tc("table.customer")}>{companyFilter === "all" ? t("allCustomer") : companies.find((c) => String(c.id) === companyFilter)?.label ?? "—"}</SelectValue></SelectTrigger>
            <SelectContent><SelectItem value="all">{t("allCustomer")}</SelectItem>{companies.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.label}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={serviceFilter} onValueChange={(v) => v && setServiceFilter(v)}>
            <SelectTrigger className="h-9 w-44"><SelectValue placeholder="Service">{serviceFilter === "all" ? t("allService") : serviceTypes.find((s) => String(s.id) === serviceFilter)?.label ?? "—"}</SelectValue></SelectTrigger>
            <SelectContent><SelectItem value="all">{t("allService")}</SelectItem>{serviceTypes.map((s) => <SelectItem key={s.id} value={String(s.id)}>{s.label}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(v) => v && setStatusFilter(v)}>
            <SelectTrigger className="h-9 w-40"><SelectValue placeholder={tc("table.status")}>{statusFilter === "all" ? tc("filters.allStatus") : statusFilter}</SelectValue></SelectTrigger>
            <SelectContent><SelectItem value="all">{tc("filters.allStatus")}</SelectItem><SelectItem value="draft">draft</SelectItem><SelectItem value="in_transit">in_transit</SelectItem><SelectItem value="delivered">delivered</SelectItem></SelectContent>
          </Select>
          <div className="flex items-end gap-2">
            <div className="space-y-1"><Label className="text-xs text-muted-foreground">{tc("filters.from")}</Label><Input className="h-9 w-36" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} /></div>
            <div className="space-y-1"><Label className="text-xs text-muted-foreground">{tc("filters.to")}</Label><Input className="h-9 w-36" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} /></div>
          </div>
        </div>
        {loading ? <p className="text-sm text-muted-foreground">{tc("actions.loading")}</p> : (
          <>
            <Table>
              <TableHeader><TableRow>
                <TableHead className="w-14">{tc("table.no")}</TableHead>
                <TableHead>{t("shipment.columns.shipmentNo")}</TableHead>
                <TableHead>{tc("table.customer")}</TableHead>
                <TableHead>{t("shipment.columns.route")}</TableHead>
                <TableHead>{t("shipment.columns.service")}</TableHead>
                <TableHead>{tc("table.status")}</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {rows.map((r, i) => (
                  <TableRow key={String(r.id ?? i)}>
                    <TableCell className="tabular-nums text-muted-foreground">{rowNumber(meta?.current_page ?? page, PER_PAGE, i)}</TableCell>
                    <TableCell className="font-mono text-xs">{String(r.shipment_number ?? "—")}</TableCell>
                    <TableCell>{String(r.customer ?? "—")}</TableCell>
                    <TableCell>{String(r.route ?? "—")}</TableCell>
                    <TableCell>{String(r.service_type ?? "—")}</TableCell>
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
