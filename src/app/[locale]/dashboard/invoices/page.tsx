"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
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
import { invoiceStatusBadgeClass, invoiceStatusLabelFromApi } from "@/lib/invoice-status";
import { cn } from "@/lib/utils";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  Eye,
  FileText,
  MoreHorizontal,
  Receipt,
} from "lucide-react";
import { InvoicePdfDownloadProgressDialog } from "@/components/invoice-pdf-download-progress-dialog";
import { fetchCustomerInvoices, downloadCustomerInvoicePdf, payInvoice } from "@/lib/customer-api";
import type { LaravelPaginated } from "@/lib/types-api";
import { ApiError } from "@/lib/api-client";
import { ensureMidtransSnapLoaded, openMidtransSnap } from "@/lib/midtrans-client";
import { rowNumber } from "@/lib/list-query";
import { useDebouncedValue } from "@/lib/use-debounced-value";

const PER_PAGE = 10;
const STATS_CAP = 1000;

const INVOICE_STATUS_FILTERS = [
  { value: "all", label: "Semua status" },
  { value: "unpaid", label: "Belum bayar" },
  { value: "paid", label: "Lunas" },
  { value: "overdue", label: "Jatuh tempo" },
  { value: "cancelled", label: "Dibatalkan" },
];

const actionsHeadClass =
  "w-12 max-md:sticky max-md:right-0 max-md:z-20 max-md:border-l max-md:border-border max-md:bg-card max-md:shadow-[-8px_0_12px_-8px_rgba(0,0,0,0.08)] md:static md:z-auto md:border-l-0 md:bg-transparent md:shadow-none text-right";

const actionsCellClass =
  "max-md:sticky max-md:right-0 max-md:z-10 max-md:border-l max-md:border-border max-md:bg-card max-md:shadow-[-8px_0_12px_-8px_rgba(0,0,0,0.08)] max-md:group-hover:bg-muted/50 md:static md:z-auto md:border-l-0 md:shadow-none md:group-hover:bg-transparent";

type InvRow = Record<string, unknown>;

function InvoiceActionsMenu({
  row,
  invoiceId,
  invoiceNumber,
  status,
  onPaid,
}: {
  row: InvRow;
  invoiceId: number;
  invoiceNumber: string;
  status: string;
  onPaid: () => void;
}) {
  const [detailOpen, setDetailOpen] = useState(false);
  const [pdfDialogOpen, setPdfDialogOpen] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [pdfProgress, setPdfProgress] = useState<number | null>(null);
  const st = status.toLowerCase();
  const canPay = st === "unpaid" || st === "overdue";

  const onPdf = async () => {
    setPdfDialogOpen(true);
    setPdfBusy(true);
    setPdfProgress(null);
    try {
      const blob = await downloadCustomerInvoicePdf(invoiceId, {
        onProgress: ({ loaded, total }) => {
          if (total != null && total > 0) {
            setPdfProgress(Math.min(100, Math.round((loaded / total) * 100)));
          } else {
            setPdfProgress(null);
          }
        },
      });
      setPdfProgress(100);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${invoiceNumber}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      await new Promise((r) => setTimeout(r, 150));
      toast.success("PDF invoice berhasil diunduh.");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Gagal mengunduh PDF.");
    } finally {
      setPdfBusy(false);
      setPdfDialogOpen(false);
      setPdfProgress(null);
    }
  };

  const onPay = async () => {
    try {
      await ensureMidtransSnapLoaded();
      const res = await payInvoice(invoiceId);
      const token = res.data?.token;
      if (!token) {
        toast.error("Token pembayaran tidak tersedia.");
        return;
      }
      openMidtransSnap(token, {
        onSuccess: () => {
          void onPaid();
        },
        onPending: () => void onPaid(),
      });
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Gagal membuka pembayaran.");
    }
  };

  return (
    <Fragment>
      <InvoicePdfDownloadProgressDialog
        open={pdfDialogOpen}
        onOpenChange={setPdfDialogOpen}
        blocking={pdfBusy}
        progress={pdfProgress}
        invoiceLabel={invoiceNumber || String(invoiceId)}
      />
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
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer" onClick={() => void onPdf()}>
          <Download className="h-4 w-4" />
          Unduh PDF
        </DropdownMenuItem>
        {canPay ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer" onClick={() => void onPay()}>
              <Receipt className="h-4 w-4" />
              Bayar (Midtrans)
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
    <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Detail invoice {invoiceNumber}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-3 gap-3 px-1 text-sm max-h-[65vh] overflow-y-auto">
          <div className="text-muted-foreground">No. Invoice</div>
          <div className="col-span-2 font-medium">{String(row.invoice_number ?? "—")}</div>
          
          <div className="text-muted-foreground">Total Tagihan</div>
          <div className="col-span-2 font-medium tabular-nums text-emerald-600">Rp {Number(row.total_amount ?? 0).toLocaleString("id-ID")}</div>
          
          <div className="text-muted-foreground">Jatuh Tempo</div>
          <div className="col-span-2 font-medium">{String(row.due_date ?? "—").slice(0, 10)}</div>
          
          <div className="text-muted-foreground">Status</div>
          <div className="col-span-2 font-medium capitalize">{status}</div>
          
          <div className="text-muted-foreground">Catatan / Deskripsi</div>
          <div className="col-span-2 whitespace-pre-wrap">{String(row.notes ?? "—")}</div>
        </div>
      </DialogContent>
    </Dialog>
    </Fragment>
  );
}

export default function CustomerInvoicesPage() {
  const [rows, setRows] = useState<InvRow[]>([]);
  const [statsRows, setStatsRows] = useState<InvRow[]>([]);
  const [statsMeta, setStatsMeta] = useState<LaravelPaginated<InvRow> | null>(null);
  const [meta, setMeta] = useState<LaravelPaginated<InvRow> | null>(null);
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
      const res = await fetchCustomerInvoices({
        page: 1,
        perPage: STATS_CAP,
      });
      const paginated = res as LaravelPaginated<InvRow>;
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
      const res = await fetchCustomerInvoices({
        page,
        perPage: PER_PAGE,
        search: debouncedSearch.trim() || undefined,
        status: statusParam,
      });
      const paginated = res as LaravelPaginated<InvRow>;
      setRows(paginated.data ?? []);
      setMeta(paginated);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Gagal memuat invoice.");
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

  const countUnpaid = statsRows.filter((i) => String(i.status).toLowerCase() === "unpaid").length;
  const countOverdue = statsRows.filter((i) => String(i.status).toLowerCase() === "overdue").length;
  const countPaid = statsRows.filter((i) => String(i.status).toLowerCase() === "paid").length;
  const totalStats = statsMeta?.total ?? 0;

  return (
    <div className="flex min-w-0 w-full flex-1 flex-col gap-6 md:px-2">
      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-900/5 text-zinc-900">
            <FileText className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-semibold tracking-tight text-zinc-900 sm:text-2xl">Invoices</h1>
            <p className="mt-1 text-sm text-muted-foreground">Invoice perusahaan Anda per shipment.</p>
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
              <CardDescription>Belum dibayar</CardDescription>
              <span className="rounded-md bg-sky-100 p-1.5 text-sky-700">
                <Receipt className="h-3.5 w-3.5" aria-hidden />
              </span>
            </div>
            <CardTitle className="flex flex-col gap-0.5 text-2xl font-semibold">
              <span>{countUnpaid}</span>
              <span className="text-xs font-normal text-muted-foreground">Unpaid</span>
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between gap-2">
              <CardDescription>Lewat jatuh tempo</CardDescription>
              <span className="rounded-md bg-red-100 p-1.5 text-red-700">
                <AlertCircle className="h-3.5 w-3.5" aria-hidden />
              </span>
            </div>
            <CardTitle className="flex flex-col gap-0.5 text-2xl font-semibold">
              <span>{countOverdue}</span>
              <span className="text-xs font-normal text-muted-foreground">Overdue</span>
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between gap-2">
              <CardDescription>Lunas</CardDescription>
              <span className="rounded-md bg-emerald-100 p-1.5 text-emerald-700">
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
              </span>
            </div>
            <CardTitle className="flex flex-col gap-0.5 text-2xl font-semibold">
              <span>{countPaid}</span>
              <span className="text-xs font-normal text-emerald-600">Paid</span>
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between gap-2">
              <CardDescription>Total invoice</CardDescription>
              <span className="rounded-md bg-violet-100 p-1.5 text-violet-700">
                <FileText className="h-3.5 w-3.5" aria-hidden />
              </span>
            </div>
            <CardTitle className="flex flex-col gap-0.5 text-2xl font-semibold">
              <span>{totalStats}</span>
              <span className="text-xs font-normal text-muted-foreground">semua invoice</span>
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card className="min-w-0 overflow-hidden">
        <CardHeader className="space-y-1">
          <CardTitle>Invoices perusahaan</CardTitle>
          <CardDescription>Satu invoice per shipment; unduh PDF atau bayar via Midtrans.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <TableToolbar
            searchPlaceholder="Cari nomor invoice atau waybill…"
            searchValue={searchInput}
            onSearchChange={setSearchInput}
            filterLabel="Status"
            filterValue={statusFilter}
            onFilterChange={setStatusFilter}
            filterOptions={INVOICE_STATUS_FILTERS}
          />
          {loading ? (
            <p className="text-sm text-muted-foreground">Memuat…</p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-14">No</TableHead>
                    <TableHead className="w-[130px]">No. Invoice</TableHead>
                    <TableHead className="min-w-[100px]">Shipment</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Due date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className={actionsHeadClass}>
                      <span className="max-md:sr-only">Aksi</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((invoice, index) => {
                    const num = String(invoice.invoice_number ?? "");
                    const id = Number(invoice.id);
                    const ship = invoice.shipment as { waybill_number?: string; shipment_number?: string } | undefined;
                    const wb = ship?.waybill_number ?? ship?.shipment_number ?? "—";
                    const amt = Number(invoice.total_amount ?? 0);
                    const due = String(invoice.due_date ?? "").slice(0, 10);
                    const st = String(invoice.status ?? "");
                    return (
                      <TableRow key={id} className="group">
                        <TableCell className="tabular-nums text-muted-foreground">
                          {rowNumber(meta?.current_page ?? page, PER_PAGE, index)}
                        </TableCell>
                        <TableCell className="font-mono text-xs">{num}</TableCell>
                        <TableCell className="font-mono text-xs">{wb}</TableCell>
                        <TableCell className="text-right font-medium tabular-nums">
                          Rp {amt.toLocaleString("id-ID")}
                        </TableCell>
                        <TableCell>{due}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={invoiceStatusBadgeClass(st)}>
                            {invoiceStatusLabelFromApi(st)}
                          </Badge>
                        </TableCell>
                        <TableCell className={cn(actionsCellClass, "p-2 text-right")}>
                          <div className="flex justify-end">
                            <InvoiceActionsMenu
                              row={invoice}
                              invoiceId={id}
                              invoiceNumber={num}
                              status={st}
                              onPaid={() => void reloadAll()}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
                {rows.length === 0 ? (
                  <TableCaption className="text-xs">Belum ada invoice.</TableCaption>
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
