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
import { deleteAdminContainerType, fetchAdminContainerTypes } from "@/lib/admin-api";
import type { LaravelPaginated } from "@/lib/types-api";
import { ApiError } from "@/lib/api-client";
import { rowNumber } from "@/lib/list-query";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { MasterRowActions } from "../_components/master-row-actions";
import { MasterTableShell } from "../_components/master-table-shell";
import { MasterActiveBadge } from "../_components/master-active-badge";
import { actionsCellClass, actionsHeadClass } from "../_components/master-table-classes";
import { STATUS_FILTER_OPTIONS } from "../_components/master-filters";
import { MasterContainerTypeDialog } from "../_components/master-container-type-dialog";
import { useMasterOpenCreateFromQuery } from "../_components/use-master-open-create-from-query";
import type { SimpleDialogMode } from "../_components/master-transport-mode-dialog";
import { ConfirmDeleteDialog } from "@/components/dashboard/admin/confirm-delete-dialog";
import { Plus } from "lucide-react";

const PER_PAGE = 10;

type Row = Record<string, unknown>;

export default function MasterContainerTypesPage() {
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

  const [containerDialogOpen, setContainerDialogOpen] = useState(false);
  const [containerDialogMode, setContainerDialogMode] = useState<SimpleDialogMode>("create");
  const [containerDialogRow, setContainerDialogRow] = useState<Row | null>(null);

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
      const res = await fetchAdminContainerTypes({
        page,
        perPage: PER_PAGE,
        search: debouncedSearch.trim() || undefined,
        status: statusFilter === "all" ? undefined : statusFilter,
      });
      const paginated = res as LaravelPaginated<Row>;
      setRows(paginated.data ?? []);
      setMeta(paginated);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Gagal memuat jenis kontainer.");
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
    setContainerDialogRow(null);
    setContainerDialogMode("create");
    setContainerDialogOpen(true);
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
          searchPlaceholder="Cari nama atau ukuran…"
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
          Tambah jenis kontainer
        </Button>
      ) : null}
    </div>
  );

  const handleDelete = async () => {
    if (deleteRow?.id == null) return;
    setDeleteLoading(true);
    try {
      await deleteAdminContainerType(Number(deleteRow.id));
      toast.success("Jenis kontainer berhasil dihapus.");
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
        title="Daftar Jenis Kontainer"
        description="Tipe kontainer untuk booking (ukuran & status)."
        loading={loading}
        toolbar={toolbar}
      >
        <div className="overflow-x-auto -mx-1 px-1">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-14">No</TableHead>
                <TableHead className="min-w-[120px]">Nama</TableHead>
                <TableHead>Ukuran</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className={actionsHeadClass}>
                  <span className="max-md:sr-only">Aksi</span>
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
                    <TableCell className="font-medium">{String(c.name ?? "")}</TableCell>
                    <TableCell className="font-mono text-xs">{String(c.size ?? "—")}</TableCell>
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
                          onEdit={canManageMaster ? () => {
                            setContainerDialogRow(c);
                            setContainerDialogMode("edit");
                            setContainerDialogOpen(true);
                          } : undefined}
                          onDelete={canManageMaster ? () => {
                            setDeleteRow(c);
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
              <TableCaption className="text-xs">Tidak ada data jenis kontainer.</TableCaption>
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
        title="Hapus jenis kontainer?"
        description={`Yakin hapus "${String(deleteRow?.name ?? "")}"?`}
        loading={deleteLoading}
        onConfirm={handleDelete}
      />
    </>
  );
}
