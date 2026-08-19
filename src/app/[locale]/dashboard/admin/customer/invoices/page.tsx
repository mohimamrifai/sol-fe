"use client";

import { toast } from "sonner";
import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
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
import { invoiceStatusBadgeClass } from "@/lib/invoice-status";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/store";
import { useAuthPersistHydrated } from "@/hooks/use-auth-hydrated";
import { useInvoiceStatusLabel } from "@/hooks/use-admin-status-labels";
import { useTranslations } from "next-intl";
import {
  CheckCircle2,
  Download,
  Eye,
  FileText,
  MoreHorizontal,
  Pencil,
  Trash2,
  Link as LinkIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { InvoicePdfDownloadProgressDialog } from "@/components/invoice-pdf-download-progress-dialog";
import { InvoiceCreateDialog } from "@/components/dashboard/admin/invoice-create-dialog";
import { InvoiceGenerateDialog } from "@/components/dashboard/admin/invoices/invoice-generate-dialog";
import { InvoiceStatsCards } from "@/components/dashboard/admin/invoices/invoice-stats-cards";
import { ConfirmDeleteDialog } from "@/components/dashboard/admin/confirm-delete-dialog";
import { InvoiceEditDialog } from "@/components/dashboard/admin/invoice-edit-dialog";
import {
  deleteAdminInvoice,
  downloadAdminInvoicePdf,
  fetchAdminInvoiceStats,
  fetchAdminInvoices,
  generateAdminMidtransLink,
  issueAdminInvoice,
} from "@/lib/admin-api";
import type { LaravelPaginated } from "@/lib/types-api";
import { ApiError } from "@/lib/api-client";
import { rowNumber } from "@/lib/list-query";
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

function AdminInvoiceActionsMenu({
  invoiceId,
  invoiceNumber,
  status,
  canManageInvoices,
  onViewDetail,
  onEdit,
  onDelete,
  onIssued,
}: {
  invoiceId: number;
  invoiceNumber: string;
  status: string;
  canManageInvoices: boolean;
  onViewDetail: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onIssued?: () => void;
}) {
  const t = useTranslations("AdminInvoices");
  const tc = useTranslations("AdminCommon");
  const [pdfDialogOpen, setPdfDialogOpen] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [pdfProgress, setPdfProgress] = useState<number | null>(null);
  const [linkLoading, setLinkLoading] = useState(false);

  const onGenerateLink = async () => {
    const toastId = toast.loading(t("toasts.linkCreating"));
    setLinkLoading(true);
    try {
      const res = await generateAdminMidtransLink(invoiceId);
      const url = res.data?.payment_url;
      if (url) {
        await navigator.clipboard.writeText(url);
        toast.success(t("toasts.linkCreated"), { id: toastId, duration: 4000 });
      } else {
        toast.success(res.message, { id: toastId });
      }
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : t("toasts.linkFailed"), { id: toastId });
    } finally {
      setLinkLoading(false);
    }
  };

  const onPdf = async () => {
    setPdfDialogOpen(true);
    setPdfBusy(true);
    setPdfProgress(null);
    try {
      const blob = await downloadAdminInvoicePdf(invoiceId, {
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
      toast.success(t("toasts.pdfDownloaded"));
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : t("toasts.pdfFailed"));
    } finally {
      setPdfBusy(false);
      setPdfDialogOpen(false);
      setPdfProgress(null);
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
        <span className="sr-only">{tc("actions.actionsMenu")}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-52">
        <DropdownMenuItem className="cursor-pointer" onClick={onViewDetail}>
          <Eye className="h-4 w-4" />
          {t("actions.viewDetail")}
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer" onClick={() => void onPdf()}>
          <Download className="h-4 w-4" />
          {t("actions.downloadPdf")}
        </DropdownMenuItem>
        {canManageInvoices ? (
          <>
            <DropdownMenuSeparator />
            {status === "draft" ? (
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={async () => {
                  try {
                    await issueAdminInvoice(invoiceId);
                    toast.success(t("toasts.issued"));
                    onIssued?.();
                  } catch (e) {
                    toast.error(e instanceof ApiError ? e.message : t("toasts.issueFailed"));
                  }
                }}
              >
                <CheckCircle2 className="h-4 w-4" />
                {t("actions.issue")}
              </DropdownMenuItem>
            ) : null}
            {(status === "unpaid" || status === "overdue" || status === "issued" || status === "partially_paid") && (
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => void onGenerateLink()}
                disabled={linkLoading}
              >
                <LinkIcon className="h-4 w-4" />
                {linkLoading ? t("actions.creatingLink") : t("actions.createMidtransLink")}
              </DropdownMenuItem>
            )}
            <DropdownMenuItem className="cursor-pointer" onClick={onEdit}>
              <Pencil className="h-4 w-4" />
              {t("actions.edit")}
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer text-destructive focus:text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="h-4 w-4" />
              {t("actions.delete")}
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
    </Fragment>
  );
}

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

  useEffect(() => {
    const status = searchParams.get("status");
    const issuedFrom = searchParams.get("issued_from");
    const issuedTo = searchParams.get("issued_to");
    if (status) setStatusFilter(status);
    if (issuedFrom) setInvoiceDateFrom(issuedFrom);
    if (issuedTo) setInvoiceDateTo(issuedTo);
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

  const [createOpen, setCreateOpen] = useState(false);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editRow, setEditRow] = useState<InvRow | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteRow, setDeleteRow] = useState<InvRow | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

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

  const handleDeleteInvoice = async () => {
    if (deleteRow?.id == null) return;
    setDeleteLoading(true);
    try {
      await deleteAdminInvoice(Number(deleteRow.id));
      toast.success(t("toasts.deleted"));
      setDeleteOpen(false);
      setDeleteRow(null);
      if (editOpen && editRow?.id === deleteRow.id) {
        setEditOpen(false);
        setEditRow(null);
      }
      void loadStats();
      void load();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : t("toasts.deleteFailed"));
    } finally {
      setDeleteLoading(false);
    }
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
      <InvoiceEditDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        invoice={editRow}
        onSaved={() => {
          void loadStats();
          void load();
        }}
      />

      <ConfirmDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={t("deleteDialog.title")}
        description={t("deleteDialog.description", {
          number: String(deleteRow?.invoice_number ?? ""),
        })}
        loading={deleteLoading}
        onConfirm={handleDeleteInvoice}
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
                    <TableHead className="w-14">{tc("table.no")}</TableHead>
                    <TableHead className="w-[130px]">{t("columns.invoiceNo")}</TableHead>
                    <TableHead>{tc("table.customer")}</TableHead>
                    <TableHead className="min-w-[100px]">{t("columns.shipment")}</TableHead>
                    <TableHead className="text-right">{t("columns.amount")}</TableHead>
                    <TableHead>{t("columns.issuedDate")}</TableHead>
                    <TableHead>{t("columns.dueDate")}</TableHead>
                    <TableHead>{tc("table.status")}</TableHead>
                    <TableHead className={actionsHeadClass}>
                      <span className="max-md:sr-only">{tc("actions.actions")}</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((invoice, index) => {
                    const id = Number(invoice.id);
                    const num = String(invoice.invoice_number ?? "");
                    const company = (invoice.company ?? invoice.Company) as { name?: string } | undefined;
                    const ship = invoice.shipment as { waybill_number?: string; shipment_number?: string } | undefined;
                    const wb = ship?.waybill_number ?? ship?.shipment_number ?? "—";
                    const amt = Number(invoice.total_amount ?? 0);
                    const due = String(invoice.due_date ?? "").slice(0, 10);
                    const issued = String(invoice.issued_date ?? "").slice(0, 10);
                    const st = String(invoice.status ?? "");
                    return (
                      <TableRow key={id} className="group">
                        <TableCell className="tabular-nums text-muted-foreground">
                          {rowNumber(meta?.current_page ?? page, PER_PAGE, index)}
                        </TableCell>
                        <TableCell className="font-mono text-xs">{num}</TableCell>
                        <TableCell className="font-medium">{company?.name ?? "—"}</TableCell>
                        <TableCell className="font-mono text-xs">{wb}</TableCell>
                        <TableCell className="text-right font-medium tabular-nums">
                          Rp {amt.toLocaleString("id-ID")}
                        </TableCell>
                        <TableCell>{issued || "—"}</TableCell>
                        <TableCell>{due || "—"}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={invoiceStatusBadgeClass(st)}>
                            {invoiceStatusLabel(st)}
                          </Badge>
                        </TableCell>
                        <TableCell className={cn(actionsCellClass, "p-2 text-right")}>
                          <div className="flex justify-end">
                            <AdminInvoiceActionsMenu
                              invoiceId={id}
                              invoiceNumber={num}
                              status={st}
                              canManageInvoices={canManageInvoices}
                              onViewDetail={() => void openInvoiceDetail(id)}
                              onEdit={() => {
                                setEditRow(invoice);
                                setEditOpen(true);
                              }}
                              onDelete={() => {
                                setDeleteRow(invoice);
                                setDeleteOpen(true);
                              }}
                              onIssued={() => {
                                void loadStats();
                                void load();
                              }}
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
