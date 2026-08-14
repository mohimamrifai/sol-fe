"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
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
import { cn } from "@/lib/utils";
import { Building2, CheckCircle2, ClipboardClock, Eye, Loader2, MoreHorizontal, Pencil, Plus, Trash2, UserCheck, Users, XCircle } from "lucide-react";
import { customerStatusBadgeClass } from "@/lib/customer-status";
import { useAuthStore } from "@/lib/store";
import { useAuthPersistHydrated } from "@/hooks/use-auth-hydrated";
import { approveAdminCompany, deleteAdminCompany, fetchAdminCompanies, fetchAdminCompanyStats, rejectAdminCompany } from "@/lib/admin-api";
import { getAdminCustomerCapabilities } from "@/lib/admin-customer-capabilities";
import type { LaravelPaginated } from "@/lib/types-api";
import { ApiError } from "@/lib/api-client";
import { rowNumber } from "@/lib/list-query";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useTranslations } from "next-intl";
import { useCustomerStatusLabel } from "@/hooks/use-admin-status-labels";

import { ConfirmDeleteDialog } from "@/components/dashboard/admin/confirm-delete-dialog";
import { toast } from "sonner";

const PER_PAGE = 10;

const actionsHeadClass =
  "w-12 max-md:sticky max-md:right-0 max-md:z-20 max-md:border-l max-md:border-border max-md:bg-card max-md:shadow-[-8px_0_12px_-8px_rgba(0,0,0,0.08)] md:static md:z-auto md:border-l-0 md:bg-transparent md:shadow-none text-right";

const actionsCellClass =
  "max-md:sticky max-md:right-0 max-md:z-10 max-md:border-l max-md:border-border max-md:bg-card max-md:shadow-[-8px_0_12px_-8px_rgba(0,0,0,0.08)] max-md:group-hover:bg-muted/50 md:static md:z-auto md:border-l-0 md:shadow-none md:group-hover:bg-transparent";

type CompanyRow = Record<string, unknown>;

function CustomerActionsMenu({
  companyId,
  companyStatus,
  onOpen,
  canEditCompany,
  canApproveReject,
  canDelete,
  onDelete,
  onStatusChanged,
}: {
  companyId: number;
  companyStatus: string;
  onOpen: () => void;
  canEditCompany: boolean;
  canApproveReject: boolean;
  canDelete: boolean;
  onDelete: () => void;
  onStatusChanged: () => void;
}) {
  const t = useTranslations("AdminCustomers");
  const tc = useTranslations("AdminCommon");
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const busy = approving || rejecting;

  const st = companyStatus.toLowerCase();
  const showApprove = canApproveReject && st !== "active";
  const showReject = canApproveReject && st !== "inactive";

  async function handleApprove() {
    setApproving(true);
    try {
      await approveAdminCompany(companyId);
      toast.success(t("toasts.activated"));
      onStatusChanged();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : t("toasts.activateFailed"));
    } finally {
      setApproving(false);
    }
  }

  async function handleReject() {
    setRejecting(true);
    try {
      await rejectAdminCompany(companyId, "Rejected by admin.");
      toast.success(t("toasts.deactivated"));
      onStatusChanged();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : t("toasts.deactivateFailed"));
    } finally {
      setRejecting(false);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), "shrink-0")}
        disabled={busy}
      >
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        ) : (
          <MoreHorizontal className="h-4 w-4" />
        )}
        <span className="sr-only">{tc("actions.actionsMenu")}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-44">
        <DropdownMenuItem className="cursor-pointer" onClick={onOpen}>
          {canEditCompany ? (
            <Pencil className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
          {canEditCompany ? t("actions.manageCustomer") : tc("actions.viewDetail")}
        </DropdownMenuItem>
        {(showApprove || showReject) ? (
          <>
            <DropdownMenuSeparator />
            {showApprove ? (
              <DropdownMenuItem className="cursor-pointer" disabled={busy} onClick={() => void handleApprove()}>
                {approving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                {approving ? tc("actions.activating") : t("actions.activateCustomer")}
              </DropdownMenuItem>
            ) : null}
            {showReject ? (
              <DropdownMenuItem className="cursor-pointer" disabled={busy} onClick={() => void handleReject()}>
                {rejecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                {rejecting ? tc("actions.deactivating") : t("actions.deactivateCustomer")}
              </DropdownMenuItem>
            ) : null}
          </>
        ) : null}
        {canDelete ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer text-destructive focus:text-destructive"
              disabled={busy}
              onClick={onDelete}
            >
              <Trash2 className="h-4 w-4" />
              {t("actions.deleteCustomer")}
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function AdminCustomersPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = String(params?.locale ?? "id");
  const t = useTranslations("AdminCustomers");
  const tc = useTranslations("AdminCommon");
  const customerStatusLabel = useCustomerStatusLabel();
  const customersBasePath = `/${locale}/dashboard/admin/customer/customers`;
  const authHydrated = useAuthPersistHydrated();
  const { user } = useAuthStore();
  const caps = useMemo(
    () => getAdminCustomerCapabilities((user?.roles as string[] | undefined) ?? []),
    [user?.roles]
  );
  const canCreateCustomer = authHydrated && caps.canCreateCustomer;

  const [rows, setRows] = useState<CompanyRow[]>([]);
  const [companyStats, setCompanyStats] = useState<Record<string, number> | null>(null);
  const [meta, setMeta] = useState<LaravelPaginated<CompanyRow> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 400);
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    const status = searchParams.get("status");
    if (status) setStatusFilter(status);
  }, [searchParams]);

  const companyStatusFilters = useMemo(
    () => [
      { value: "all", label: tc("filters.allStatus") },
      { value: "active", label: t("filters.active") },
      { value: "pending", label: t("filters.pending") },
      { value: "suspended", label: tc("status.customer.suspended") },
      { value: "rejected", label: tc("status.customer.rejected") },
      { value: "inactive", label: t("filters.inactive") },
    ],
    [t, tc]
  );

  const [deleteCompanyId, setDeleteCompanyId] = useState<number | null>(null);
  const [deleteCompanyLoading, setDeleteCompanyLoading] = useState(false);

  const handleConfirmDeleteCompany = async () => {
    const idToDelete = deleteCompanyId;
    if (idToDelete == null) return;
    setDeleteCompanyLoading(true);
    try {
      await deleteAdminCompany(idToDelete);
      toast.success(t("toasts.deleted"));
      setDeleteCompanyId(null);
      void load();
      void loadStats();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : t("toasts.deleteFailed"));
    } finally {
      setDeleteCompanyLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter]);

  const statusParam = statusFilter === "all" ? undefined : statusFilter;

  const loadStats = useCallback(async () => {
    if (!authHydrated) return;
    try {
      const res = await fetchAdminCompanyStats();
      setCompanyStats((res as { data: Record<string, number> }).data);
    } catch {
      setCompanyStats(null);
    }
  }, [authHydrated]);

  const load = useCallback(async () => {
    if (!authHydrated) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetchAdminCompanies({
        page,
        perPage: PER_PAGE,
        search: debouncedSearch.trim() || undefined,
        status: statusParam,
      });
      const paginated = res as LaravelPaginated<CompanyRow>;
      setRows(paginated.data ?? []);
      setMeta(paginated);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t("toasts.loadFailed"));
      setRows([]);
      setMeta(null);
    } finally {
      setLoading(false);
    }
  }, [authHydrated, page, debouncedSearch, statusParam]);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  useEffect(() => {
    void load();
  }, [load]);

  const countActive = companyStats?.active ?? 0;
  const countPending = companyStats?.pending ?? 0;
  const totalStats = companyStats?.total ?? 0;

  return (
    <div className="flex md:px-2 min-w-0 w-full flex-1 flex-col gap-6">
      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-900/5 text-zinc-900">
            <Building2 className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-semibold tracking-tight text-zinc-900 sm:text-2xl">{t("pageTitle")}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{t("pageSubtitle")}</p>
          </div>
        </div>
        {canCreateCustomer && (
          <div className="flex w-full shrink-0 sm:w-auto sm:justify-end">
            <Button
              className="h-9 w-full gap-1.5 px-4 sm:w-auto"
              type="button"
              onClick={() => router.push(`${customersBasePath}/create`)}
            >
              <Plus className="h-4 w-4 shrink-0" />
              {t("addCustomer")}
            </Button>
          </div>
        )}
      </div>

      {error ? (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between gap-2">
              <CardDescription>{t("stats.active")}</CardDescription>
              <span className="rounded-md bg-emerald-100 p-1.5 text-emerald-700">
                <UserCheck className="h-3.5 w-3.5" aria-hidden />
              </span>
            </div>
            <CardTitle className="flex flex-col gap-0.5 text-2xl font-semibold">
              <span>{countActive}</span>
              <span className="text-xs font-normal text-emerald-600">{t("stats.activeHint")}</span>
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between gap-2">
              <CardDescription>{t("stats.pending")}</CardDescription>
              <span className="rounded-md bg-amber-100 p-1.5 text-amber-700">
                <ClipboardClock className="h-3.5 w-3.5" aria-hidden />
              </span>
            </div>
            <CardTitle className="flex flex-col gap-0.5 text-2xl font-semibold">
              <span>{countPending}</span>
              <span className="text-xs font-normal text-muted-foreground">{t("stats.pendingHint")}</span>
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between gap-2">
              <CardDescription>{t("stats.total")}</CardDescription>
              <span className="rounded-md bg-sky-100 p-1.5 text-sky-700">
                <Users className="h-3.5 w-3.5" aria-hidden />
              </span>
            </div>
            <CardTitle className="flex flex-col gap-0.5 text-2xl font-semibold">
              <span>{totalStats}</span>
              <span className="text-xs font-normal text-muted-foreground">{t("stats.totalHint")}</span>
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

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
            filterOptions={companyStatusFilters}
          />
          {loading ? (
            <p className="text-sm text-muted-foreground">{tc("actions.loading")}</p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-14">{tc("table.no")}</TableHead>
                    <TableHead>{t("columns.code")}</TableHead>
                    <TableHead>{t("columns.companyName")}</TableHead>
                    <TableHead>{t("columns.status")}</TableHead>
                    <TableHead>{t("columns.registrationDate")}</TableHead>
                    <TableHead className={actionsHeadClass}>
                      <span className="max-md:sr-only">{tc("table.actions")}</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((cust, index) => {
                    const id = Number(cust.id);
                    const st = String(cust.status ?? "");
                    return (
                      <TableRow key={id} className="group">
                        <TableCell className="tabular-nums text-muted-foreground">
                          {rowNumber(meta?.current_page ?? page, PER_PAGE, index)}
                        </TableCell>
                        <TableCell className="font-mono text-xs">{String(cust.company_code ?? "—")}</TableCell>
                        <TableCell className="font-medium">{String(cust.name ?? "")}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={customerStatusBadgeClass(st)}>
                            {customerStatusLabel(st)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {cust.created_at ? String(cust.created_at).slice(0, 10) : "—"}
                        </TableCell>
                        <TableCell className={cn(actionsCellClass, "p-2 text-right")}>
                          <div className="flex justify-end">
                            <CustomerActionsMenu
                              companyId={id}
                              companyStatus={st}
                              canEditCompany={caps.canEditCompanyData}
                              canApproveReject={caps.canApproveReject}
                              canDelete={caps.canDeleteCompany}
                              onOpen={() => {
                                router.push(`${customersBasePath}/${id}${caps.canEditCompanyData ? "" : ""}`);
                              }}
                              onDelete={() => setDeleteCompanyId(id)}
                              onStatusChanged={() => {
                                void load();
                                void loadStats();
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

      <ConfirmDeleteDialog
        open={deleteCompanyId != null}
        onOpenChange={(o) => !o && setDeleteCompanyId(null)}
        title={t("deleteDialog.title")}
        description={t("deleteDialog.description")}
        loading={deleteCompanyLoading}
        onConfirm={handleConfirmDeleteCompany}
      />
    </div>
  );
}
