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
import { deleteAdminLocation, fetchAdminLocations } from "@/lib/admin-api";
import type { LaravelPaginated } from "@/lib/types-api";
import { ApiError } from "@/lib/api-client";
import { rowNumber } from "@/lib/list-query";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { MasterRowActions } from "../_components/master-row-actions";
import { MasterTableShell } from "../_components/master-table-shell";
import { MasterActiveBadge } from "../_components/master-active-badge";
import { actionsCellClass, actionsHeadClass } from "../_components/master-table-classes";
import {
  LOCATION_TYPE_FILTER_OPTIONS,
  STATUS_FILTER_OPTIONS,
} from "../_components/master-filters";
import {
  MasterLocationDialog,
  type LocationDialogMode,
} from "../_components/master-location-dialog";
import { useMasterOpenCreateFromQuery } from "../_components/use-master-open-create-from-query";
import { ConfirmDeleteDialog } from "@/components/dashboard/admin/confirm-delete-dialog";
import { Plus } from "lucide-react";

const PER_PAGE = 10;

type Row = Record<string, unknown>;

function locationTypeLabel(code: string): string {
  const m: Record<string, string> = {
    port: "Pelabuhan",
    city: "Kota",
    hub: "Hub",
    warehouse: "Gudang",
    station: "Stasiun",
    airport: "Bandara",
    terminal: "Terminal",
  };
  return m[code] ?? code;
}

export default function MasterLocationsPage() {
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
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [locationDialogOpen, setLocationDialogOpen] = useState(false);
  const [locationDialogMode, setLocationDialogMode] = useState<LocationDialogMode>("create");
  const [locationDialogRow, setLocationDialogRow] = useState<Row | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteRow, setDeleteRow] = useState<Row | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, typeFilter, statusFilter]);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const locRes = await fetchAdminLocations({
        page,
        perPage: PER_PAGE,
        search: debouncedSearch.trim() || undefined,
        type: typeFilter === "all" ? undefined : typeFilter,
        status: statusFilter === "all" ? undefined : statusFilter,
      });
      const paginated = locRes as LaravelPaginated<Row>;
      setRows(paginated.data ?? []);
      setMeta(paginated);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Gagal memuat lokasi.");
      setRows([]);
      setMeta(null);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, typeFilter, statusFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const openCreate = useCallback(() => {
    setLocationDialogRow(null);
    setLocationDialogMode("create");
    setLocationDialogOpen(true);
  }, []);

  useMasterOpenCreateFromQuery({
    authHydrated,
    canManage: canManageMaster,
    onOpenCreate: openCreate,
  });

  const openView = (row: Row) => {
    setLocationDialogRow(row);
    setLocationDialogMode("view");
    setLocationDialogOpen(true);
  };

  const openEdit = (row: Row) => {
    setLocationDialogRow(row);
    setLocationDialogMode("edit");
    setLocationDialogOpen(true);
  };

  const openDelete = (row: Row) => {
    setDeleteRow(row);
    setDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (deleteRow?.id == null) return;
    setDeleteLoading(true);
    try {
      await deleteAdminLocation(Number(deleteRow.id));
      toast.success("Lokasi berhasil dihapus.");
      setDeleteOpen(false);
      setDeleteRow(null);
      await load();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Gagal menghapus.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const toolbar = (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
      <div className="min-w-0 flex-1">
        <TableToolbar
          searchPlaceholder="Cari kode atau nama lokasi…"
          searchValue={searchInput}
          onSearchChange={setSearchInput}
          filterLabel="Tipe"
          filterValue={typeFilter}
          onFilterChange={setTypeFilter}
          filterOptions={LOCATION_TYPE_FILTER_OPTIONS}
          filter2Label="Status"
          filter2Value={statusFilter}
          onFilter2Change={setStatusFilter}
          filter2Options={STATUS_FILTER_OPTIONS}
        />
      </div>
      {canManageMaster ? (
        <Button type="button" className="shrink-0 gap-1.5" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Tambah lokasi
        </Button>
      ) : null}
    </div>
  );

  return (
    <>
      {error ? (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
      ) : null}

      <MasterTableShell
        title="Daftar Lokasi"
        description="Origin, destination & terminal."
        loading={loading}
        toolbar={toolbar}
      >
        <div className="overflow-x-auto -mx-1 px-1">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-14">No</TableHead>
                <TableHead className="w-[100px]">Kode</TableHead>
                <TableHead>Nama Lokasi</TableHead>
                <TableHead>Kota</TableHead>
                <TableHead>Tipe</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className={actionsHeadClass}>
                  <span className="max-md:sr-only">Aksi</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((loc, index) => {
                const code = String(loc.code ?? loc.id ?? "");
                const typeCode = String(loc.type ?? "");
                const city = String(loc.city ?? "");
                const active = loc.is_active !== false;
                return (
                  <TableRow key={String(loc.id ?? code)} className="group">
                    <TableCell className="tabular-nums text-muted-foreground">
                      {rowNumber(meta?.current_page ?? page, PER_PAGE, index)}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{code}</TableCell>
                    <TableCell className="font-medium">{String(loc.name ?? "")}</TableCell>
                    <TableCell>{city || "—"}</TableCell>
                    <TableCell>{locationTypeLabel(typeCode)}</TableCell>
                    <TableCell>
                      <MasterActiveBadge active={active} />
                    </TableCell>
                    <TableCell className={cn(actionsCellClass, "p-2 text-right")}>
                      <div className="flex justify-end">
                        <MasterRowActions
                          entityLabel="lokasi"
                          canManage={canManageMaster}
                          onView={() => openView(loc)}
                          onEdit={canManageMaster ? () => openEdit(loc) : undefined}
                          onDelete={canManageMaster ? () => openDelete(loc) : undefined}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
            {rows.length === 0 ? (
              <TableCaption className="text-xs">Tidak ada data lokasi.</TableCaption>
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

      <MasterLocationDialog
        open={locationDialogOpen}
        onOpenChange={setLocationDialogOpen}
        mode={locationDialogMode}
        row={locationDialogRow}
        onSaved={() => void load()}
      />

      <ConfirmDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Hapus lokasi?"
        description={`Yakin hapus lokasi "${String(deleteRow?.name ?? "")}"? Tindakan ini tidak dapat dibatalkan.`}
        loading={deleteLoading}
        onConfirm={handleDelete}
      />
    </>
  );
}
