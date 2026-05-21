"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PaginationBar } from "@/components/data-table/pagination-bar";
import { TableToolbar } from "@/components/data-table/table-toolbar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ClipboardList, Trash2, Eye, Pencil, MoreHorizontal, RefreshCw } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BOOKING_STATUS_KEYS,
  bookingStatusBadgeClass,
  bookingStatusLabelFromApi,
} from "@/lib/booking-status";
import { fetchCustomerBookings, cancelCustomerBooking } from "@/lib/customer-api";
import type { LaravelPaginated } from "@/lib/types-api";
import { ApiError } from "@/lib/api-client";
import { rowNumber } from "@/lib/list-query";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useRouter } from "@/i18n/routing";
import { useQuery } from "@tanstack/react-query";
import { BookingDetailDialog } from "@/components/dashboard/admin/bookings/booking-detail-dialog";
import { BookingEditDialog } from "@/components/dashboard/admin/bookings/booking-edit-dialog";
import type { BookingDetail } from "@/components/dashboard/admin/bookings/types";
import { updateCustomerBooking, fetchCustomerBookingDetail } from "@/lib/customer-api";

type Row = Record<string, unknown>;

const STATUS_FILTERS = [
  { value: "all", label: "Semua status" },
  ...BOOKING_STATUS_KEYS.map((k) => ({
    value: k,
    label: bookingStatusLabelFromApi(k),
  })),
];

const CANCEL_REASONS = [
  "Salah pilih layanan / rute",
  "Kargo tidak jadi dikirim",
  "Mendapat harga lebih murah di tempat lain",
  "Ingin mengubah detail yang tidak bisa diedit",
  "Lainnya"
];

export default function MyBookingsPage() {
  const router = useRouter();
  const PER_PAGE = 10;
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 400);
  const [statusFilter, setStatusFilter] = useState("all");

  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [cancelReasonType, setCancelReasonType] = useState<string>("");
  const [cancelReasonOther, setCancelReasonOther] = useState("");
  const [submittingCancel, setSubmittingCancel] = useState(false);

  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [detailId, setDetailId] = useState<number | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailData, setDetailData] = useState<BookingDetail | null>(null);

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [submittingEdit, setSubmittingEdit] = useState(false);

  const {
    data: paginatedBookings,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["customerBookings", page, debouncedSearch, statusFilter],
    queryFn: async ({ signal }) => {
      const res = await fetchCustomerBookings(
        {
          page,
          perPage: PER_PAGE,
          search: debouncedSearch.trim() || undefined,
          status: statusFilter === "all" ? undefined : statusFilter,
        },
        signal
      );
      return res as LaravelPaginated<Row>;
    },
    placeholderData: (previousData) => previousData,
    staleTime: 1000 * 60 * 5, // 5 minutes stale time
  });

  const rows = paginatedBookings?.data ?? [];
  const meta = paginatedBookings;
  const loading = isLoading;
  const loadError = error
    ? error instanceof ApiError
      ? error.message
      : error instanceof Error
        ? error.message
        : "Gagal memuat data booking."
    : null;

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter]);

  const handleCancelRequest = async () => {
    if (!cancellingId) return;
    const finalReason = cancelReasonType === "Lainnya" ? cancelReasonOther : cancelReasonType;
    if (!finalReason.trim()) {
      toast.error("Alasan pembatalan wajib diisi.");
      return;
    }
    setSubmittingCancel(true);
    try {
      await cancelCustomerBooking(cancellingId, finalReason.trim());
      toast.success("Booking berhasil dibatalkan.");
      void refetch();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Gagal membatalkan booking.");
    } finally {
      setSubmittingCancel(false);
      setCancellingId(null);
      setCancelReasonType("");
      setCancelReasonOther("");
    }
  };

  const handleOpenDetail = async (id: number) => {
    setDetailId(id);
    setDetailDialogOpen(true);
    setDetailLoading(true);
    setDetailData(null);
    try {
      const res = await fetchCustomerBookingDetail(id);
      setDetailData((res as { data: BookingDetail }).data);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Gagal memuat detail booking.");
      setDetailDialogOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleOpenEdit = async (id: number) => {
    setDetailId(id);
    setEditDialogOpen(true);
    setDetailLoading(true);
    setDetailData(null);
    try {
      const res = await fetchCustomerBookingDetail(id);
      setDetailData((res as { data: BookingDetail }).data);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Gagal memuat detail booking.");
      setEditDialogOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleSaveEdit = async (payload: FormData) => {
    if (!detailId) return;
    setSubmittingEdit(true);
    try {
      await updateCustomerBooking(detailId, payload);
      toast.success("Booking berhasil diperbarui.");
      void refetch();
    } catch (e) {
      throw e;
    } finally {
      setSubmittingEdit(false);
    }
  };

  return (
    <div className="flex min-w-0 w-full flex-1 flex-col gap-6 md:px-2">
      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-900/5 text-zinc-900">
            <ClipboardList className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-semibold tracking-tight text-zinc-900 sm:text-2xl">My Bookings</h1>
            <p className="mt-1 text-sm text-muted-foreground">Histori pemesanan kargo Anda.</p>
          </div>
        </div>
      </div>

      {loadError ? (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{loadError}</p>
      ) : null}

      <Card className="min-w-0 overflow-hidden">
        <CardHeader className="space-y-1">
          <CardTitle>Histori Booking</CardTitle>
          <CardDescription>Daftar semua permintaan booking yang telah Anda ajukan.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 overflow-x-auto">
          <TableToolbar
            searchPlaceholder="Cari nomor booking…"
            searchValue={searchInput}
            onSearchChange={setSearchInput}
            filterLabel="Status"
            filterValue={statusFilter}
            onFilterChange={setStatusFilter}
            filterOptions={STATUS_FILTERS}
          />
          {loading ? (
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
                    <TableHead>Booking #</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Rute</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-20 text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((booking, index) => {
                    const st = String(booking.status ?? "");
                    const origin = (booking.origin_location ?? booking.originLocation) as { name?: string; code?: string } | undefined;
                    const dest = (booking.destination_location ?? booking.destinationLocation) as { name?: string; code?: string } | undefined;
                    const svc = (booking.service_type ?? booking.serviceType) as { name?: string } | undefined;
                    const bNum = String(booking.booking_number ?? "");
                    const canEdit = st === "submitted";
                    const canCancel = st === "submitted" || (st === "approved" && !booking.shipment);

                    return (
                      <TableRow key={booking.id as number}>
                        <TableCell className="tabular-nums text-muted-foreground">
                          {rowNumber(meta?.current_page ?? page, PER_PAGE, index)}
                        </TableCell>
                        <TableCell className="font-mono text-xs font-medium">{bNum}</TableCell>
                        <TableCell className="text-xs">
                          {booking.created_at ? new Date(booking.created_at as string).toLocaleDateString("id-ID") : "—"}
                        </TableCell>
                        <TableCell className="text-xs">
                          <div className="flex flex-col">
                            <span className="font-medium">{origin?.code ?? "—"}</span>
                            <span className="text-[10px] text-muted-foreground">→ {dest?.code ?? "—"}</span>
                          </div>
                        </TableCell>
                        <TableCell>{svc?.name ?? "—"}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={bookingStatusBadgeClass(st)}>
                            {bookingStatusLabelFromApi(st)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), "shrink-0")}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                className="cursor-pointer"
                                onClick={() => handleOpenDetail(Number(booking.id))}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                Detail
                              </DropdownMenuItem>
                              
                              {canEdit && (
                                <DropdownMenuItem
                                  className="cursor-pointer"
                                  onClick={() => handleOpenEdit(Number(booking.id))}
                                >
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                              )}

                              {st === "cancelled" && (
                                <DropdownMenuItem
                                  className="cursor-pointer"
                                  onClick={() => router.push(`/dashboard/booking/create?rebook=${booking.id}`)}
                                >
                                  <RefreshCw className="mr-2 h-4 w-4" />
                                  Ajukan Ulang
                                </DropdownMenuItem>
                              )}

                              {canCancel && (
                                <DropdownMenuItem
                                  className="cursor-pointer text-red-600 focus:text-red-700"
                                  onClick={() => setCancellingId(booking.id as number)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Batalkan
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
                {rows.length === 0 && (
                  <TableCaption className="text-xs py-4">Belum ada data booking.</TableCaption>
                )}
              </Table>
              {meta && (
                <PaginationBar
                  currentPage={meta.current_page}
                  lastPage={meta.last_page}
                  total={meta.total}
                  from={meta.from}
                  to={meta.to}
                  onPageChange={setPage}
                />
              )}
            </>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!cancellingId} onOpenChange={(o) => {
        if (!o) {
          setCancellingId(null);
          setCancelReasonType("");
          setCancelReasonOther("");
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Batalkan Booking?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin membatalkan permintaan booking ini? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cancel-reason-type" className="text-xs font-medium">Pilih Alasan Pembatalan</Label>
              <Select value={cancelReasonType} onValueChange={(val) => setCancelReasonType(val || "")} disabled={submittingCancel}>
                <SelectTrigger id="cancel-reason-type" className="w-full">
                  <SelectValue placeholder="Pilih alasan..." />
                </SelectTrigger>
                <SelectContent className="w-full">
                  {CANCEL_REASONS.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {cancelReasonType === "Lainnya" && (
              <div className="space-y-2">
                <Label htmlFor="cancel-reason-other" className="text-xs font-medium">Alasan Spesifik</Label>
                <Input
                  id="cancel-reason-other"
                  placeholder="Ketikkan alasan pembatalan Anda..."
                  value={cancelReasonOther}
                  onChange={(e) => setCancelReasonOther(e.target.value)}
                  disabled={submittingCancel}
                />
              </div>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submittingCancel}>Kembali</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={(e) => {
                e.preventDefault();
                void handleCancelRequest();
              }}
              disabled={submittingCancel}
            >
              {submittingCancel ? "Membatalkan…" : "Ya, Batalkan"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <BookingDetailDialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        loading={detailLoading}
        data={detailData}
      />

      <BookingEditDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        loading={detailLoading}
        saving={submittingEdit}
        data={detailData}
        onSave={handleSaveEdit}
      />
    </div>
  );
}
