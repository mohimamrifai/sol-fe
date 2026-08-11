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
import { paymentStatusBadgeClass } from "@/lib/payment-status";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/store";
import { useAuthPersistHydrated } from "@/hooks/use-auth-hydrated";
import { usePaymentStatusLabel } from "@/hooks/use-admin-status-labels";
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

import { PaymentStats } from "@/components/dashboard/admin/payments/payment-stats";
import { RecordPaymentDialog } from "@/components/dashboard/admin/payments/record-payment-dialog";
import { PaymentActionsMenu } from "@/components/dashboard/admin/payments/payment-actions-menu";
import type { PayRow } from "@/components/dashboard/admin/payments/types";

const PER_PAGE = 10;

const actionsHeadClass =
  "w-12 max-md:sticky max-md:right-0 max-md:z-20 max-md:border-l max-md:border-border max-md:bg-card max-md:shadow-[-8px_0_12px_-8px_rgba(0,0,0,0.08)] md:static md:z-auto md:border-l-0 md:bg-transparent md:shadow-none text-right";

const actionsCellClass =
  "max-md:sticky max-md:right-0 max-md:z-10 max-md:border-l max-md:border-border max-md:bg-card max-md:shadow-[-8px_0_12px_-8px_rgba(0,0,0,0.08)] max-md:group-hover:bg-muted/50 md:static md:z-auto md:border-l-0 md:shadow-none md:group-hover:bg-transparent";

export default function AdminPaymentsPage() {
  const t = useTranslations("AdminPayments");
  const tc = useTranslations("AdminCommon");
  const paymentStatusLabel = usePaymentStatusLabel();
  const authHydrated = useAuthPersistHydrated();
  const { user } = useAuthStore();
  const roles = user?.roles ?? [];
  const canManageAR = authHydrated && (roles.includes("super_admin") || roles.includes("finance"));

  const paymentStatusFilters = useMemo(
    () => [
      { value: "all", label: tc("filters.allStatus") },
      { value: "success", label: paymentStatusLabel("success") },
      { value: "settlement", label: t("filters.settlement") },
      { value: "pending", label: paymentStatusLabel("pending") },
      { value: "capture", label: t("filters.capture") },
      { value: "authorize", label: t("filters.authorize") },
      { value: "deny", label: t("filters.deny") },
      { value: "cancel", label: t("filters.cancel") },
      { value: "expire", label: t("filters.expire") },
      { value: "failure", label: t("filters.failure") },
      { value: "refund", label: t("filters.refund") },
      { value: "partial_refund", label: t("filters.partialRefund") },
      { value: "chargeback", label: t("filters.chargeback") },
    ],
    [t, tc, paymentStatusLabel]
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

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter]);

  const statusParam = statusFilter === "all" ? undefined : statusFilter;

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
        search: debouncedSearch.trim() || undefined,
        status: statusParam,
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
  }, [authHydrated, page, debouncedSearch, statusParam, t]);

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

  return (
    <div className="flex min-w-0 w-full flex-1 flex-col gap-6 md:px-2">
      <RecordPaymentDialog
        open={recordOpen}
        onOpenChange={setRecordOpen}
        onRecorded={() => {
          void loadStats();
          void load();
        }}
      />
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
          <Button size="sm" onClick={() => setRecordOpen(true)}>
            {t("recordPayment")}
          </Button>
        ) : null}
      </div>

      {error ? (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
      ) : null}

      <PaymentStats stats={paymentStats} />

      <Card className="min-w-0 overflow-hidden">
        <CardHeader className="space-y-1">
          <CardTitle>{t("listTitle")}</CardTitle>
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
          {loading ? (
            <p className="text-sm text-muted-foreground">{tc("actions.loading")}</p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-14">{tc("table.no")}</TableHead>
                    <TableHead className="w-[130px]">{t("columns.refPayment")}</TableHead>
                    <TableHead className="w-[130px]">{t("columns.invoiceNo")}</TableHead>
                    <TableHead>{tc("table.customer")}</TableHead>
                    <TableHead>{t("columns.method")}</TableHead>
                    <TableHead className="text-right">{t("columns.amount")}</TableHead>
                    <TableHead>{tc("table.status")}</TableHead>
                    <TableHead className={actionsHeadClass}>
                      <span className="max-md:sr-only">{tc("actions.actions")}</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((payment, index) => {
                    const inv = payment.invoice as
                      | { invoice_number?: string; company?: { name?: string } }
                      | undefined;
                    const invNo = inv?.invoice_number ?? "—";
                    const cust = inv?.company?.name ?? "—";
                    const amt = Number(payment.amount ?? 0);
                    const st = String(payment.status ?? "");
                    const method = String(payment.payment_type ?? "Midtrans");
                    const key = String(payment.midtrans_order_id ?? payment.id ?? "");
                    return (
                      <TableRow key={key} className="group">
                        <TableCell className="tabular-nums text-muted-foreground">
                          {rowNumber(meta?.current_page ?? page, PER_PAGE, index)}
                        </TableCell>
                        <TableCell className="font-mono text-xs">{key}</TableCell>
                        <TableCell className="font-mono text-xs">{invNo}</TableCell>
                        <TableCell className="font-medium">{cust}</TableCell>
                        <TableCell className="max-w-[180px] wrap-break-word">{method}</TableCell>
                        <TableCell className="text-right font-medium tabular-nums">
                          Rp {amt.toLocaleString("id-ID")}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={paymentStatusBadgeClass(st)}>
                            {paymentStatusLabel(st)}
                          </Badge>
                        </TableCell>
                        <TableCell className={cn(actionsCellClass, "p-2 text-right")}>
                          <div className="flex justify-end">
                            <PaymentActionsMenu
                              payment={payment}
                              paymentRef={key}
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
