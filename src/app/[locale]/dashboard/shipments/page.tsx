"use client";

import { useState } from "react";
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
import { PaginationBar } from "@/components/data-table/pagination-bar";
import { TableToolbar } from "@/components/data-table/table-toolbar";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { MoreHorizontal, Truck, Eye, Download } from "lucide-react";
import { SHIPMENT_STATUS_KEYS, shipmentStatusBadgeClass, shipmentStatusLabel } from "@/lib/shipment-status";
import { fetchCustomerShipments, fetchCustomerShipment, downloadCustomerConsignmentNotePdf } from "@/lib/customer-api";
import type { LaravelPaginated } from "@/lib/types-api";
import { ApiError } from "@/lib/api-client";
import { rowNumber } from "@/lib/list-query";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

type Row = Record<string, unknown>;

const SHIPMENT_STATUS_FILTERS = [
  { value: "all", label: "Semua status" },
  ...SHIPMENT_STATUS_KEYS.map((k) => ({
    value: k,
    label: shipmentStatusLabel(k),
  })),
];

export default function CustomerShipmentsPage() {
  const PER_PAGE = 10;
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 400);
  const [statusFilter, setStatusFilter] = useState("all");

  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailData, setDetailData] = useState<Record<string, unknown> | null>(null);

  const statusParam = statusFilter === "all" ? undefined : statusFilter;

  const {
    data: paginatedShipments,
    isLoading: isLoadingShipments,
    error: shipmentsError,
  } = useQuery({
    queryKey: ["customerShipments", page, debouncedSearch, statusParam],
    queryFn: async ({ signal }) => {
      const res = await fetchCustomerShipments(
        {
          page,
          perPage: PER_PAGE,
          search: debouncedSearch.trim() || undefined,
          status: statusParam,
        },
        signal
      );
      return res as LaravelPaginated<Row>;
    },
    placeholderData: (previousData) => previousData,
    staleTime: 1000 * 60 * 5, // 5 minutes stale time
  });

  const { data: totalAllShipmentsData } = useQuery({
    queryKey: ["customerShipmentsTotal"],
    queryFn: async ({ signal }) => {
      const res = await fetchCustomerShipments({ page: 1, perPage: 1 }, signal);
      return (res as LaravelPaginated<Row>).total;
    },
    staleTime: 1000 * 60 * 15, // 15 minutes stale time for total count
  });

  const rows = paginatedShipments?.data ?? [];
  const meta = paginatedShipments;
  const totalAllShipments = totalAllShipmentsData ?? null;
  const error = shipmentsError ? (shipmentsError instanceof ApiError ? shipmentsError.message : "Gagal memuat shipment.") : null;
  const loading = isLoadingShipments;



  const handleOpenDetail = async (id: number) => {
    setDetailDialogOpen(true);
    setDetailLoading(true);
    try {
      const res = await fetchCustomerShipment(id);
      // API mengembalikan objek dengan properti "data" jika menggunakan Laravel Resource
      const dataObj = res as { data?: Record<string, unknown> };
      setDetailData(dataObj.data ?? res);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Gagal memuat detail shipment.");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleDownloadCn = async (id: number, cnNumber: string) => {
    try {
      const blob = await downloadCustomerConsignmentNotePdf(id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `consignment-note-${cnNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("PDF Consignment Note berhasil diunduh.");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Gagal mengunduh PDF.");
    }
  };

  return (
    <div className="flex min-w-0 w-full flex-1 flex-col gap-6 md:px-2">
      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-900/5 text-zinc-900">
            <Truck className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-semibold tracking-tight text-zinc-900 sm:text-2xl">My Shipments</h1>
            <p className="mt-1 text-sm text-muted-foreground">Shipment perusahaan Anda.</p>
          </div>
        </div>
      </div>

      {error ? (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
      ) : null}

      <Card className="min-w-0 overflow-hidden">
        <CardHeader className="space-y-1">
          <CardTitle>My Shipments</CardTitle>
          <CardDescription>
            {totalAllShipments != null && totalAllShipments > 0
              ? `Total ${totalAllShipments} shipment perusahaan Anda.`
              : null}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 overflow-x-auto">
          <TableToolbar
            searchPlaceholder="Cari CN atau nomor shipment…"
            searchValue={searchInput}
            onSearchChange={setSearchInput}
            filterLabel="Status"
            filterValue={statusFilter}
            onFilterChange={setStatusFilter}
            filterOptions={SHIPMENT_STATUS_FILTERS}
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
                    <TableHead>Consignment Note (CN)</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Origin</TableHead>
                    <TableHead>Destination</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((shipment, index) => {
                    const id = Number(shipment.id);
                    const st = String(shipment.status ?? "");
                    const origin = (shipment.origin_location ?? shipment.originLocation) as
                      | { name?: string }
                      | undefined;
                    const dest = (shipment.destination_location ?? shipment.destinationLocation) as
                      | { name?: string }
                      | undefined;
                    const svc = (shipment.service_type ?? shipment.serviceType) as { name?: string } | undefined;
                    const cnNumber = String(shipment.waybill_number ?? shipment.shipment_number ?? "").replace(/^WB-/i, "CN-");
                    return (
                      <TableRow key={cnNumber || String(shipment.id)}>
                        <TableCell className="tabular-nums text-muted-foreground">
                          {rowNumber(meta?.current_page ?? page, PER_PAGE, index)}
                        </TableCell>
                        <TableCell className="font-mono text-xs">{cnNumber}</TableCell>
                        <TableCell>{svc?.name ?? "—"}</TableCell>
                        <TableCell>{origin?.name ?? "—"}</TableCell>
                        <TableCell>{dest?.name ?? "—"}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={shipmentStatusBadgeClass(st)}>
                            {shipmentStatusLabel(st)}
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
                              <DropdownMenuItem onClick={() => handleOpenDetail(id)}>
                                <Eye className="mr-2 h-4 w-4" />
                                Lihat Detail
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDownloadCn(id, cnNumber)}>
                                <Download className="mr-2 h-4 w-4" />
                                Download CN
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
                {rows.length === 0 ? (
                  <TableCaption className="text-xs">Belum ada shipment.</TableCaption>
                ) : (
                  <TableCaption className="text-xs">Baris pada halaman ini.</TableCaption>
                )}
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

      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detail Shipment {detailData?.shipment_number || detailData?.waybill_number ? `- ${String(detailData.waybill_number ?? detailData.shipment_number).replace(/^WB-/i, "CN-")}` : ""}</DialogTitle>
            <DialogDescription>
              Informasi lengkap untuk shipment ini.
            </DialogDescription>
          </DialogHeader>
          {detailLoading ? (
            <div className="space-y-4 py-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ) : detailData ? (
            <div className="space-y-6 py-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-muted-foreground">CN Number</p>
                  <p className="font-medium">{String(detailData.waybill_number ?? detailData.shipment_number ?? "—").replace(/^WB-/i, "CN-")}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <Badge variant="outline" className={shipmentStatusBadgeClass(String(detailData.status ?? ""))}>
                    {shipmentStatusLabel(String(detailData.status ?? ""))}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">Service</p>
                  <p className="font-medium">{((detailData.service_type ?? detailData.serviceType) as { name?: string } | undefined)?.name ?? "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Origin</p>
                  <p className="font-medium">{((detailData.origin_location ?? detailData.originLocation) as { name?: string } | undefined)?.name ?? "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Destination</p>
                  <p className="font-medium">{((detailData.destination_location ?? detailData.destinationLocation) as { name?: string } | undefined)?.name ?? "—"}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold text-base">Pengirim</h4>
                <div className="grid grid-cols-2 gap-2 p-3 bg-muted/50 rounded-md">
                  <div>
                    <p className="text-muted-foreground text-xs">Nama</p>
                    <p>{String((detailData.booking as Record<string, unknown> | undefined)?.shipper_name ?? "—")}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Telepon</p>
                    <p>{String((detailData.booking as Record<string, unknown> | undefined)?.shipper_phone ?? "—")}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-muted-foreground text-xs">Alamat</p>
                    <p>{String((detailData.booking as Record<string, unknown> | undefined)?.shipper_address ?? "—")}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-base">Penerima</h4>
                <div className="grid grid-cols-2 gap-2 p-3 bg-muted/50 rounded-md">
                  <div>
                    <p className="text-muted-foreground text-xs">Nama</p>
                    <p>{String((detailData.booking as Record<string, unknown> | undefined)?.consignee_name ?? "—")}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Telepon</p>
                    <p>{String((detailData.booking as Record<string, unknown> | undefined)?.consignee_phone ?? "—")}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-muted-foreground text-xs">Alamat</p>
                    <p>{String((detailData.booking as Record<string, unknown> | undefined)?.consignee_address ?? "—")}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-4 text-center text-muted-foreground">
              Data tidak ditemukan.
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
