"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { PaginationBar } from "@/components/data-table/pagination-bar";
import { TableToolbar } from "@/components/data-table/table-toolbar";
import { AdminPageHeader } from "@/components/dashboard/admin/shared/admin-page-header";
import {
  actionsCellClass,
  actionsHeadClass,
  ADMIN_LIST_PAGE_CLASS,
} from "@/components/dashboard/admin/shared/admin-list-table-styles";
import { AdminStatsCards } from "@/components/dashboard/admin/shared/admin-stats-cards";
import { useAuthPersistHydrated } from "@/hooks/use-auth-hydrated";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useVendorInvoiceStatusLabel } from "@/hooks/use-admin-status-labels";
import { useAuthStore } from "@/lib/store";
import {
  fetchAdminVendorInvoiceEligibleJobOrders,
  fetchAdminVendorInvoices,
  fetchAdminVendorInvoiceStats,
  fetchAdminVendors,
  receiveAdminVendorInvoice,
} from "@/lib/admin-api";
import { ApiError } from "@/lib/api-client";
import { rowNumber } from "@/lib/list-query";
import type { LaravelPaginated } from "@/lib/types-api";
import { formatIdr } from "@/lib/vendor-fsd-options";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  ClipboardClock,
  Eye,
  FileText,
  MoreHorizontal,
  Plus,
  Receipt,
  Search,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

const PER_PAGE = 10;
const STATUS = ["received", "under_verification", "ready_for_payment", "paid", "rejected"] as const;

const STATUS_META: Record<(typeof STATUS)[number], { icon: typeof FileText; iconClassName: string }> = {
  received: { icon: FileText, iconClassName: "text-sky-700 bg-sky-100" },
  under_verification: { icon: Search, iconClassName: "text-amber-700 bg-amber-100" },
  ready_for_payment: { icon: ClipboardClock, iconClassName: "text-violet-700 bg-violet-100" },
  paid: { icon: CheckCircle2, iconClassName: "text-emerald-700 bg-emerald-100" },
  rejected: { icon: XCircle, iconClassName: "text-red-700 bg-red-100" },
};

export default function AdminVendorInvoicesPage() {
  const params = useParams();
  const router = useRouter();
  const locale = String(params?.locale ?? "id");
  const basePath = `/${locale}/dashboard/admin/vendor/invoices`;
  const authHydrated = useAuthPersistHydrated();
  const t = useTranslations("AdminVendorInvoices");
  const tc = useTranslations("AdminCommon");
  const vendorInvoiceStatusLabel = useVendorInvoiceStatusLabel();
  const searchParams = useSearchParams();
  const { user } = useAuthStore();
  const roles = user?.roles ?? [];
  const canManage = authHydrated && (roles.includes("super_admin") || roles.includes("finance"));

  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [meta, setMeta] = useState<LaravelPaginated<Record<string, unknown>> | null>(null);
  const [stats, setStats] = useState<Record<string, number> | null>(null);
  const [vendors, setVendors] = useState<{ id: number; label: string }[]>([]);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 400);
  const [vendorFilter, setVendorFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [invoiceDateFrom, setInvoiceDateFrom] = useState("");
  const [invoiceDateTo, setInvoiceDateTo] = useState("");
  const [receiveDateFrom, setReceiveDateFrom] = useState("");
  const [receiveDateTo, setReceiveDateTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeVendors, setActiveVendors] = useState<{ id: number; label: string }[]>([]);
  const [receiveOpen, setReceiveOpen] = useState(false);
  const [vendorId, setVendorId] = useState("");
  const [externalNo, setExternalNo] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("");
  const [invoiceAmount, setInvoiceAmount] = useState("");
  const [taxAmount, setTaxAmount] = useState("");
  const [remark, setRemark] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [eligible, setEligible] = useState<Record<string, unknown>[]>([]);
  const [selectedJo, setSelectedJo] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);

  const totalInvoice = useMemo(() => (Number(invoiceAmount) || 0) + (Number(taxAmount) || 0), [invoiceAmount, taxAmount]);
  const selectedJoTotal = useMemo(
    () => eligible.filter((j) => selectedJo.includes(Number(j.id))).reduce((s, j) => s + Number(j.amount ?? 0), 0),
    [eligible, selectedJo]
  );

  const receiveDateToday = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, vendorFilter, statusFilter, invoiceDateFrom, invoiceDateTo, receiveDateFrom, receiveDateTo]);

  const load = useCallback(async () => {
    if (!authHydrated) return;
    setLoading(true);
    try {
      const [listRes, statsRes] = await Promise.all([
        fetchAdminVendorInvoices({
          page,
          perPage: PER_PAGE,
          search: debouncedSearch || undefined,
          vendor_id: vendorFilter === "all" ? undefined : vendorFilter,
          status: statusFilter === "all" ? undefined : statusFilter,
          invoice_date_from: invoiceDateFrom || undefined,
          invoice_date_to: invoiceDateTo || undefined,
          receive_date_from: receiveDateFrom || undefined,
          receive_date_to: receiveDateTo || undefined,
        }),
        fetchAdminVendorInvoiceStats(),
      ]);
      setRows((listRes as LaravelPaginated<Record<string, unknown>>).data ?? []);
      setMeta(listRes as LaravelPaginated<Record<string, unknown>>);
      setStats((statsRes as { data: Record<string, number> }).data);
    } finally {
      setLoading(false);
    }
  }, [authHydrated, page, debouncedSearch, vendorFilter, statusFilter, invoiceDateFrom, invoiceDateTo, receiveDateFrom, receiveDateTo]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    const status = searchParams.get("status");
    if (status) setStatusFilter(status);
  }, [searchParams]);

  useEffect(() => {
    if (searchParams.get("receive") === "1") {
      setReceiveOpen(true);
      const url = new URL(window.location.href);
      url.searchParams.delete("receive");
      window.history.replaceState({}, "", url.toString());
    }
  }, [searchParams]);
  useEffect(() => {
    if (!authHydrated) return;
    void Promise.all([
      fetchAdminVendors({ perPage: 500 }),
      fetchAdminVendors({ perPage: 500, status: "active" }),
    ]).then(([allRes, activeRes]) => {
      setVendors(((allRes as LaravelPaginated<Record<string, unknown>>).data ?? []).map((v) => ({
        id: Number(v.id),
        label: String(v.name),
      })));
      setActiveVendors(((activeRes as LaravelPaginated<Record<string, unknown>>).data ?? []).map((v) => ({
        id: Number(v.id),
        label: String(v.name),
      })));
    });
  }, [authHydrated]);

  useEffect(() => {
    if (!vendorId) {
      setEligible([]);
      return;
    }
    void fetchAdminVendorInvoiceEligibleJobOrders(Number(vendorId)).then((res) =>
      setEligible((res as { data: Record<string, unknown>[] }).data ?? [])
    );
  }, [vendorId]);

  const submitReceive = async () => {
    if (!file || !vendorId || selectedJo.length === 0) return;
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("vendor_id", vendorId);
      fd.append("vendor_external_number", externalNo);
      fd.append("invoice_date", invoiceDate);
      fd.append("invoice_amount", invoiceAmount);
      if (taxAmount) fd.append("tax_amount", taxAmount);
      if (remark) fd.append("remark", remark);
      fd.append("invoice_file", file);
      selectedJo.forEach((id) => fd.append("job_order_ids[]", String(id)));
      await receiveAdminVendorInvoice(fd);
      toast.success("Invoice vendor diterima.");
      setReceiveOpen(false);
      void load();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Gagal menyimpan.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={ADMIN_LIST_PAGE_CLASS}>
      <AdminPageHeader
        icon={Receipt}
        title={t("pageTitle")}
        description={t("pageSubtitle")}
        actions={
          canManage ? (
            <Button className="h-9 w-full gap-1.5 px-4 sm:w-auto" type="button" onClick={() => setReceiveOpen(true)}>
              <Plus className="h-4 w-4 shrink-0" />
              {t("receiveInvoice")}
            </Button>
          ) : null
        }
      />

      <AdminStatsCards
        className="sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
        cards={STATUS.map((st) => {
          const meta = STATUS_META[st];
          return {
            key: st,
            label: t(`stats.${st}` as "stats.received"),
            value: stats?.[st] ?? 0,
            icon: meta.icon,
            iconClassName: meta.iconClassName,
          };
        })}
      />

      <Card className="min-w-0 overflow-hidden">
        <CardHeader className="space-y-1">
          <CardTitle>{t("listTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <TableToolbar searchPlaceholder={t("searchPlaceholder")} searchValue={search} onSearchChange={setSearch} />
          <div className="flex flex-wrap gap-3">
            <Select value={vendorFilter} onValueChange={(v) => v && setVendorFilter(v)}>
              <SelectTrigger className="h-9 w-48">
                <SelectValue placeholder="Vendor">
                  {vendorFilter === "all"
                    ? t("filters.allVendor")
                    : vendors.find((v) => String(v.id) === vendorFilter)?.label ?? "—"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("filters.allVendor")}</SelectItem>
                {vendors.map((v) => <SelectItem key={v.id} value={String(v.id)}>{v.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v) => v && setStatusFilter(v)}>
              <SelectTrigger className="h-9 w-48">
                <SelectValue placeholder="Status">
                  {statusFilter === "all" ? t("filters.allStatus") : vendorInvoiceStatusLabel(statusFilter)}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("filters.allStatus")}</SelectItem>
                {STATUS.map((s) => <SelectItem key={s} value={s}>{t(`stats.${s}` as "stats.received")}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="flex items-end gap-2">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Invoice Date From</Label>
                <Input className="h-9 w-36" type="date" value={invoiceDateFrom} onChange={(e) => setInvoiceDateFrom(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Invoice Date To</Label>
                <Input className="h-9 w-36" type="date" value={invoiceDateTo} onChange={(e) => setInvoiceDateTo(e.target.value)} />
              </div>
            </div>
            <div className="flex items-end gap-2">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Receive Date From</Label>
                <Input className="h-9 w-36" type="date" value={receiveDateFrom} onChange={(e) => setReceiveDateFrom(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Receive Date To</Label>
                <Input className="h-9 w-36" type="date" value={receiveDateTo} onChange={(e) => setReceiveDateTo(e.target.value)} />
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
                    <TableHead>{t("columns.invoiceNo")}</TableHead>
                    <TableHead>{t("columns.vendor")}</TableHead>
                    <TableHead>{t("columns.invoiceDate")}</TableHead>
                    <TableHead>{t("columns.receiveDate")}</TableHead>
                    <TableHead className="text-right">{t("columns.total")}</TableHead>
                    <TableHead>{t("columns.status")}</TableHead>
                    <TableHead className={actionsHeadClass}>
                      <span className="max-md:sr-only">{tc("table.actions")}</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r, i) => (
                    <TableRow key={String(r.id)} className="group">
                      <TableCell className="tabular-nums text-muted-foreground">{rowNumber(meta?.current_page ?? page, PER_PAGE, i)}</TableCell>
                      <TableCell className="font-mono text-xs">{String(r.vendor_invoice_no)}</TableCell>
                      <TableCell className="font-medium">{String(r.vendor)}</TableCell>
                      <TableCell>{String(r.invoice_date ?? "—")}</TableCell>
                      <TableCell>{String(r.receive_date ?? "—")}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatIdr(r.total_amount as string)}</TableCell>
                      <TableCell><Badge variant="outline">{vendorInvoiceStatusLabel(String(r.status))}</Badge></TableCell>
                      <TableCell className={cn(actionsCellClass, "p-2 text-right")}>
                        <div className="flex justify-end">
                          <DropdownMenu>
                            <DropdownMenuTrigger className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), "shrink-0")}>
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">{tc("actions.actionsMenu")}</span>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="min-w-44">
                              <DropdownMenuItem className="cursor-pointer" onClick={() => router.push(`${basePath}/${r.id}`)}>
                                <Eye className="h-4 w-4" /> {tc("actions.viewDetail")}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                {rows.length === 0 ? (
                  <TableCaption className="text-xs">{t("empty")}</TableCaption>
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

      <Dialog open={receiveOpen} onOpenChange={setReceiveOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader><DialogTitle>Receive Vendor Invoice</DialogTitle></DialogHeader>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="md:col-span-2">
              <Label>Vendor</Label>
              <Select value={vendorId} onValueChange={(v) => v && setVendorId(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih vendor">
                    {vendorId ? activeVendors.find((v) => String(v.id) === vendorId)?.label ?? "—" : null}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {activeVendors.map((v) => <SelectItem key={v.id} value={String(v.id)}>{v.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Vendor Invoice Number</Label><Input value={externalNo} onChange={(e) => setExternalNo(e.target.value)} /></div>
            <div><Label>Invoice Date</Label><Input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} /></div>
            <div><Label>Receive Date</Label><Input type="date" value={receiveDateToday} readOnly disabled /></div>
            <div><Label>Currency</Label><Input value="IDR" readOnly disabled /></div>
            <div><Label>Invoice Amount</Label><Input inputMode="decimal" value={invoiceAmount} onChange={(e) => setInvoiceAmount(e.target.value)} /></div>
            <div><Label>Tax Amount</Label><Input inputMode="decimal" value={taxAmount} onChange={(e) => setTaxAmount(e.target.value)} /></div>
            <div><Label>Total Invoice</Label><Input readOnly value={formatIdr(totalInvoice)} disabled /></div>
            <div className="md:col-span-2"><Label>Upload Invoice</Label><Input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setFile(e.target.files?.[0] ?? null)} /></div>
            <div className="md:col-span-2"><Label>Remark</Label><Textarea value={remark} onChange={(e) => setRemark(e.target.value)} rows={2} /></div>
          </div>
          <div className="space-y-2">
            <Label>Job Order Matching</Label>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead />
                  <TableHead>JO No</TableHead>
                  <TableHead>Shipment</TableHead>
                  <TableHead>Completion</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {eligible.map((j) => {
                  const id = Number(j.id);
                  return (
                    <TableRow key={id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedJo.includes(id)}
                          onCheckedChange={(c) => setSelectedJo((prev) => (c ? [...prev, id] : prev.filter((x) => x !== id)))}
                        />
                      </TableCell>
                      <TableCell>{String(j.job_order_number)}</TableCell>
                      <TableCell>{String(j.shipment_number)}</TableCell>
                      <TableCell>{String(j.completion_date ?? "—")}</TableCell>
                      <TableCell className="text-right">{formatIdr(j.amount as string)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            <p className="text-sm text-muted-foreground">
              Selected: {selectedJo.length} · JO Total: {formatIdr(selectedJoTotal)} · Difference: {formatIdr(totalInvoice - selectedJoTotal)}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReceiveOpen(false)}>Batal</Button>
            <Button disabled={saving || !file || selectedJo.length === 0} onClick={() => void submitReceive()}>
              {saving ? "Menyimpan…" : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
