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
import { useVendorInvoiceStatusLabel } from "@/hooks/use-admin-status-labels";
import { AdminReportExportButtons } from "@/components/dashboard/admin/shared/admin-report-export-buttons";
import {
  ADMIN_REPORT_PER_PAGE,
  adminVendorInvoiceReportExportUrl,
  fetchAdminVendorInvoiceReport,
  fetchAdminVendors,
} from "@/lib/admin-api";
import { rowNumber } from "@/lib/list-query";
import type { LaravelPaginated } from "@/lib/types-api";
import { formatIdr } from "@/lib/vendor-fsd-options";
import { BarChart3 } from "lucide-react";
import { useTranslations } from "next-intl";

const PER_PAGE = ADMIN_REPORT_PER_PAGE;
const STATUS = ["received", "under_verification", "ready_for_payment", "paid", "rejected"] as const;

export default function AdminVendorInvoiceReportPage() {
  const authHydrated = useAuthPersistHydrated();
  const t = useTranslations("AdminFsdReports");
  const tc = useTranslations("AdminCommon");
  const vendorInvoiceStatusLabel = useVendorInvoiceStatusLabel();

  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [meta, setMeta] = useState<LaravelPaginated<Record<string, unknown>> | null>(null);
  const [vendors, setVendors] = useState<{ id: number; label: string }[]>([]);
  const [page, setPage] = useState(1);
  const [vendorFilter, setVendorFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setPage(1);
  }, [vendorFilter, statusFilter, dateFrom, dateTo]);

  const filterParams = {
    vendor_id: vendorFilter === "all" ? undefined : vendorFilter,
    status: statusFilter === "all" ? undefined : statusFilter,
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
  };

  const load = useCallback(async () => {
    if (!authHydrated) return;
    setLoading(true);
    try {
      const res = await fetchAdminVendorInvoiceReport({ page, perPage: PER_PAGE, ...filterParams });
      setRows((res as LaravelPaginated<Record<string, unknown>>).data ?? []);
      setMeta(res as LaravelPaginated<Record<string, unknown>>);
    } catch {
      setRows([]);
      setMeta(null);
    } finally {
      setLoading(false);
    }
  }, [authHydrated, page, vendorFilter, statusFilter, dateFrom, dateTo]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    if (!authHydrated) return;
    void fetchAdminVendors({ perPage: 500 }).then((res) => {
      setVendors(((res as LaravelPaginated<Record<string, unknown>>).data ?? []).map((v) => ({
        id: Number(v.id),
        label: String(v.name ?? v.code),
      })));
    });
  }, [authHydrated]);

  return (
    <div className={ADMIN_LIST_PAGE_CLASS}>
      <AdminPageHeader
        icon={BarChart3}
        title="Vendor Invoice Report"
        description="Laporan invoice vendor dengan filter dan export."
        actions={<AdminReportExportButtons buildUrl={adminVendorInvoiceReportExportUrl} params={filterParams} />}
      />

      <Card className="min-w-0 overflow-hidden">
        <CardHeader><CardTitle>Report Data</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <div className="w-48 space-y-1">
              <Label className="text-xs text-muted-foreground">Vendor</Label>
              <Select value={vendorFilter} onValueChange={(v) => v && setVendorFilter(v)}>
                <SelectTrigger className="h-9 w-full">
                  <SelectValue placeholder={t("allVendor")}>
                    {vendorFilter === "all" ? t("allVendor") : vendors.find((v) => String(v.id) === vendorFilter)?.label ?? "—"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("allVendor")}</SelectItem>
                  {vendors.map((v) => <SelectItem key={v.id} value={String(v.id)}>{v.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="w-48 space-y-1">
              <Label className="text-xs text-muted-foreground">{tc("table.status")}</Label>
              <Select value={statusFilter} onValueChange={(v) => v && setStatusFilter(v)}>
                <SelectTrigger className="h-9 w-full">
                  <SelectValue placeholder={tc("filters.allStatus")}>
                    {statusFilter === "all" ? tc("filters.allStatus") : vendorInvoiceStatusLabel(statusFilter)}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{tc("filters.allStatus")}</SelectItem>
                  {STATUS.map((s) => <SelectItem key={s} value={s}>{vendorInvoiceStatusLabel(s)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-wrap items-end gap-2">
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
                    <TableHead>Vendor</TableHead>
                    <TableHead>Vendor Invoice No</TableHead>
                    <TableHead>Job Order</TableHead>
                    <TableHead>Invoice Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r, i) => (
                    <TableRow key={String(r.id)}>
                      <TableCell className="tabular-nums text-muted-foreground">{rowNumber(meta?.current_page ?? page, PER_PAGE, i)}</TableCell>
                      <TableCell className="font-medium">{String(r.vendor ?? "—")}</TableCell>
                      <TableCell className="font-mono text-xs">{String(r.vendor_invoice_no ?? "—")}</TableCell>
                      <TableCell className="text-sm">{String(r.job_orders ?? "—")}</TableCell>
                      <TableCell>{String(r.invoice_date ?? "—")}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatIdr(r.amount as string)}</TableCell>
                      <TableCell><Badge variant="outline">{vendorInvoiceStatusLabel(String(r.status))}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                {rows.length === 0 ? (
                  <TableCaption className="text-xs">Tidak ada data.</TableCaption>
                ) : null}
              </Table>
              {meta ? (
                <PaginationBar currentPage={meta.current_page} lastPage={meta.last_page} total={meta.total} from={meta.from} to={meta.to} onPageChange={setPage} />
              ) : null}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
