"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PaginationBar } from "@/components/data-table/pagination-bar";
import { TableToolbar } from "@/components/data-table/table-toolbar";
import { invoiceStatusBadgeClass } from "@/lib/invoice-status";
import { useAuthStore } from "@/lib/store";
import { useAuthPersistHydrated } from "@/hooks/use-auth-hydrated";
import { useInvoiceStatusLabel } from "@/hooks/use-admin-status-labels";
import { useTranslations } from "next-intl";
import { Eye, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InvoiceCreateDialog } from "@/components/dashboard/admin/invoice-create-dialog";
import { InvoiceGenerateDialog } from "@/components/dashboard/admin/invoices/invoice-generate-dialog";
import { InvoiceStatsCards } from "@/components/dashboard/admin/invoices/invoice-stats-cards";
import {
  fetchAdminInvoiceStats,
  fetchAdminInvoices,
} from "@/lib/admin-api";
import type { LaravelPaginated } from "@/lib/types-api";
import { ApiError } from "@/lib/api-client";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useRouter } from "@/i18n/routing";
import { useSearchParams } from "next/navigation";
import {
  AdminListFilters,
  dateParamFromFilter,
  masterSelectOptions,
  paramFromFilter,
} from "@/components/data-table/admin-list-filters";
import { useAdminListMasters } from "@/hooks/use-admin-list-masters";

const PER_PAGE = 10;

const actionsHeadClass =
  "w-12 max-md:sticky max-md:right-0 max-md:z-20 max-md:border-l max-md:border-border max-md:bg-card max-md:shadow-[-8px_0_12px_-8px_rgba(0,0,0,0.08)] md:static md:z-auto md:border-l-0 md:bg-transparent md:shadow-none text-right";

const actionsCellClass =
  "max-md:sticky max-md:right-0 max-md:z-10 max-md:border-l max-md:border-border max-md:bg-card max-md:shadow-[-8px_0_12px_-8px_rgba(0,0,0,0.08)] max-md:group-hover:bg-muted/50 md:static md:z-auto md:border-l-0 md:shadow-none md:group-hover:bg-transparent";

type InvRow = Record<string, unknown>;

export default function AdminInvoicesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("AdminInvoices");
  const tc = useTranslations("AdminCommon");
  const invoiceStatusLabel = useInvoiceStatusLabel();
  const authHydrated = useAuthPersistHydrated();
  const masters = useAdminListMasters({ includeServiceTypes: false });
  const { user } = useAuthStore();
  const roles = user?.roles ?? [];
  const canManageInvoices = authHydrated && (roles.includes("super_admin") || roles.includes("finance"));

  const [rows, setRows] = useState<InvRow[]>([]);
  const [invoiceStats, setInvoiceStats] = useState<Record<string, number> | null>(null);
  const [meta, setMeta] = useState<LaravelPaginated<InvRow> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 400);
  const [statusFilter, setStatusFilter] = useState("all");
  const [companyFilter, setCompanyFilter] = useState("all");
  const [invoiceDateFrom, setInvoiceDateFrom] = useState("");
  const [invoiceDateTo, setInvoiceDateTo] = useState("");
  const [dueDateFrom, setDueDateFrom] = useState("");
  const [dueDateTo, setDueDateTo] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [generateOpen, setGenerateOpen] = useState(false);

  useEffect(() => {
    const status = searchParams.get("status");
    const issuedFrom = searchParams.get("issued_from");
    const issuedTo = searchParams.get("issued_to");
    const dueFrom = searchParams.get("due_from");
    const dueTo = searchParams.get("due_to");
    if (status) setStatusFilter(status);
    if (issuedFrom) setInvoiceDateFrom(issuedFrom);
    if (issuedTo) setInvoiceDateTo(issuedTo);
    if (dueFrom) setDueDateFrom(dueFrom);
    if (dueTo) setDueDateTo(dueTo);
  }, [searchParams]);

  const invoiceStatusFilters = useMemo(
    () => [
      { value: "all", label: tc("filters.allStatus") },
      { value: "draft", label: t("stats.draft") },
      { value: "issued", label: t("stats.issued") },
      { value: "partially_paid", label: t("stats.partiallyPaid") },
      { value: "paid", label: t("stats.paid") },
      { value: "cancelled", label: t("stats.cancelled") },
    ],
    [t, tc]
  );

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, companyFilter, invoiceDateFrom, invoiceDateTo, dueDateFrom, dueDateTo]);

  const statusParam = statusFilter === "all" ? undefined : statusFilter;

  const loadStats = useCallback(async () => {
    if (!authHydrated) return;
    try {
      const res = await fetchAdminInvoiceStats();
      setInvoiceStats((res as { data: Record<string, number> }).data);
    } catch {
      setInvoiceStats(null);
    }
  }, [authHydrated]);

  const load = useCallback(async () => {
    if (!authHydrated) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetchAdminInvoices({
        page,
        perPage: PER_PAGE,
        search: debouncedSearch.trim() || undefined,
        status: statusParam,
        companyId: paramFromFilter(companyFilter),
        invoiceDateFrom: dateParamFromFilter(invoiceDateFrom),
        invoiceDateTo: dateParamFromFilter(invoiceDateTo),
        dueDateFrom: dateParamFromFilter(dueDateFrom),
        dueDateTo: dateParamFromFilter(dueDateTo),
      });
      const paginated = res as LaravelPaginated<InvRow>;
      setRows(paginated.data ?? []);
      setMeta(paginated);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t("toasts.loadFailed"));
      setRows([]);
      setMeta(null);
    } finally {
      setLoading(false);
    }
  }, [authHydrated, page, debouncedSearch, statusParam, companyFilter, invoiceDateFrom, invoiceDateTo, dueDateFrom, dueDateTo, t]);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  useEffect(() => {
    void load();
  }, [load]);

  const countDraft = invoiceStats?.draft ?? 0;
  const countIssued = invoiceStats?.issued ?? 0;
  const countPartial = invoiceStats?.partially_paid ?? 0;
  const countPaid = invoiceStats?.paid ?? 0;
  const countCancelled = invoiceStats?.cancelled ?? 0;

  const openInvoiceDetail = (id: number) => {
    router.push(`/dashboard/admin/customer/invoices/${id}`);
  };

  return (
    <div className="flex min-w-0 w-full flex-1 flex-col gap-6 md:px-2">
      <InvoiceCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={() => {
          void loadStats();
          void load();
        }}
      />
      <InvoiceGenerateDialog
        open={generateOpen}
        onOpenChange={setGenerateOpen}
        onCreated={() => {
          void loadStats();
          void load();
        }}
      />
      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-900/5 text-zinc-900">
            <FileText className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-semibold tracking-tight text-zinc-900 sm:text-2xl">{t("pageTitle")}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{t("pageSubtitle")}</p>
          </div>
        </div>
        {canManageInvoices ? (
          <div className="flex gap-2">
            <Button type="button" size="sm" variant="outline" onClick={() => setGenerateOpen(true)}>
              {t("generateInvoice")}
            </Button>
            <Button type="button" size="sm" onClick={() => setCreateOpen(true)}>
              {t("createManual")}
            </Button>
          </div>
        ) : null}
      </div>

      {error ? (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
      ) : null}

      <InvoiceStatsCards
        draft={countDraft}
        issued={countIssued}
        partiallyPaid={countPartial}
        paid={countPaid}
        cancelled={countCancelled}
      />

      <Card className="min-w-0 overflow-hidden">
        <CardHeader className="space-y-1 pb-3">
          <CardTitle className="text-base">{t("filterTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <TableToolbar
            searchPlaceholder={t("searchPlaceholder")}
            searchValue={searchInput}
            onSearchChange={setSearchInput}
            filterLabel={tc("filters.status")}
            filterValue={statusFilter}
            onFilterChange={setStatusFilter}
            filterOptions={invoiceStatusFilters}
          />
          <AdminListFilters
            defaultSearchPlaceholder={t("searchPlaceholder")}
            selects={[
              {
                id: "invoice-company",
                label: tc("table.customer"),
                value: companyFilter,
                onChange: setCompanyFilter,
                options: masterSelectOptions(masters.companies, tc("filters.all")),
                searchable: true,
              },
            ]}
            dates={[
              {
                id: "invoice-date-from",
                label: `${t("columns.issuedDate")} (${tc("filters.from")})`,
                value: invoiceDateFrom,
                onChange: setInvoiceDateFrom,
              },
              {
                id: "invoice-date-to",
                label: `${t("columns.issuedDate")} (${tc("filters.to")})`,
                value: invoiceDateTo,
                onChange: setInvoiceDateTo,
              },
              {
                id: "invoice-due-from",
                label: `${t("columns.dueDate")} (${tc("filters.from")})`,
                value: dueDateFrom,
                onChange: setDueDateFrom,
              },
              {
                id: "invoice-due-to",
                label: `${t("columns.dueDate")} (${tc("filters.to")})`,
                value: dueDateTo,
                onChange: setDueDateTo,
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
                    <TableHead className="w-[130px]">{t("columns.invoiceNo")}</TableHead>
                    <TableHead>{tc("table.customer")}</TableHead>
                    <TableHead className="min-w-[100px]">{t("columns.shipment")}</TableHead>
                    <TableHead>{t("columns.issuedDate")}</TableHead>
                    <TableHead>{t("columns.dueDate")}</TableHead>
                    <TableHead className="text-right">{t("columns.amount")}</TableHead>
                    <TableHead>{tc("table.status")}</TableHead>
                    <TableHead className={actionsHeadClass}>
                      {tc("actions.actions")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((invoice) => {
                    const id = Number(invoice.id);
                    const num = String(invoice.invoice_number ?? "");
                    const company = (invoice.company ?? invoice.Company) as { name?: string } | undefined;
                    const ship = invoice.shipment as { shipment_number?: string } | undefined;
                    const shipmentNumber = ship?.shipment_number ?? "—";
                    const amt = Number(invoice.total_amount ?? 0);
                    const due = String(invoice.due_date ?? "").slice(0, 10);
                    const issued = String(invoice.issued_date ?? "").slice(0, 10);
                    const st = String(invoice.status ?? "");
                    return (
                      <TableRow key={id} className="group">
                        <TableCell className="font-mono text-xs">{num}</TableCell>
                        <TableCell className="font-medium">{company?.name ?? "—"}</TableCell>
                        <TableCell className="font-mono text-xs">{shipmentNumber}</TableCell>
                        <TableCell>{issued || "—"}</TableCell>
                        <TableCell>{due || "—"}</TableCell>
                        <TableCell className="text-right font-medium tabular-nums">
                          Rp {amt.toLocaleString("id-ID")}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={invoiceStatusBadgeClass(st)}>
                            {invoiceStatusLabel(st)}
                          </Badge>
                        </TableCell>
                        <TableCell className={actionsCellClass}>
                          <Button variant="ghost" size="sm" onClick={() => openInvoiceDetail(id)}>
                            <Eye className="h-4 w-4" />
                            {t("actions.detail")}
                          </Button>
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
                <PaginationBar
                  currentPage={meta.current_page}
                  lastPage={meta.last_page}
                  total={meta.total}
                  from={meta.from}
                  to={meta.to}
                  onPageChange={setPage}
                />
              ) : null}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
