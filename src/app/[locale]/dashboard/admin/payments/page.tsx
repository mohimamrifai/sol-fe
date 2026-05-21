"use client";

import { useCallback, useEffect, useState } from "react";
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
import { paymentStatusBadgeClass, paymentStatusLabelFromApi } from "@/lib/payment-status";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/store";
import { useAuthPersistHydrated } from "@/lib/use-auth-hydrated";
import {
  CreditCard,
} from "lucide-react";
import {
  fetchAdminPayments,
} from "@/lib/admin-api";
import type { LaravelPaginated } from "@/lib/types-api";
import { ApiError } from "@/lib/api-client";
import { rowNumber } from "@/lib/list-query";
import { useDebouncedValue } from "@/lib/use-debounced-value";

import { PaymentStats } from "@/components/dashboard/admin/payments/payment-stats";
import { PaymentActionsMenu } from "@/components/dashboard/admin/payments/payment-actions-menu";
import type { PayRow } from "@/components/dashboard/admin/payments/types";

const PER_PAGE = 10;
const STATS_CAP = 1000;

const PAYMENT_STATUS_FILTERS = [
  { value: "all", label: "Semua status" },
  { value: "success", label: "Berhasil" },
  { value: "settlement", label: "Settlement" },
  { value: "pending", label: "Pending" },
  { value: "capture", label: "Capture" },
  { value: "authorize", label: "Authorize" },
  { value: "deny", label: "Deny" },
  { value: "cancel", label: "Cancel" },
  { value: "expire", label: "Expire" },
  { value: "failure", label: "Failure" },
  { value: "refund", label: "Refund" },
  { value: "partial_refund", label: "Refund sebagian" },
  { value: "chargeback", label: "Chargeback" },
];

const actionsHeadClass =
  "w-12 max-md:sticky max-md:right-0 max-md:z-20 max-md:border-l max-md:border-border max-md:bg-card max-md:shadow-[-8px_0_12px_-8px_rgba(0,0,0,0.08)] md:static md:z-auto md:border-l-0 md:bg-transparent md:shadow-none text-right";

const actionsCellClass =
  "max-md:sticky max-md:right-0 max-md:z-10 max-md:border-l max-md:border-border max-md:bg-card max-md:shadow-[-8px_0_12px_-8px_rgba(0,0,0,0.08)] max-md:group-hover:bg-muted/50 md:static md:z-auto md:border-l-0 md:shadow-none md:group-hover:bg-transparent";

export default function AdminPaymentsPage() {
  const authHydrated = useAuthPersistHydrated();
  const { user } = useAuthStore();
  const roles = user?.roles ?? [];
  const canManageAR = authHydrated && (roles.includes("super_admin") || roles.includes("finance"));

  const [rows, setRows] = useState<PayRow[]>([]);
  const [statsRows, setStatsRows] = useState<PayRow[]>([]);
  const [statsMeta, setStatsMeta] = useState<LaravelPaginated<PayRow> | null>(null);
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
      const res = await fetchAdminPayments({
        page: 1,
        perPage: STATS_CAP,
      });
      const paginated = res as LaravelPaginated<PayRow>;
      setStatsRows(paginated.data ?? []);
      setStatsMeta(paginated);
    } catch {
      setStatsRows([]);
      setStatsMeta(null);
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
      setError(e instanceof ApiError ? e.message : "Gagal memuat pembayaran.");
      setRows([]);
      setMeta(null);
    } finally {
      setLoading(false);
    }
  }, [authHydrated, page, debouncedSearch, statusParam]);

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

  const totalStats = statsMeta?.total ?? 0;

  return (
    <div className="flex min-w-0 w-full flex-1 flex-col gap-6 md:px-2">
      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-900/5 text-zinc-900">
            <CreditCard className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-semibold tracking-tight text-zinc-900 sm:text-2xl">Payment / AR Management</h1>
            <p className="mt-1 text-sm text-muted-foreground">Pembayaran, Midtrans, dan piutang semua customer.</p>
          </div>
        </div>
      </div>

      {error ? (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
      ) : null}

      <PaymentStats statsRows={statsRows} totalRecords={totalStats} />

      <Card className="min-w-0 overflow-hidden">
        <CardHeader className="space-y-1">
          <CardTitle>Daftar pembayaran</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <TableToolbar
            searchPlaceholder="Cari order Midtrans atau nomor invoice…"
            searchValue={searchInput}
            onSearchChange={setSearchInput}
            filterLabel="Status"
            filterValue={statusFilter}
            onFilterChange={setStatusFilter}
            filterOptions={PAYMENT_STATUS_FILTERS}
          />
          {loading ? (
            <p className="text-sm text-muted-foreground">Memuat…</p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-14">No</TableHead>
                    <TableHead className="w-[130px]">Ref payment</TableHead>
                    <TableHead className="w-[130px]">No. invoice</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Metode</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className={actionsHeadClass}>
                      <span className="max-md:sr-only">Aksi</span>
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
                            {paymentStatusLabelFromApi(st)}
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
                  <TableCaption className="text-xs">Belum ada pembayaran.</TableCaption>
                ) : (
                  <TableCaption className="text-xs">Baris pada halaman ini.</TableCaption>
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
