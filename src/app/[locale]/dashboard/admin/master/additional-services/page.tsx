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
import { deleteAdminAdditionalService, fetchAdminAdditionalServices } from "@/lib/admin-api";
import type { LaravelPaginated } from "@/lib/types-api";
import { ApiError } from "@/lib/api-client";
import { rowNumber } from "@/lib/list-query";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { MasterRowActions } from "../_components/master-row-actions";
import { MasterTableShell } from "../_components/master-table-shell";
import { MasterActiveBadge } from "../_components/master-active-badge";
import { actionsCellClass, actionsHeadClass } from "../_components/master-table-classes";
import {
  ADDITIONAL_CATEGORY_FILTER_OPTIONS,
  STATUS_FILTER_OPTIONS,
} from "../_components/master-filters";
import { MasterAdditionalServiceDialog } from "../_components/master-additional-service-dialog";
import { useMasterOpenCreateFromQuery } from "../_components/use-master-open-create-from-query";
import type { SimpleDialogMode } from "../_components/master-transport-mode-dialog";
import { ConfirmDeleteDialog } from "@/components/dashboard/admin/confirm-delete-dialog";
import { Plus } from "lucide-react";

const PER_PAGE = 10;

type Row = Record<string, unknown>;

function categoryLabel(code: string): string {
  const m: Record<string, string> = {
    pickup: "Pickup",
    packing: "Packing",
    handling: "Handling",
    other: "Lainnya",
  };
  return m[code] ?? code;
}

export default function MasterAdditionalServicesPage() {
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
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<SimpleDialogMode>("create");
  const [dialogRow, setDialogRow] = useState<Row | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteRow, setDeleteRow] = useState<Row | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, categoryFilter, statusFilter]);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetchAdminAdditionalServices({
        page,
        perPage: PER_PAGE,
        search: debouncedSearch.trim() || undefined,
        category: categoryFilter === "all" ? undefined : categoryFilter,
        status: statusFilter === "all" ? undefined : statusFilter,
      });
      const paginated = res as LaravelPaginated<Row>;
      setRows(paginated.data ?? []);
      setMeta(paginated);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Gagal memuat layanan tambahan.");
      setRows([]);
      setMeta(null);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, categoryFilter, statusFilter]);

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
          searchPlaceholder="Cari nama layanan…"
          searchValue={searchInput}
          onSearchChange={setSearchInput}
          filterLabel="Grup"
          filterValue={categoryFilter}
          onFilterChange={setCategoryFilter}
          filterOptions={ADDITIONAL_CATEGORY_FILTER_OPTIONS}
          filter2Label="Status"
          filter2Value={statusFilter}
          onFilter2Change={setStatusFilter}
          filter2Options={STATUS_FILTER_OPTIONS}
        />
      </div>
      {canManageMaster ? (
        <Button type="button" className="shrink-0 gap-1.5" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Tambah layanan
        </Button>
      ) : null}
    </div>
  );

  const handleDelete = async () => {
    if (deleteRow?.id == null) return;
    setDeleteLoading(true);
    try {
      await deleteAdminAdditionalService(Number(deleteRow.id));
      toast.success("Layanan tambahan berhasil dihapus.");
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
        title="Daftar Layanan Tambahan"
        description="Pickup, packing, handling, dan add-on lain."
        loading={loading}
        toolbar={toolbar}
      >
        <div className="overflow-x-auto -mx-1 px-1">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-14">No</TableHead>
                <TableHead className="min-w-[140px]">Nama</TableHead>
                <TableHead>Grup</TableHead>
                <TableHead className="text-right">Harga dasar</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className={actionsHeadClass}>
                  <span className="max-md:sr-only">Aksi</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((s, index) => {
                const id = String(s.id ?? "");
                const cat = String(s.category ?? "");
                const active = s.is_active !== false;
                return (
                  <TableRow key={id} className="group">
                    <TableCell className="tabular-nums text-muted-foreground">
                      {rowNumber(meta?.current_page ?? page, PER_PAGE, index)}
                    </TableCell>
                    <TableCell className="font-medium">{String(s.name ?? "")}</TableCell>
                    <TableCell>{categoryLabel(cat)}</TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {s.base_price != null
                        ? `Rp ${Number(s.base_price).toLocaleString("id-ID")}`
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <MasterActiveBadge active={active} />
                    </TableCell>
                    <TableCell className={cn(actionsCellClass, "p-2 text-right")}>
                      <div className="flex justify-end">
                        <MasterRowActions
                          entityLabel="layanan tambahan"
                          canManage={canManageMaster}
                          onView={() => {
                            setDialogRow(s);
                            setDialogMode("view");
                            setDialogOpen(true);
                          }}
                          onEdit={canManageMaster ? () => {
                            setDialogRow(s);
                            setDialogMode("edit");
                            setDialogOpen(true);
                          } : undefined}
                          onDelete={canManageMaster ? () => {
                            setDeleteRow(s);
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
              <TableCaption className="text-xs">Tidak ada data layanan tambahan.</TableCaption>
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

      <MasterAdditionalServiceDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        row={dialogRow}
        onSaved={() => void load()}
      />

      <ConfirmDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Hapus layanan tambahan?"
        description={`Yakin hapus "${String(deleteRow?.name ?? "")}"?`}
        loading={deleteLoading}
        onConfirm={handleDelete}
      />
    </>
  );
}
