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
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/store";
import { useAuthPersistHydrated } from "@/hooks/use-auth-hydrated";
import { useInvoiceStatusLabel } from "@/hooks/use-admin-status-labels";
import { useTranslations } from "next-intl";
import { CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  fetchAdminPaymentStats,
  fetchAdminPayments,
} from "@/lib/admin-api";
import type { LaravelPaginated } from "@/lib/types-api";
import { ApiError } from "@/lib/api-client";
import { rowNumber } from "@/lib/list-query";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import {
  AdminListFilters,
  dateParamFromFilter,
  masterSelectOptions,
  paramFromFilter,
  stringParamFromFilter,
} from "@/components/data-table/admin-list-filters";
import { PAYMENT_METHOD_OPTIONS, useAdminListMasters } from "@/hooks/use-admin-list-masters";

import { PaymentStats } from "@/components/dashboard/admin/payments/payment-stats";
import { RecordPaymentDialog } from "@/components/dashboard/admin/payments/record-payment-dialog";
import { GeneratePaymentLinkDialog } from "@/components/dashboard/admin/payments/generate-payment-link-dialog";
import { PaymentActionsMenu } from "@/components/dashboard/admin/payments/payment-actions-menu";
import type { PayRow } from "@/components/dashboard/admin/payments/types";

const PER_PAGE = 10;

const actionsHeadClass =
  "w-12 max-md:sticky max-md:right-0 max-md:z-20 max-md:border-l max-md:border-border max-md:bg-card max-md:shadow-[-8px_0_12px_-8px_rgba(0,0,0,0.08)] md:static md:z-auto md:border-l-0 md:bg-transparent md:shadow-none text-right";

const actionsCellClass =
  "max-md:sticky max-md:right-0 max-md:z-10 max-md:border-l max-md:border-border max-md:bg-card max-md:shadow-[-8px_0_12px_-8px_rgba(0,0,0,0.08)] max-md:group-hover:bg-muted/50 md:static md:z-auto md:border-l-0 md:shadow-none md:group-hover:bg-transparent";

function arStatusBadgeClass(status: string): string {
  switch (status) {
    case "paid":
      return "border-emerald-200 bg-emerald-50 text-emerald-800";
    case "partially_paid":
      return "border-amber-200 bg-amber-50 text-amber-800";
    case "overdue":
      return "border-red-200 bg-red-50 text-red-800";
    case "unpaid":
    default:
      return "border-zinc-200 bg-zinc-50 text-zinc-700";
  }
}

function formatMethod(method: string, t: ReturnType<typeof useTranslations<"AdminPayments">>): string {
  const map: Record<string, string> = {
    transfer: t("recordDialog.methodTransfer"),
    giro: t("recordDialog.methodGiro"),
    cash: t("recordDialog.methodCash"),
    virtual_account: t("recordDialog.methodVirtualAccount"),
    midtrans: t("recordDialog.methodMidtrans"),
  };
  return map[method] ?? method;
}

export default function AdminPaymentsPage() {
  const t = useTranslations("AdminPayments");
  const tc = useTranslations("AdminCommon");
  const invoiceStatusLabel = useInvoiceStatusLabel();
  const authHydrated = useAuthPersistHydrated();
  const masters = useAdminListMasters({ includeServiceTypes: false });
  const { user } = useAuthStore();
  const roles = user?.roles ?? [];
  const canManageAR = authHydrated && (roles.includes("super_admin") || roles.includes("finance"));

  const paymentStatusFilters = useMemo(
    () => [
      { value: "all", label: tc("filters.allStatus") },
      { value: "unpaid", label: t("stats.unpaid") },
      { value: "partially_paid", label: t("stats.partiallyPaid") },
      { value: "paid", label: t("stats.paid") },
      { value: "overdue", label: t("stats.overdue") },
    ],
    [t, tc]
  );

  const [rows, setRows] = useState<PayRow[]>([]);
  const [paymentStats, setPaymentStats] = useState<Record<string, number> | null>(null);
  const [meta, setMeta] = useState<LaravelPaginated<PayRow> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 400);
  const [statusFilter, setStatusFilter] = useState("all");
  const [companyFilter, setCompanyFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");
  const [paymentDateFrom, setPaymentDateFrom] = useState("");
  const [paymentDateTo, setPaymentDateTo] = useState("");

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, companyFilter, methodFilter, paymentDateFrom, paymentDateTo]);

  const invoiceStatusParam = statusFilter === "all" ? undefined : statusFilter;

  const loadStats = useCallback(async () => {
    if (!authHydrated) return;
    try {
      const res = await fetchAdminPaymentStats();
      setPaymentStats((res as { data: Record<string, number> }).data);
    } catch {
      setPaymentStats(null);
    }
  }, [authHydrated]);

  const load = useCallback(async () => {
    if (!authHydrated) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetchAdminPayments({
        page,
        perPage: PER_PAGE,
        view: "ar",
        search: debouncedSearch.trim() || undefined,
        invoiceStatus: invoiceStatusParam,
        companyId: paramFromFilter(companyFilter),
        paymentMethod: stringParamFromFilter(methodFilter),
        paymentDateFrom: dateParamFromFilter(paymentDateFrom),
        paymentDateTo: dateParamFromFilter(paymentDateTo),
      });
      const paginated = res as LaravelPaginated<PayRow>;
      setRows(paginated.data ?? []);
      setMeta(paginated);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t("toasts.loadFailed"));
      setRows([]);
      setMeta(null);
    } finally {
      setLoading(false);
    }
  }, [authHydrated, page, debouncedSearch, invoiceStatusParam, companyFilter, methodFilter, paymentDateFrom, paymentDateTo, t]);

  const refreshPayments = useCallback(() => {
    void load();
    void loadStats();
  }, [load, loadStats]);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  useEffect(() => {
    void load();
  }, [load]);

  const [recordOpen, setRecordOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);

  const arLabel = (status: string) => {
    if (status === "overdue") return t("stats.overdue");
    if (status === "unpaid") return t("stats.unpaid");
    return invoiceStatusLabel(status);
  };

  return (
    <div className="flex min-w-0 w-full flex-1 flex-col gap-6 md:px-2">
      <RecordPaymentDialog
        open={recordOpen}
        onOpenChange={setRecordOpen}
        onRecorded={refreshPayments}
      />
      <GeneratePaymentLinkDialog open={linkOpen} onOpenChange={setLinkOpen} />

      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-900/5 text-zinc-900">
            <CreditCard className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-semibold tracking-tight text-zinc-900 sm:text-2xl">{t("pageTitle")}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{t("pageSubtitle")}</p>
          </div>
        </div>
        {canManageAR ? (
          <div className="flex w-full shrink-0 flex-wrap gap-2 sm:w-auto sm:justify-end">
            <Button size="sm" variant="outline" onClick={() => setLinkOpen(true)}>
              {t("generatePaymentLink")}
            </Button>
            <Button size="sm" onClick={() => setRecordOpen(true)}>
              {t("recordPayment")}
            </Button>
          </div>
        ) : null}
      </div>

      {error ? (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
      ) : null}

      <PaymentStats stats={paymentStats} />

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
            filterOptions={paymentStatusFilters}
          />
          <AdminListFilters
            defaultSearchPlaceholder={t("searchPlaceholder")}
            selects={[
              {
                id: "payment-company",
                label: tc("table.customer"),
                value: companyFilter,
                onChange: setCompanyFilter,
                options: masterSelectOptions(masters.companies, tc("filters.all")),
                searchable: true,
              },
              {
                id: "payment-method",
                label: t("columns.method"),
                value: methodFilter,
                onChange: setMethodFilter,
                options: [
                  { value: "all", label: tc("filters.all") },
                  ...PAYMENT_METHOD_OPTIONS.filter((o) => o.value !== "all").map((o) => ({
                    value: o.value,
                    label: formatMethod(o.value, t),
                  })),
                ],
              },
            ]}
            dates={[
              {
                id: "payment-date-from",
                label: `${t("columns.paidAt")} (${tc("filters.from")})`,
                value: paymentDateFrom,
                onChange: setPaymentDateFrom,
              },
              {
                id: "payment-date-to",
                label: `${t("columns.paidAt")} (${tc("filters.to")})`,
                value: paymentDateTo,
                onChange: setPaymentDateTo,
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
                    <TableHead className="w-[130px]">{t("columns.paymentNo")}</TableHead>
                    <TableHead>{tc("table.customer")}</TableHead>
                    <TableHead className="w-[130px]">{t("columns.invoiceNo")}</TableHead>
                    <TableHead className="text-right">{t("columns.invoiceAmount")}</TableHead>
                    <TableHead className="text-right">{t("columns.paidAmount")}</TableHead>
                    <TableHead>{t("columns.method")}</TableHead>
                    <TableHead>{tc("table.status")}</TableHead>
                    <TableHead className={actionsHeadClass}>
                      <span className="max-md:sr-only">{tc("table.actions")}</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((payment, index) => {
                    const inv = payment.invoice as
                      | {
                          id?: number;
                          invoice_number?: string;
                          company?: { name?: string };
                          total_amount?: number;
                        }
                      | undefined;
                    const invNo = inv?.invoice_number ?? "—";
                    const cust = inv?.company?.name ?? "—";
                    const isArOnly = payment.is_ar_only === true;
                    const paidAmt = Number(
                      payment.invoice_paid_amount ?? payment.amount ?? 0
                    );
                    const invoiceAmt = Number(
                      payment.invoice_amount ?? inv?.total_amount ?? 0
                    );
                    const paymentNo = isArOnly
                      ? "—"
                      : String(payment.payment_number ?? payment.midtrans_order_id ?? payment.id ?? "—");
                    const method = isArOnly
                      ? "—"
                      : String(payment.method ?? payment.payment_type ?? "—");
                    const arStatus = String(payment.invoice_ar_status ?? "");
                    const key = `${String(payment.invoice_id ?? payment.id ?? paymentNo)}-${index}`;
                    return (
                      <TableRow key={key} className="group">
                        <TableCell className="tabular-nums text-muted-foreground">
                          {rowNumber(meta?.current_page ?? page, PER_PAGE, index)}
                        </TableCell>
                        <TableCell className="font-mono text-xs">{paymentNo}</TableCell>
                        <TableCell className="font-medium">{cust}</TableCell>
                        <TableCell className="font-mono text-xs">{invNo}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          Rp {invoiceAmt.toLocaleString("id-ID")}
                        </TableCell>
                        <TableCell className="text-right font-medium tabular-nums">
                          Rp {paidAmt.toLocaleString("id-ID")}
                        </TableCell>
                        <TableCell>{method === "—" ? method : formatMethod(method, t)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={arStatusBadgeClass(arStatus)}>
                            {arLabel(arStatus)}
                          </Badge>
                        </TableCell>
                        <TableCell className={cn(actionsCellClass, "p-2 text-right")}>
                          <div className="flex justify-end">
                            <PaymentActionsMenu
                              payment={payment}
                              paymentRef={paymentNo}
                              canManageAR={canManageAR}
                              onPaymentsChanged={refreshPayments}
                            />
                          </div>
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
