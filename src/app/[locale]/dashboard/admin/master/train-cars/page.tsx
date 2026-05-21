"use client";

import { toast } from "sonner";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
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
import { deleteAdminTrainCar, fetchAdminTrainCars, fetchAdminTrains } from "@/lib/admin-api";
import type { LaravelPaginated } from "@/lib/types-api";
import { ApiError } from "@/lib/api-client";
import { rowNumber } from "@/lib/list-query";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { MasterRowActions } from "../_components/master-row-actions";
import { MasterTableShell } from "../_components/master-table-shell";
import { MasterActiveBadge } from "../_components/master-active-badge";
import { actionsCellClass, actionsHeadClass } from "../_components/master-table-classes";
import { STATUS_FILTER_OPTIONS } from "../_components/master-filters";
import { MasterTrainCarDialog } from "../_components/master-train-car-dialog";
import { useMasterOpenCreateFromQuery } from "../_components/use-master-open-create-from-query";
import { ConfirmDeleteDialog } from "@/components/dashboard/admin/confirm-delete-dialog";
import { Plus } from "lucide-react";
import type { SimpleDialogMode } from "../_components/master-transport-mode-dialog";

const PER_PAGE = 10;
const TRAIN_FETCH_LIMIT = 1000;

type Row = Record<string, unknown>;
type Train = { id: number; name: string };

function fmtNum(v: unknown): string {
  if (v == null || v === "") return "—";
  const n = Number(v);
  if (!Number.isFinite(n)) return String(v);
  return new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 }).format(n);
}

export default function MasterTrainCarsPage() {
  const authHydrated = useAuthPersistHydrated();
  const { user } = useAuthStore();
  const roles = user?.roles ?? [];
  const canManageMaster = authHydrated && (roles.includes("super_admin") || roles.includes("operations"));

  const [trains, setTrains] = useState<Train[]>([]);

  const [rows, setRows] = useState<Row[]>([]);
  const [meta, setMeta] = useState<LaravelPaginated<Row> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const searchParams = useSearchParams();
  const initialTrainId = searchParams.get("train_id");

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 400);
  const [statusFilter, setStatusFilter] = useState("all");
  const [trainFilter, setTrainFilter] = useState(initialTrainId || "all");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<SimpleDialogMode>("create");
  const [dialogRow, setDialogRow] = useState<Row | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteRow, setDeleteRow] = useState<Row | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const trainFilterOptions = useMemo(() => {
    return [
      { value: "all", label: "Semua kereta" },
      ...trains.map((t) => ({ value: String(t.id), label: t.name })),
    ];
  }, [trains]);

  useEffect(() => {
    if (!authHydrated) return;
    let c = false;
    (async () => {
      try {
        const res = await fetchAdminTrains({ page: 1, perPage: TRAIN_FETCH_LIMIT, status: "active" });
        if (c) return;
        setTrains(((res as LaravelPaginated<Train>).data ?? []) as Train[]);
      } catch {
        if (!c) setTrains([]);
      }
    })();
    return () => {
      c = true;
    };
  }, [authHydrated]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, trainFilter]);

  const trainIdParam =
    trainFilter !== "all" && Number.isFinite(Number(trainFilter)) ? Number(trainFilter) : undefined;

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetchAdminTrainCars({
        page,
        perPage: PER_PAGE,
        search: debouncedSearch.trim() || undefined,
        status: statusFilter === "all" ? undefined : statusFilter,
        trainId: trainIdParam,
      });
      const paginated = res as LaravelPaginated<Row>;
      setRows(paginated.data ?? []);
      setMeta(paginated);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Gagal memuat gerbong.");
      setRows([]);
      setMeta(null);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, statusFilter, trainIdParam]);

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
          searchPlaceholder="Cari kode atau nama gerbong…"
          searchValue={searchInput}
          onSearchChange={setSearchInput}
          filterLabel="Kereta"
          filterValue={trainFilter}
          onFilterChange={setTrainFilter}
          filterOptions={trainFilterOptions}
          filter2Label="Status"
          filter2Value={statusFilter}
          onFilter2Change={setStatusFilter}
          filter2Options={STATUS_FILTER_OPTIONS}
        />
      </div>
      {canManageMaster ? (
        <Button type="button" className="shrink-0 gap-1.5" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Tambah gerbong
        </Button>
      ) : null}
    </div>
  );

  const handleDelete = async () => {
    if (deleteRow?.id == null) return;
    setDeleteLoading(true);
    try {
      await deleteAdminTrainCar(Number(deleteRow.id));
      toast.success("Gerbong berhasil dihapus.");
      setDeleteOpen(false);
      setDeleteRow(null);
      await load();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Gagal menghapus.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const defaultTrainIdForCreate = trainIdParam ?? (trains[0]?.id ?? undefined);

  return (
    <>
      {error ? (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
      ) : null}

      <MasterTableShell title="Daftar Gerbong" description="Master gerbong untuk kereta." loading={loading} toolbar={toolbar}>
        <div className="overflow-x-auto -mx-1 px-1">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-14">No</TableHead>
                <TableHead>Kereta</TableHead>
                <TableHead className="w-[120px]">Kode</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead className="w-[130px] text-right">Kapasitas (kg)</TableHead>
                <TableHead className="w-[120px] text-right">Kapasitas (cbm)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className={actionsHeadClass}>
                  <span className="max-md:sr-only">Aksi</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((c, index) => {
                const code = String(c.code ?? c.id ?? "");
                const active = c.is_active !== false;
                const trainName =
                  typeof c.train === "object" && c.train != null ? String((c.train as { name?: unknown }).name ?? "") : "";
                return (
                  <TableRow key={String(c.id ?? code)} className="group">
                    <TableCell className="tabular-nums text-muted-foreground">
                      {rowNumber(meta?.current_page ?? page, PER_PAGE, index)}
                    </TableCell>
                    <TableCell className="font-medium">{trainName || "—"}</TableCell>
                    <TableCell className="font-mono text-xs">{code}</TableCell>
                    <TableCell className="font-medium">{String(c.name ?? "")}</TableCell>
                    <TableCell className="text-right tabular-nums">{fmtNum(c.capacity_weight)}</TableCell>
                    <TableCell className="text-right tabular-nums">{fmtNum(c.capacity_cbm)}</TableCell>
                    <TableCell>
                      <MasterActiveBadge active={active} />
                    </TableCell>
                    <TableCell className={cn(actionsCellClass, "p-2 text-right")}>
                      <div className="flex justify-end">
                        <MasterRowActions
                          entityLabel="gerbong"
                          canManage={canManageMaster}
                          onView={() => {
                            setDialogRow(c);
                            setDialogMode("view");
                            setDialogOpen(true);
                          }}
                          onEdit={
                            canManageMaster
                              ? () => {
                                  setDialogRow(c);
                                  setDialogMode("edit");
                                  setDialogOpen(true);
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
              <TableCaption className="text-xs">Tidak ada data gerbong.</TableCaption>
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

      <MasterTrainCarDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        row={dialogRow}
        trains={trains}
        defaultTrainId={defaultTrainIdForCreate}
        onSaved={() => void load()}
      />

      <ConfirmDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Hapus gerbong?"
        description={`Yakin hapus gerbong "${String(deleteRow?.name ?? "")}"? Tindakan ini tidak dapat dibatalkan.`}
        loading={deleteLoading}
        onConfirm={handleDelete}
      />
    </>
  );
}

