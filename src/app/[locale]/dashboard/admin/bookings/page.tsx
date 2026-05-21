"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { bookingStatusBadgeClass, bookingStatusLabelFromApi } from "@/lib/booking-status";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/store";
import { useAuthPersistHydrated } from "@/lib/use-auth-hydrated";
import {
  fetchAdminBooking,
  fetchAdminBookings,
  rejectBooking,
  updateAdminBooking,
} from "@/lib/admin-api";
import { ApiError } from "@/lib/api-client";
import { rowNumber } from "@/lib/list-query";
import type { LaravelPaginated } from "@/lib/types-api";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import {
  ClipboardList,
  Plus,
} from "lucide-react";
import { useRouter } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";

import { BookingStats } from "@/components/dashboard/admin/bookings/booking-stats";
import { BookingActionsMenu } from "@/components/dashboard/admin/bookings/booking-actions-menu";
import { BookingDetailDialog } from "@/components/dashboard/admin/bookings/booking-detail-dialog";
import { BookingEditDialog } from "@/components/dashboard/admin/bookings/booking-edit-dialog";
import { BookingRejectDialog } from "@/components/dashboard/admin/bookings/booking-reject-dialog";
import type { BookingDetail } from "@/components/dashboard/admin/bookings/types";


const BOOKING_STATUS_FILTERS = [
  { value: "all", label: "Semua status" },
  { value: "draft", label: "Draft" },
  { value: "submitted", label: "Diajukan" },
  { value: "confirmed", label: "Terkonfirmasi" },
  { value: "approved", label: "Disetujui" },
  { value: "rejected", label: "Ditolak" },
  { value: "cancelled", label: "Dibatalkan" },
];

const actionsHeadClass =
  "w-12 max-md:sticky max-md:right-0 max-md:z-20 max-md:border-l max-md:border-border max-md:bg-card max-md:shadow-[-8px_0_12px_-8px_rgba(0,0,0,0.08)] md:static md:z-auto md:border-l-0 md:bg-transparent md:shadow-none text-right";

const actionsCellClass =
  "max-md:sticky max-md:right-0 max-md:z-10 max-md:border-l max-md:border-border max-md:bg-card max-md:shadow-[-8px_0_12px_-8px_rgba(0,0,0,0.08)] max-md:group-hover:bg-muted/50 md:static md:z-auto md:border-l-0 md:shadow-none md:group-hover:bg-transparent";

type BookingRow = {
  id: number;
  booking_number: string;
  status: string;
  shipment_exists?: boolean;
  shipment_id?: number | null;
  company?: { name?: string };
  origin_location?: { name?: string };
  destination_location?: { name?: string };
  service_type?: { name?: string; code?: string };
};

export default function AdminBookingsPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const authHydrated = useAuthPersistHydrated();
  const { user } = useAuthStore();
  const roles = user?.roles ?? [];
  const canProcessOperations =
    authHydrated && (roles.includes("super_admin") || roles.includes("operations"));

  const PER_PAGE = 10;
  const STATS_CAP = 1000;

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 400);
  const [statusFilter, setStatusFilter] = useState("all");

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailData, setDetailData] = useState<BookingDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailSaving, setDetailSaving] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editData, setEditData] = useState<BookingDetail | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editSaving, setEditSaving] = useState(false);

  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectId, setRejectId] = useState<number | null>(null);
  const [rejectSaving, setRejectSaving] = useState(false);

  const statusParam = statusFilter === "all" ? undefined : statusFilter;

  const {
    data: paginatedStatsBookings,
    refetch: refetchStats,
  } = useQuery({
    queryKey: ["adminBookingsStats", debouncedSearch, statusParam],
    queryFn: async ({ signal }) => {
      if (!mounted || !authHydrated) return null;
      const res = await fetchAdminBookings(
        {
          page: 1,
          perPage: STATS_CAP,
          search: debouncedSearch.trim() || undefined,
          status: statusParam,
        },
        signal
      );
      return res as LaravelPaginated<BookingRow>;
    },
    enabled: mounted && authHydrated,
    placeholderData: (previousData) => previousData,
    staleTime: 1000 * 60 * 5, // 5 minutes stale time
  });

  const {
    data: paginatedBookings,
    isLoading: isLoadingTable,
    error: tableError,
    refetch: refetchTable,
  } = useQuery({
    queryKey: ["adminBookingsTable", page, debouncedSearch, statusParam],
    queryFn: async ({ signal }) => {
      if (!mounted || !authHydrated) return null;
      const res = await fetchAdminBookings(
        {
          page,
          perPage: PER_PAGE,
          search: debouncedSearch.trim() || undefined,
          status: statusParam,
        },
        signal
      );
      return res as LaravelPaginated<BookingRow>;
    },
    enabled: mounted && authHydrated,
    placeholderData: (previousData) => previousData,
    staleTime: 1000 * 60 * 5, // 5 minutes stale time
  });

  const bookings = paginatedBookings?.data ?? [];
  const meta = paginatedBookings;
  const loadError = tableError ? (tableError instanceof ApiError ? tableError.message : "Gagal memuat booking") : null;
  const loadingTable = isLoadingTable;

  const statsRows = paginatedStatsBookings?.data ?? [];
  const statsMeta = paginatedStatsBookings;

  const reloadAll = useCallback(async () => {
    await refetchStats();
    await refetchTable();
  }, [refetchStats, refetchTable]);

  const submitReject = useCallback(async (reason: string) => {
    if (rejectId == null || !reason.trim()) return;
    setRejectSaving(true);
    try {
      await rejectBooking(rejectId, reason.trim());
      setRejectOpen(false);
      setRejectId(null);
      await reloadAll();
      toast.success("Booking ditolak.");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Gagal menolak.");
    } finally {
      setRejectSaving(false);
    }
  }, [rejectId, reloadAll]);

  const openBookingDetail = useCallback(async (id: number) => {
    setDetailOpen(true);
    setDetailLoading(true);
    setDetailData(null);
    try {
      const res = await fetchAdminBooking(id);
      setDetailData((res as { data: BookingDetail }).data);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Gagal memuat detail booking.");
      setDetailOpen(false);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const openBookingEdit = useCallback(async (id: number) => {
    setEditOpen(true);
    setEditLoading(true);
    setEditData(null);
    try {
      const res = await fetchAdminBooking(id);
      setEditData((res as { data: BookingDetail }).data);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Gagal memuat form edit booking.");
      setEditOpen(false);
    } finally {
      setEditLoading(false);
    }
  }, []);

  const submitDetailEdit = useCallback(async (payload: {
    departure_date: string | null;
    cargo_description: string | null;
    shipper_name: string | null;
    shipper_address: string | null;
    shipper_phone: string | null;
    consignee_name: string | null;
    consignee_address: string | null;
    consignee_phone: string | null;
  }) => {
    if (!detailData?.id) return;
    setDetailSaving(true);
    try {
      const res = await updateAdminBooking(detailData.id, payload);
      setDetailData((res as { data: BookingDetail }).data);
      await reloadAll();
      toast.success("Detail booking berhasil diperbarui.");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Gagal memperbarui booking.");
      throw e;
    } finally {
      setDetailSaving(false);
    }
  }, [detailData?.id, reloadAll]);

  const submitBookingEdit = useCallback(async (payload: FormData) => {
    if (!editData?.id) return;
    setEditSaving(true);
    try {
      const res = await updateAdminBooking(editData.id, payload);
      setEditData((res as { data: BookingDetail }).data);
      await reloadAll();
      toast.success("Booking berhasil diperbarui.");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Gagal memperbarui booking.");
      throw e;
    } finally {
      setEditSaving(false);
    }
  }, [editData?.id, reloadAll]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && authHydrated) void refetchStats();
  }, [mounted, authHydrated, refetchStats]);

  useEffect(() => {
    if (mounted && authHydrated) void refetchTable();
  }, [mounted, authHydrated, refetchTable]);

  if (!mounted) return null;

  const countDraft = statsRows.filter((b) => b.status.toLowerCase() === "draft").length;
  const countSubmitted = statsRows.filter((b) => b.status.toLowerCase() === "submitted").length;
  const countApproved = statsRows.filter((b) => b.status.toLowerCase() === "approved").length;
  const totalStats = statsMeta?.total ?? 0;

  return (
    <div className="flex min-w-0 w-full flex-1 flex-col gap-6 md:px-2">
      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-900/5 text-zinc-900">
            <ClipboardList className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-semibold tracking-tight text-zinc-900 sm:text-2xl">
              Booking Management
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Approval booking & konversi ke shipment.
            </p>
          </div>
        </div>
        {canProcessOperations && (
          <div className="flex w-full shrink-0 sm:w-auto sm:justify-end">
            <Button
              className="h-9 w-full gap-1.5 px-4 sm:w-auto"
              type="button"
              onClick={() => router.push("/dashboard/admin/bookings/create")}
            >
              <Plus className="h-4 w-4 shrink-0" />
              Tambah Booking
            </Button>
          </div>
        )}
      </div>

      {loadError ? (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{loadError}</p>
      ) : null}

      <BookingStats
        countDraft={countDraft}
        countSubmitted={countSubmitted}
        countApproved={countApproved}
        totalStats={totalStats}
      />

      <Card className="min-w-0 overflow-hidden">
        <CardHeader className="space-y-1">
          <CardTitle>Daftar Booking</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <TableToolbar
            searchPlaceholder="Cari nomor booking atau kargo…"
            searchValue={searchInput}
            onSearchChange={setSearchInput}
            filterLabel="Status"
            filterValue={statusFilter}
            onFilterChange={setStatusFilter}
            filterOptions={BOOKING_STATUS_FILTERS}
          />
          {loadingTable ? (
            <div className="space-y-3">
              {[...Array(PER_PAGE)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-14">No</TableHead>
                    <TableHead className="w-[120px]">Kode Booking</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Origin</TableHead>
                    <TableHead>Destination</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className={actionsHeadClass}>
                      <span className="max-md:sr-only">Aksi</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.map((booking, index) => (
                    <TableRow key={booking.id} className="group">
                      <TableCell className="tabular-nums text-muted-foreground">
                        {rowNumber(meta?.current_page ?? page, PER_PAGE, index)}
                      </TableCell>
                      <TableCell className="font-mono text-xs">{booking.booking_number}</TableCell>
                      <TableCell className="font-medium">{booking.company?.name ?? "—"}</TableCell>
                      <TableCell>{booking.origin_location?.name ?? "—"}</TableCell>
                      <TableCell>{booking.destination_location?.name ?? "—"}</TableCell>
                      <TableCell>{booking.service_type?.name ?? booking.service_type?.code ?? "—"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={bookingStatusBadgeClass(booking.status)}>
                          {bookingStatusLabelFromApi(booking.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className={cn(actionsCellClass, "p-2 text-right")}>
                        <div className="flex justify-end">
                          <BookingActionsMenu
                            booking={booking}
                            canProcessOperations={canProcessOperations}
                            onOpenDetail={openBookingDetail}
                            onOpenEdit={openBookingEdit}
                            onOpenReject={(id) => {
                              setRejectId(id);
                              setRejectOpen(true);
                            }}
                            onDone={reloadAll}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableCaption className="text-xs">
                  {bookings.length === 0 ? "Tidak ada data." : `${bookings.length} baris di halaman ini.`}
                </TableCaption>
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

      <BookingDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        loading={detailLoading}
        data={detailData}
        canEdit={false}
        saving={detailSaving}
        onSave={submitDetailEdit}
      />

      <BookingEditDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        data={editData}
        loading={editLoading}
        saving={editSaving}
        onSave={submitBookingEdit}
      />

      <BookingRejectDialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        loading={rejectSaving}
        onSubmit={(reason) => void submitReject(reason)}
      />
    </div>
  );
}
