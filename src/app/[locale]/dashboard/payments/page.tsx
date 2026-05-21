"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  CreditCard,
  Eye,
  MoreHorizontal,
  Wallet,
} from "lucide-react";
import { fetchCustomerPayments, payInvoice } from "@/lib/customer-api";
import type { LaravelPaginated } from "@/lib/types-api";
import { ApiError } from "@/lib/api-client";
import { ensureMidtransSnapLoaded, openMidtransSnap } from "@/lib/midtrans-client";
import { rowNumber } from "@/lib/list-query";
import { useDebouncedValue } from "@/lib/use-debounced-value";

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

type PayRow = Record<string, unknown>;

function CustomerPaymentActionsMenu({
  payment,
  onUpdated,
}: {
  payment: PayRow;
  onUpdated: () => void;
}) {
  const [detailOpen, setDetailOpen] = useState(false);
  const st = String(payment.status ?? "").toLowerCase();
  const invoice = payment.invoice as { id?: number; invoice_number?: string } | undefined;
  const invoiceId = invoice?.id;
  const ref = String(payment.midtrans_order_id ?? payment.id ?? "");
  const canRetry = st === "pending" || st === "failure" || st === "deny" || st === "expire";

  const openSnap = async () => {
    if (!invoiceId) {
      toast.error("Invoice tidak ditemukan untuk pembayaran ini.");
      return;
    }
    try {
      await ensureMidtransSnapLoaded();
      const res = await payInvoice(invoiceId);
      const token = res.data?.token;
      if (!token) {
        toast.error("Token pembayaran tidak tersedia.");
        return;
      }
      openMidtransSnap(token, {
        onSuccess: () => void onUpdated(),
        onPending: () => void onUpdated(),
      });
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Gagal membuka pembayaran.");
    }
  };

  return (
    <>
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), "shrink-0")}
      >
        <MoreHorizontal className="h-4 w-4" />
        <span className="sr-only">Menu aksi</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-48">
        <DropdownMenuItem className="cursor-pointer" onClick={() => setDetailOpen(true)}>
          <Eye className="h-4 w-4" />
          Lihat detail
        </DropdownMenuItem>
        {canRetry && invoiceId ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer" onClick={() => void openSnap()}>
              <Wallet className="h-4 w-4" />
              Bayar / coba lagi
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
    <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Detail pembayaran {ref || "—"}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-3 gap-3 px-1 text-sm max-h-[65vh] overflow-y-auto">
          <div className="text-muted-foreground">ID Pembayaran (Lokal)</div>
          <div className="col-span-2 font-medium">{String(payment.id ?? "—")}</div>
          
          <div className="text-muted-foreground">Ref. Midtrans</div>
          <div className="col-span-2 font-medium">{String(payment.midtrans_order_id ?? "—")}</div>
          
          <div className="text-muted-foreground">Metode Pembayaran</div>
          <div className="col-span-2 font-medium capitalize">{String(payment.payment_type ?? "—").replace(/_/g, " ")}</div>
          
          <div className="text-muted-foreground">Nominal</div>
          <div className="col-span-2 font-medium tabular-nums text-emerald-600">Rp {Number(payment.amount ?? 0).toLocaleString("id-ID")}</div>
          
          <div className="text-muted-foreground">Tanggal Transaksi</div>
          <div className="col-span-2 font-medium">{String(payment.transaction_time ?? "—")}</div>
          
          <div className="text-muted-foreground">Tanggal Settlement</div>
          <div className="col-span-2 font-medium">{payment.settlement_time ? String(payment.settlement_time) : "—"}</div>
          
          <div className="text-muted-foreground">Status Pembayaran</div>
          <div className="col-span-2 font-medium capitalize">{String(payment.status ?? "—")}</div>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}

export default function CustomerPaymentsPage() {
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
    try {
      const res = await fetchCustomerPayments({
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
  }, []);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetchCustomerPayments({
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
  }, [page, debouncedSearch, statusParam]);

  const reloadAll = useCallback(async () => {
    await loadStats();
    await load();
  }, [loadStats, load]);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  useEffect(() => {
    void load();
  }, [load]);

  const countSuccess = statsRows.filter((p) => {
    const s = String(p.status).toLowerCase();
    return s === "success" || s === "settlement";
  }).length;
  const countPending = statsRows.filter((p) => {
    const s = String(p.status).toLowerCase();
    return s === "pending" || s === "capture" || s === "authorize";
  }).length;
  const countFailed = statsRows.filter((p) => {
    const s = String(p.status).toLowerCase();
    return s === "failure" || s === "deny" || s === "expire" || s === "cancel";
  }).length;
  const totalStats = statsMeta?.total ?? 0;

  return (
    <div className="flex min-w-0 w-full flex-1 flex-col gap-6 md:px-2">
      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-900/5 text-zinc-900">
            <CreditCard className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-semibold tracking-tight text-zinc-900 sm:text-2xl">Payments</h1>
            <p className="mt-1 text-sm text-muted-foreground">Riwayat pembayaran invoice perusahaan Anda.</p>
          </div>
        </div>
      </div>

      {error ? (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between gap-2">
              <CardDescription>Berhasil</CardDescription>
              <span className="rounded-md bg-emerald-100 p-1.5 text-emerald-700">
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
              </span>
            </div>
            <CardTitle className="flex flex-col gap-0.5 text-2xl font-semibold">
              <span>{countSuccess}</span>
              <span className="text-xs font-normal text-emerald-600">Sukses</span>
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between gap-2">
              <CardDescription>Menunggu</CardDescription>
              <span className="rounded-md bg-amber-100 p-1.5 text-amber-700">
                <Clock className="h-3.5 w-3.5" aria-hidden />
              </span>
            </div>
            <CardTitle className="flex flex-col gap-0.5 text-2xl font-semibold">
              <span>{countPending}</span>
              <span className="text-xs font-normal text-muted-foreground">Pending</span>
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between gap-2">
              <CardDescription>Gagal / expired</CardDescription>
              <span className="rounded-md bg-red-100 p-1.5 text-red-700">
                <AlertCircle className="h-3.5 w-3.5" aria-hidden />
              </span>
            </div>
            <CardTitle className="flex flex-col gap-0.5 text-2xl font-semibold">
              <span>{countFailed}</span>
              <span className="text-xs font-normal text-muted-foreground">Bermasalah</span>
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between gap-2">
              <CardDescription>Total transaksi</CardDescription>
              <span className="rounded-md bg-violet-100 p-1.5 text-violet-700">
                <CreditCard className="h-3.5 w-3.5" aria-hidden />
              </span>
            </div>
            <CardTitle className="flex flex-col gap-0.5 text-2xl font-semibold">
              <span>{totalStats}</span>
              <span className="text-xs font-normal text-muted-foreground">semua pembayaran</span>
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card className="min-w-0 overflow-hidden">
        <CardHeader className="space-y-1">
          <CardTitle>Riwayat pembayaran</CardTitle>
          <CardDescription>Transaksi Midtrans untuk invoice perusahaan Anda.</CardDescription>
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
                    <TableHead className="w-[130px]">Order / ref</TableHead>
                    <TableHead className="w-[130px]">No. invoice</TableHead>
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
                    const inv = payment.invoice as { invoice_number?: string } | undefined;
                    const invNo = inv?.invoice_number ?? "—";
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
                        <TableCell className="max-w-[200px] wrap-break-word">{method}</TableCell>
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
                            <CustomerPaymentActionsMenu payment={payment} onUpdated={() => void reloadAll()} />
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
