"use client";

import { toast } from "sonner";
import { useCallback, useEffect, useState } from "react";
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
import { useAuthPersistHydrated } from "@/lib/use-auth-hydrated";
import { deleteAdminTransportMode, fetchAdminTransportModes } from "@/lib/admin-api";
import type { LaravelPaginated } from "@/lib/types-api";
import { ApiError } from "@/lib/api-client";
import { rowNumber } from "@/lib/list-query";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { MasterRowActions } from "../_components/master-row-actions";
import { MasterTableShell } from "../_components/master-table-shell";
import { MasterActiveBadge } from "../_components/master-active-badge";
import { actionsCellClass, actionsHeadClass } from "../_components/master-table-classes";
import { STATUS_FILTER_OPTIONS } from "../_components/master-filters";
import {
  MasterTransportModeDialog,
  type SimpleDialogMode,
} from "../_components/master-transport-mode-dialog";
import { useMasterOpenCreateFromQuery } from "../_components/use-master-open-create-from-query";
import { ConfirmDeleteDialog } from "@/components/dashboard/admin/confirm-delete-dialog";
import { Plus } from "lucide-react";

const PER_PAGE = 10;

type Row = Record<string, unknown>;

export default function MasterTransportModesPage() {
  const authHydrated = useAuthPersistHydrated();
  const { user } = useAuthStore();
  const roles = user?.roles ?? [];
  const canManageMaster = authHydrated && (roles.includes("super_admin") || roles.includes("operations"));

  const [rows, setRows] = useState<Row[]>([]);
  const [meta, setMeta] = useState<LaravelPaginated<Row> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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
    setPage(1);
  }, [debouncedSearch, statusFilter]);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetchAdminTransportModes({
        page,
        perPage: PER_PAGE,
        search: debouncedSearch.trim() || undefined,
        status: statusFilter === "all" ? undefined : statusFilter,
      });
      const paginated = res as LaravelPaginated<Row>;
      setRows(paginated.data ?? []);
      setMeta(paginated);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Gagal memuat moda transport.");
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

  const toolbar = (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
      <div className="min-w-0 flex-1">
        <TableToolbar
          searchPlaceholder="Cari kode atau nama moda…"
          searchValue={searchInput}
          onSearchChange={setSearchInput}
          filterLabel="Status"
          filterValue={statusFilter}
          onFilterChange={setStatusFilter}
          filterOptions={STATUS_FILTER_OPTIONS}
        />
      </div>
      {canManageMaster ? (
        <Button type="button" className="shrink-0 gap-1.5" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Tambah moda
        </Button>
      ) : null}
    </div>
  );

  const handleDelete = async () => {
    if (deleteRow?.id == null) return;
    setDeleteLoading(true);
    try {
      await deleteAdminTransportMode(Number(deleteRow.id));
      toast.success("Moda transport berhasil dihapus.");
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

      <MasterTableShell
        title="Daftar Moda Transport"
        description="Moda transport yang tersedia untuk booking."
        loading={loading}
        toolbar={toolbar}
      >
        <div className="overflow-x-auto -mx-1 px-1">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-14">No</TableHead>
                <TableHead className="w-[100px]">Kode</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className={actionsHeadClass}>
                  <span className="max-md:sr-only">Aksi</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((m, index) => {
                const code = String(m.code ?? m.id ?? "");
                const active = m.is_active !== false;
                return (
                  <TableRow key={String(m.id ?? code)} className="group">
                    <TableCell className="tabular-nums text-muted-foreground">
                      {rowNumber(meta?.current_page ?? page, PER_PAGE, index)}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{code}</TableCell>
                    <TableCell className="font-medium">{String(m.name ?? "")}</TableCell>
                    <TableCell>
                      <MasterActiveBadge active={active} />
                    </TableCell>
                    <TableCell className={cn(actionsCellClass, "p-2 text-right")}>
                      <div className="flex justify-end">
                        <MasterRowActions
                          entityLabel="moda transport"
                          canManage={canManageMaster}
                          onView={() => {
                            setDialogRow(m);
                            setDialogMode("view");
                            setDialogOpen(true);
                          }}
                          onEdit={canManageMaster ? () => {
                            setDialogRow(m);
                            setDialogMode("edit");
                            setDialogOpen(true);
                          } : undefined}
                          onDelete={canManageMaster ? () => {
                            setDeleteRow(m);
                            setDeleteOpen(true);
                          } : undefined}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
            {rows.length === 0 ? (
              <TableCaption className="text-xs">Tidak ada data moda transport.</TableCaption>
            ) : (
              <TableCaption className="text-xs">Baris pada halaman ini.</TableCaption>
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

      <MasterTransportModeDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        row={dialogRow}
        onSaved={() => void load()}
      />

      <ConfirmDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Hapus moda transport?"
        description={`Yakin hapus "${String(deleteRow?.name ?? "")}"?`}
        loading={deleteLoading}
        onConfirm={handleDelete}
      />
    </>
  );
}
