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
import { useAuthPersistHydrated } from "@/lib/use-auth-hydrated";
import {
  deleteAdminServiceType,
  fetchAdminServiceTypes,
  fetchAdminTransportModes,
} from "@/lib/admin-api";
import type { LaravelPaginated } from "@/lib/types-api";
import { ApiError } from "@/lib/api-client";
import { rowNumber } from "@/lib/list-query";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { MasterRowActions } from "../_components/master-row-actions";
import { MasterTableShell } from "../_components/master-table-shell";
import { MasterActiveBadge } from "../_components/master-active-badge";
import { actionsCellClass, actionsHeadClass } from "../_components/master-table-classes";
import { STATUS_FILTER_OPTIONS } from "../_components/master-filters";
import { MasterServiceTypeDialog } from "../_components/master-service-type-dialog";
import { useMasterOpenCreateFromQuery } from "../_components/use-master-open-create-from-query";
import type { SimpleDialogMode } from "../_components/master-transport-mode-dialog";
import { ConfirmDeleteDialog } from "@/components/dashboard/admin/confirm-delete-dialog";
import { Plus } from "lucide-react";

const PER_PAGE = 10;
const TRANSPORT_MODES_CAP = 500;

type Row = Record<string, unknown>;

export default function MasterServiceTypesPage() {
  const authHydrated = useAuthPersistHydrated();
  const { user } = useAuthStore();
  const roles = user?.roles ?? [];
  const canManageMaster = authHydrated && (roles.includes("super_admin") || roles.includes("operations"));

  const [rows, setRows] = useState<Row[]>([]);
  const [meta, setMeta] = useState<LaravelPaginated<Row> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [transportModes, setTransportModes] = useState<Row[]>([]);

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 400);
  const [transportModeFilter, setTransportModeFilter] = useState("all");
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
  }, [debouncedSearch, transportModeFilter, statusFilter]);

  const transportModeFilterOptions = useMemo(() => {
    const opts = transportModes.map((tm) => ({
      value: String(tm.id ?? ""),
      label: String(tm.name ?? tm.code ?? tm.id ?? ""),
    }));
    return [{ value: "all", label: "Semua moda" }, ...opts];
  }, [transportModes]);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetchAdminServiceTypes({
        page,
        perPage: PER_PAGE,
        search: debouncedSearch.trim() || undefined,
        status: statusFilter === "all" ? undefined : statusFilter,
        transportModeId:
          transportModeFilter === "all" ? undefined : Number(transportModeFilter) || undefined,
      });
      const paginated = res as LaravelPaginated<Row>;
      setRows(paginated.data ?? []);
      setMeta(paginated);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Gagal memuat service types.");
      setRows([]);
      setMeta(null);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, transportModeFilter, statusFilter]);

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
          searchPlaceholder="Cari kode atau nama layanan…"
          searchValue={searchInput}
          onSearchChange={setSearchInput}
          filterLabel="Moda"
          filterValue={transportModeFilter}
          onFilterChange={setTransportModeFilter}
          filterOptions={transportModeFilterOptions}
          filter2Label="Status"
          filter2Value={statusFilter}
          onFilter2Change={setStatusFilter}
          filter2Options={STATUS_FILTER_OPTIONS}
        />
      </div>
      {canManageMaster ? (
        <Button type="button" className="shrink-0 gap-1.5" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Tambah service type
        </Button>
      ) : null}
    </div>
  );

  const handleDelete = async () => {
    if (deleteRow?.id == null) return;
    setDeleteLoading(true);
    try {
      await deleteAdminServiceType(Number(deleteRow.id));
      toast.success("Service type berhasil dihapus.");
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
        title="Daftar Service Types"
        description="FCL / LCL dan layanan terkait moda transport."
        loading={loading}
        toolbar={toolbar}
      >
        <div className="overflow-x-auto -mx-1 px-1">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-14">No</TableHead>
                <TableHead className="w-[120px]">Kode</TableHead>
                <TableHead>Nama Layanan</TableHead>
                <TableHead>Moda</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className={actionsHeadClass}>
                  <span className="max-md:sr-only">Aksi</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((svc, index) => {
                const code = String(svc.code ?? svc.id ?? "");
                const tm = svc.transport_mode as { name?: string } | undefined;
                const active = svc.is_active !== false;
                return (
                  <TableRow key={String(svc.id ?? code)} className="group">
                    <TableCell className="tabular-nums text-muted-foreground">
                      {rowNumber(meta?.current_page ?? page, PER_PAGE, index)}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{code}</TableCell>
                    <TableCell className="font-medium">{String(svc.name ?? "")}</TableCell>
                    <TableCell>{tm?.name ?? "—"}</TableCell>
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
                          onEdit={canManageMaster ? () => {
                            setDialogRow(svc);
                            setDialogMode("edit");
                            setDialogOpen(true);
                          } : undefined}
                          onDelete={canManageMaster ? () => {
                            setDeleteRow(svc);
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
              <TableCaption className="text-xs">Tidak ada data service type.</TableCaption>
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
        title="Hapus service type?"
        description={`Yakin hapus "${String(deleteRow?.name ?? "")}"?`}
        loading={deleteLoading}
        onConfirm={handleDelete}
      />
    </>
  );
}
