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
import { deleteAdminContainerType, fetchAdminContainerTypes } from "@/lib/admin-api";
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
import { MasterContainerTypeDialog } from "@/components/dashboard/admin/master/master-container-type-dialog";
import { useMasterOpenCreateFromQuery } from "@/hooks/use-master-open-create-from-query";
import type { SimpleDialogMode } from "@/components/dashboard/admin/master/master-transport-mode-dialog";
import { ConfirmDeleteDialog } from "@/components/dashboard/admin/confirm-delete-dialog";
import { CONTAINER_CATEGORY_OPTIONS } from "@/lib/admin-fsd-options";
import { humanizeSnakeCase } from "@/lib/format-label";
import { Box, Plus } from "lucide-react";
import { useTranslations } from "next-intl";

const PER_PAGE = 10;

type Row = Record<string, unknown>;

export default function MasterContainerTypesPage() {
  const authHydrated = useAuthPersistHydrated();
  const { user } = useAuthStore();
  const roles = user?.roles ?? [];
  const canManageMaster = authHydrated && (roles.includes("super_admin") || roles.includes("operations"));
  const t = useTranslations("AdminFsdMaster.containerType");
  const tc = useTranslations("AdminCommon");

  const [rows, setRows] = useState<Row[]>([]);
  const [meta, setMeta] = useState<LaravelPaginated<Row> | null>(null);
  const [stats, setStats] = useState<Record<string, number>>({ total: 0, active: 0, inactive: 0 });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 400);
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const [containerDialogOpen, setContainerDialogOpen] = useState(false);
  const [containerDialogMode, setContainerDialogMode] = useState<SimpleDialogMode>("create");
  const [containerDialogRow, setContainerDialogRow] = useState<Row | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteRow, setDeleteRow] = useState<Row | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const categoryFilterOptions = useMemo(
    () => [{ value: "all", label: t("filters.allCategory") }, ...CONTAINER_CATEGORY_OPTIONS.map((o) => ({ value: o.value, label: o.label }))],
    [t]
  );

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, categoryFilter]);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const [listRes, totalRes, activeRes, inactiveRes] = await Promise.all([
        fetchAdminContainerTypes({
          page,
          perPage: PER_PAGE,
          search: debouncedSearch.trim() || undefined,
          status: statusFilter === "all" ? undefined : statusFilter,
          category: categoryFilter === "all" ? undefined : categoryFilter,
        }),
        fetchAdminContainerTypes({ perPage: 1 }),
        fetchAdminContainerTypes({ perPage: 1, status: "active" }),
        fetchAdminContainerTypes({ perPage: 1, status: "inactive" }),
      ]);
      const paginated = listRes as LaravelPaginated<Row>;
      let data = paginated.data ?? [];
      if (categoryFilter !== "all") {
        data = data.filter((r) => String(r.category ?? "") === categoryFilter);
      }
      setRows(data);
      setMeta(paginated);
      setStats({
        total: (totalRes as LaravelPaginated<Row>).total ?? 0,
        active: (activeRes as LaravelPaginated<Row>).total ?? 0,
        inactive: (inactiveRes as LaravelPaginated<Row>).total ?? 0,
      });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Gagal memuat jenis kontainer.");
      setRows([]);
      setMeta(null);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, statusFilter, categoryFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const openCreate = useCallback(() => {
    setContainerDialogRow(null);
    setContainerDialogMode("create");
    setContainerDialogOpen(true);
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
      filterLabel={t("filters.category")}
      filterValue={categoryFilter}
      onFilterChange={setCategoryFilter}
      filterOptions={categoryFilterOptions}
      filter2Label={tc("filters.status")}
      filter2Value={statusFilter}
      onFilter2Change={setStatusFilter}
      filter2Options={STATUS_FILTER_OPTIONS}
    />
  );

  const handleDelete = async () => {
    if (deleteRow?.id == null) return;
    setDeleteLoading(true);
    try {
      await deleteAdminContainerType(Number(deleteRow.id));
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

  return (
    <>
      {error ? (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
      ) : null}

      <AdminStatsCards
        className="sm:grid-cols-3"
        cards={[
          { key: "total", label: t("stats.total"), value: stats.total, icon: Box, iconClassName: "text-zinc-700 bg-zinc-100" },
          { key: "active", label: t("stats.active"), value: stats.active, icon: Box, iconClassName: "text-emerald-700 bg-emerald-100" },
          { key: "inactive", label: t("stats.inactive"), value: stats.inactive, icon: Box, iconClassName: "text-red-700 bg-red-100" },
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
                <TableHead>{t("columns.size")}</TableHead>
                <TableHead>{t("columns.category")}</TableHead>
                <TableHead>{t("columns.maxPayload")}</TableHead>
                <TableHead>{t("columns.capacity")}</TableHead>
                <TableHead>{tc("table.status")}</TableHead>
                <TableHead className={actionsHeadClass}>
                  <span className="max-md:sr-only">{tc("table.actions")}</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((c, index) => {
                const id = String(c.id ?? "");
                const active = c.is_active !== false;
                return (
                  <TableRow key={id} className="group">
                    <TableCell className="tabular-nums text-muted-foreground">
                      {rowNumber(meta?.current_page ?? page, PER_PAGE, index)}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{String(c.code ?? "—")}</TableCell>
                    <TableCell className="font-medium">{String(c.name ?? "")}</TableCell>
                    <TableCell className="font-mono text-xs">{String(c.size ?? "—")}</TableCell>
                    <TableCell>{CONTAINER_CATEGORY_OPTIONS.find((o) => o.value === String(c.category ?? ""))?.label ?? humanizeSnakeCase(String(c.category ?? ""))}</TableCell>
                    <TableCell className="tabular-nums">{String(c.capacity_weight ?? "—")}</TableCell>
                    <TableCell className="tabular-nums">{String(c.capacity_cbm ?? "—")}</TableCell>
                    <TableCell>
                      <MasterActiveBadge active={active} />
                    </TableCell>
                    <TableCell className={cn(actionsCellClass, "p-2 text-right")}>
                      <div className="flex justify-end">
                        <MasterRowActions
                          entityLabel="jenis kontainer"
                          canManage={canManageMaster}
                          onView={() => {
                            setContainerDialogRow(c);
                            setContainerDialogMode("view");
                            setContainerDialogOpen(true);
                          }}
                          onEdit={
                            canManageMaster
                              ? () => {
                                  setContainerDialogRow(c);
                                  setContainerDialogMode("edit");
                                  setContainerDialogOpen(true);
                                }
                              : undefined
                          }
                          onDelete={
                            canManageMaster
                              ? () => {
                                  setDeleteRow(c);
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
            ) : (
              <TableCaption className="text-xs">{tc("table.empty")}</TableCaption>
            )}
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

      <MasterContainerTypeDialog
        open={containerDialogOpen}
        onOpenChange={setContainerDialogOpen}
        mode={containerDialogMode}
        row={containerDialogRow}
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
