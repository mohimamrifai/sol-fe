"use client";

import { toast } from "sonner";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { PaginationBar } from "@/components/data-table/pagination-bar";
import { TableToolbar } from "@/components/data-table/table-toolbar";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/store";
import { useAuthPersistHydrated } from "@/hooks/use-auth-hydrated";
import {
  deleteAdminServiceType,
  fetchAdminServiceTypes,
  fetchAdminTransportModes,
} from "@/lib/admin-api";
import type { LaravelPaginated } from "@/lib/types-api";
import { ApiError } from "@/lib/api-client";
import { rowNumber } from "@/lib/list-query";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { MasterRowActions } from "@/components/shared/master-row-actions";
import { MasterTableShell } from "@/components/shared/master-table-shell";
import { useMasterPageActions } from "@/components/shared/master-page-actions";
import { MasterActiveBadge } from "@/components/shared/master-active-badge";
import { actionsCellClass, actionsHeadClass } from "@/components/shared/master-table-classes";
import { STATUS_FILTER_OPTIONS } from "@/components/shared/master-filters";
import { AdminStatsCards } from "@/components/dashboard/admin/shared/admin-stats-cards";
import { MasterServiceTypeDialog } from "@/components/dashboard/admin/master/master-service-type-dialog";
import { useMasterOpenCreateFromQuery } from "@/hooks/use-master-open-create-from-query";
import type { SimpleDialogMode } from "@/components/dashboard/admin/master/master-transport-mode-dialog";
import { ConfirmDeleteDialog } from "@/components/dashboard/admin/confirm-delete-dialog";
import { MASTER_SERVICE_CATEGORY_OPTIONS } from "@/lib/admin-fsd-options";
import { humanizeSnakeCase } from "@/lib/format-label";
import { Layers, Plus } from "lucide-react";
import { useTranslations } from "next-intl";

const PER_PAGE = 10;
const TRANSPORT_MODES_CAP = 500;

type Row = Record<string, unknown>;

export default function MasterServiceTypesPage() {
  const authHydrated = useAuthPersistHydrated();
  const { user } = useAuthStore();
  const roles = user?.roles ?? [];
  const canManageMaster = authHydrated && (roles.includes("super_admin") || roles.includes("operations"));
  const t = useTranslations("AdminFsdMaster.serviceType");
  const tc = useTranslations("AdminCommon");

  const [rows, setRows] = useState<Row[]>([]);
  const [meta, setMeta] = useState<LaravelPaginated<Row> | null>(null);
  const [stats, setStats] = useState<Record<string, number>>({ total: 0, active: 0, inactive: 0 });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [transportModes, setTransportModes] = useState<Row[]>([]);

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 400);
  const [statusFilter, setStatusFilter] = useState("all");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<SimpleDialogMode>("create");
  const [dialogRow, setDialogRow] = useState<Row | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteRow, setDeleteRow] = useState<Row | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetchAdminTransportModes({ page: 1, perPage: TRANSPORT_MODES_CAP });
        const paginated = res as LaravelPaginated<Row>;
        setTransportModes(paginated.data ?? []);
      } catch {
        setTransportModes([]);
      }
    })();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter]);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const [listRes, totalRes, activeRes, inactiveRes] = await Promise.all([
        fetchAdminServiceTypes({
          page,
          perPage: PER_PAGE,
          search: debouncedSearch.trim() || undefined,
          status: statusFilter === "all" ? undefined : statusFilter,
        }),
        fetchAdminServiceTypes({ perPage: 1 }),
        fetchAdminServiceTypes({ perPage: 1, status: "active" }),
        fetchAdminServiceTypes({ perPage: 1, status: "inactive" }),
      ]);
      const paginated = listRes as LaravelPaginated<Row>;
      setRows(paginated.data ?? []);
      setMeta(paginated);
      setStats({
        total: (totalRes as LaravelPaginated<Row>).total ?? 0,
        active: (activeRes as LaravelPaginated<Row>).total ?? 0,
        inactive: (inactiveRes as LaravelPaginated<Row>).total ?? 0,
      });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Gagal memuat service types.");
      setRows([]);
      setMeta(null);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, statusFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const openCreate = useCallback(() => {
    setDialogRow(null);
    setDialogMode("create");
    setDialogOpen(true);
  }, []);

  useMasterOpenCreateFromQuery({
    authHydrated,
    canManage: canManageMaster,
    onOpenCreate: openCreate,
  });

  useMasterPageActions(
    useMemo(
      () =>
        canManageMaster ? (
          <Button type="button" className="gap-1.5" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            {t("add")}
          </Button>
        ) : null,
      [canManageMaster, openCreate, t]
    )
  );

  const toolbar = (
    <TableToolbar
      searchPlaceholder={t("search")}
      searchValue={searchInput}
      onSearchChange={setSearchInput}
      filterLabel={tc("filters.status")}
      filterValue={statusFilter}
      onFilterChange={setStatusFilter}
      filterOptions={STATUS_FILTER_OPTIONS}
    />
  );

  const handleDelete = async () => {
    if (deleteRow?.id == null) return;
    setDeleteLoading(true);
    try {
      await deleteAdminServiceType(Number(deleteRow.id));
      toast.success(t("deleted"));
      setDeleteOpen(false);
      setDeleteRow(null);
      await load();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Gagal menghapus.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const categoryLabel = useCallback(
    (svc: Row) => {
      if (svc.service_category_label) return String(svc.service_category_label);
      const value = String(svc.service_category ?? "");
      return (
        MASTER_SERVICE_CATEGORY_OPTIONS.find((o) => o.value === value)?.label
        ?? (value ? humanizeSnakeCase(value) : "—")
      );
    },
    []
  );

  return (
    <>
      {error ? (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
      ) : null}

      <AdminStatsCards
        className="sm:grid-cols-3"
        cards={[
          { key: "total", label: t("stats.total"), value: stats.total, icon: Layers, iconClassName: "text-zinc-700 bg-zinc-100" },
          { key: "active", label: t("stats.active"), value: stats.active, icon: Layers, iconClassName: "text-emerald-700 bg-emerald-100" },
          { key: "inactive", label: t("stats.inactive"), value: stats.inactive, icon: Layers, iconClassName: "text-red-700 bg-red-100" },
        ]}
      />

      <MasterTableShell title={t("listTitle")} description={t("search")} loading={loading} toolbar={toolbar}>
        <div className="overflow-x-auto -mx-1 px-1">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-14">{tc("table.no")}</TableHead>
                <TableHead>{t("columns.code")}</TableHead>
                <TableHead>{t("columns.name")}</TableHead>
                <TableHead>{t("columns.category")}</TableHead>
                <TableHead>{tc("table.status")}</TableHead>
                <TableHead className={actionsHeadClass}>
                  <span className="max-md:sr-only">{tc("table.actions")}</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((svc, index) => {
                const code = String(svc.code ?? svc.id ?? "");
                const active = svc.is_active !== false;
                return (
                  <TableRow key={String(svc.id ?? code)} className="group">
                    <TableCell className="tabular-nums text-muted-foreground">
                      {rowNumber(meta?.current_page ?? page, PER_PAGE, index)}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{code}</TableCell>
                    <TableCell className="font-medium">{String(svc.name ?? "")}</TableCell>
                    <TableCell>{categoryLabel(svc)}</TableCell>
                    <TableCell>
                      <MasterActiveBadge active={active} />
                    </TableCell>
                    <TableCell className={cn(actionsCellClass, "p-2 text-right")}>
                      <div className="flex justify-end">
                        <MasterRowActions
                          entityLabel="service type"
                          canManage={canManageMaster}
                          onView={() => {
                            setDialogRow(svc);
                            setDialogMode("view");
                            setDialogOpen(true);
                          }}
                          onEdit={
                            canManageMaster
                              ? () => {
                                  setDialogRow(svc);
                                  setDialogMode("edit");
                                  setDialogOpen(true);
                                }
                              : undefined
                          }
                          onDelete={
                            canManageMaster
                              ? () => {
                                  setDeleteRow(svc);
                                  setDeleteOpen(true);
                                }
                              : undefined
                          }
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
            {rows.length === 0 ? (
              <TableCaption className="text-xs">{tc("table.empty")}</TableCaption>
            ) : null}
          </Table>
        </div>
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
      </MasterTableShell>

      <MasterServiceTypeDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        row={dialogRow}
        transportModes={transportModes}
        onSaved={() => void load()}
      />

      <ConfirmDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={t("deleteTitle")}
        description={t("deleteDesc")}
        loading={deleteLoading}
        onConfirm={handleDelete}
      />
    </>
  );
}
