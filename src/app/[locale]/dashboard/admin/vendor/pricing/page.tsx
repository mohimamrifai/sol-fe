"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  DialogFooter,
} from "@/components/ui/dialog";
import { Eye, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { PaginationBar } from "@/components/data-table/pagination-bar";
import { Button, buttonVariants } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { VendorPricingDialog } from "@/components/dashboard/admin/vendor-pricing-dialog";
import { VendorServiceDialog } from "@/components/dashboard/admin/vendor-service-dialog";
import { ConfirmDeleteDialog } from "@/components/dashboard/admin/confirm-delete-dialog";
import { fetchAdminVendor, fetchAdminVendors, deleteAdminPricing } from "@/lib/admin-api";
import type { LaravelPaginated } from "@/lib/types-api";
import { ApiError } from "@/lib/api-client";
import { rowNumber } from "@/lib/list-query";
import { useAuthPersistHydrated } from "@/lib/use-auth-hydrated";
import {
  buildPricingRowsFromVendorDetail,
  priceTypeLabel,
  type PricingRow,
} from "../_components/build-pricing-rows";

type VendorRow = Record<string, unknown>;

function vendorServiceLabel(vs: Record<string, unknown>): string {
  const o = vs.origin_location as { code?: string; name?: string } | undefined;
  const d = vs.destination_location as { code?: string; name?: string } | undefined;
  const st = vs.service_type as { name?: string } | undefined;
  const lane = [o?.code ?? o?.name, d?.code ?? d?.name].filter(Boolean).join(" → ") || "—";
  return `${lane} · ${st?.name ?? "—"}`;
}

const PRICING_PER_PAGE = 10;
const VENDOR_OPTIONS_CAP = 500;

export default function AdminVendorPricingPage() {
  const authHydrated = useAuthPersistHydrated();

  const [vendorOptions, setVendorOptions] = useState<VendorRow[]>([]);
  const [vendorPickSearch, setVendorPickSearch] = useState("");
  const [selectedVendorId, setSelectedVendorId] = useState("");
  const [pricingVendorLabel, setPricingVendorLabel] = useState("");

  const [pricingRows, setPricingRows] = useState<PricingRow[]>([]);
  const [pricingPage, setPricingPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [vendorServicesRaw, setVendorServicesRaw] = useState<Record<string, unknown>[]>([]);
  const [serviceDialogOpen, setServiceDialogOpen] = useState(false);
  const [pricingDialogOpen, setPricingDialogOpen] = useState(false);
  const [pricingDialogMode, setPricingDialogMode] = useState<"create" | "edit">("create");
  const [pricingDialogRow, setPricingDialogRow] = useState<Record<string, unknown> | null>(null);
  
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewDialogRow, setViewDialogRow] = useState<PricingRow | null>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteDialogRow, setDeleteDialogRow] = useState<PricingRow | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadPricingForVendor = useCallback(async (vendorId: number, label: string) => {
    setDetailLoading(true);
    setError(null);
    try {
      const detail = await fetchAdminVendor(vendorId);
      const v = detail.data as Record<string, unknown>;
      setPricingRows(buildPricingRowsFromVendorDetail(v));
      const vss = (v.vendor_services as Record<string, unknown>[] | undefined) ?? [];
      setVendorServicesRaw(vss);
      setPricingVendorLabel(label);
      setPricingPage(1);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Gagal memuat detail vendor.");
      setPricingRows([]);
      setVendorServicesRaw([]);
      setPricingVendorLabel("");
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authHydrated) return;
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetchAdminVendors({ page: 1, perPage: VENDOR_OPTIONS_CAP });
        const list = (res as LaravelPaginated<VendorRow>).data ?? [];
        if (cancelled) return;
        setVendorOptions(list);
        if (list.length > 0) {
          const first = list[0];
          const id = Number(first.id);
          if (Number.isFinite(id)) {
            setSelectedVendorId(String(id));
            await loadPricingForVendor(id, String(first.name ?? first.code ?? "—"));
          }
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof ApiError ? e.message : "Gagal memuat daftar vendor.");
          setVendorOptions([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authHydrated, loadPricingForVendor]);

  const displayVendorOptions = useMemo(() => {
    const q = vendorPickSearch.trim().toLowerCase();
    let list = !q
      ? vendorOptions
      : vendorOptions.filter(
          (v) =>
            String(v.name ?? "")
              .toLowerCase()
              .includes(q) ||
            String(v.code ?? "")
              .toLowerCase()
              .includes(q)
        );
    if (selectedVendorId && !list.some((v) => String(v.id) === selectedVendorId)) {
      const sel = vendorOptions.find((v) => String(v.id) === selectedVendorId);
      if (sel) list = [sel, ...list];
    }
    return list;
  }, [vendorOptions, vendorPickSearch, selectedVendorId]);

  const pricingMeta = useMemo(() => {
    const total = pricingRows.length;
    const lastPage = Math.max(1, Math.ceil(total / PRICING_PER_PAGE));
    const currentPage = Math.min(Math.max(1, pricingPage), lastPage);
    const start = (currentPage - 1) * PRICING_PER_PAGE;
    const slice = pricingRows.slice(start, start + PRICING_PER_PAGE);
    const from = total === 0 ? null : start + 1;
    const to = total === 0 ? null : start + slice.length;
    return { total, lastPage, currentPage, slice, from, to };
  }, [pricingRows, pricingPage]);

  const pricingSlice = pricingMeta.slice;

  const selectedVendorNumericId = selectedVendorId ? Number(selectedVendorId) : null;
  const vendorServiceOptions = useMemo(
    () =>
      vendorServicesRaw.map((vs) => {
        const st = vs.service_type as { name?: string } | undefined;
        return {
          id: Number(vs.id),
          label: vendorServiceLabel(vs),
          serviceType: st?.name,
        };
      }),
    [vendorServicesRaw]
  );

  const onVendorChange = (value: string | null) => {
    if (value == null) return;
    setSelectedVendorId(value);
    const row = vendorOptions.find((x) => String(x.id) === value);
    const id = Number(value);
    const label = row ? String(row.name ?? row.code ?? "—") : "—";
    void loadPricingForVendor(id, label);
  };

  const handleDelete = async () => {
    if (!deleteDialogRow?.raw?.id) return;
    setDeleteLoading(true);
    try {
      await deleteAdminPricing(Number(deleteDialogRow.raw.id));
      toast.success("Tarif berhasil dihapus.");
      setDeleteDialogOpen(false);
      setDeleteDialogRow(null);
      if (selectedVendorNumericId) {
        void loadPricingForVendor(selectedVendorNumericId, pricingVendorLabel);
      }
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Gagal menghapus tarif.");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <>
      <VendorServiceDialog
        open={serviceDialogOpen}
        onOpenChange={setServiceDialogOpen}
        vendorId={selectedVendorNumericId}
        onSaved={() => {
          const id = selectedVendorNumericId;
          if (id != null) void loadPricingForVendor(id, pricingVendorLabel || "—");
        }}
      />
      <VendorPricingDialog
        open={pricingDialogOpen}
        onOpenChange={setPricingDialogOpen}
        mode={pricingDialogMode}
        row={pricingDialogRow}
        vendorServiceOptions={vendorServiceOptions}
        onSaved={() => {
          const id = selectedVendorNumericId;
          if (id != null) void loadPricingForVendor(id, pricingVendorLabel || "—");
        }}
      />
      {error ? (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
      ) : null}

      <Card className="min-w-0 overflow-hidden">
        <CardHeader className="space-y-1">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <CardTitle>Pricing</CardTitle>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={!selectedVendorNumericId || detailLoading}
                onClick={() => setServiceDialogOpen(true)}
              >
                Tambah layanan vendor
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={
                  !selectedVendorNumericId || detailLoading || vendorServiceOptions.length === 0
                }
                onClick={() => {
                  setPricingDialogMode("create");
                  setPricingDialogRow(null);
                  setPricingDialogOpen(true);
                }}
              >
                Tambah tarif
              </Button>
            </div>
          </div>
          <CardDescription className="space-y-2 text-pretty">
            <span className="block">
              Harga di sistem ini disimpan per vendor: satu respons API berisi detail vendor, layanan, dan tarif.
              Dropdown memilih vendor mana yang ingin ditinjau; tabel di bawah memuat data harga untuk vendor tersebut.
            </span>
            {pricingVendorLabel ? (
              <span className="block text-foreground">
                Menampilkan ringkasan untuk: {pricingVendorLabel}
              </span>
            ) : null}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-border bg-muted/30 px-3 py-3 sm:max-w-lg">
            <p className="text-xs font-medium text-foreground">Pilih vendor</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Cari lalu pilih vendor. Tarif diambil dari endpoint detail vendor (vendor services + pricing).
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:max-w-md">
            <Label htmlFor="vendor-pick-search" className="text-xs text-muted-foreground">
              Cari vendor (nama / kode)
            </Label>
            <Input
              id="vendor-pick-search"
              value={vendorPickSearch}
              onChange={(e) => setVendorPickSearch(e.target.value)}
              placeholder="Filter daftar di bawah…"
              className="h-9"
              disabled={loading || vendorOptions.length === 0}
            />
            <Label className="text-xs text-muted-foreground">Vendor</Label>
            <Select
              value={selectedVendorId}
              onValueChange={onVendorChange}
              disabled={loading || vendorOptions.length === 0}
            >
              <SelectTrigger className="h-9 w-full sm:max-w-md">
                <SelectValue placeholder={loading ? "Memuat…" : "Pilih vendor"}>
                  {selectedVendorId
                    ? (() => {
                        const sel = vendorOptions.find((v) => String(v.id) === selectedVendorId);
                        return sel ? String(sel.name ?? sel.code ?? "—") : undefined;
                      })()
                    : undefined}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {displayVendorOptions.map((v) => {
                  const id = String(v.id ?? "");
                  return (
                    <SelectItem key={id} value={id}>
                      {String(v.name ?? v.code ?? "—")}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            {!loading && vendorOptions.length === 0 ? (
              <p className="text-sm text-muted-foreground">Belum ada vendor di sistem.</p>
            ) : null}
          </div>

          {loading ? (
            <p className="text-sm text-muted-foreground">Memuat…</p>
          ) : (
            <>
              {detailLoading ? (
                <p className="text-sm text-muted-foreground">Memuat pricing…</p>
              ) : null}
              <div
                className={`-mx-1 overflow-x-auto px-1 transition-opacity ${detailLoading ? "pointer-events-none opacity-50" : ""}`}
              >
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">No</TableHead>
                      <TableHead>Lane</TableHead>
                      <TableHead>Service</TableHead>
                      <TableHead
                        className="text-xs"
                        title="Tipe harga beli/jual dari sistem"
                      >
                        Tipe harga
                      </TableHead>
                      <TableHead className="min-w-48">Komponen tarif</TableHead>
                      <TableHead className="w-16 text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pricingSlice.map((row, index) => (
                      <TableRow key={`${row.lane}-${row.priceType}-${index}-${pricingMeta.currentPage}`}>
                        <TableCell className="tabular-nums text-muted-foreground">
                          {rowNumber(pricingMeta.currentPage, PRICING_PER_PAGE, index)}
                        </TableCell>
                        <TableCell>{row.lane}</TableCell>
                        <TableCell>{row.service}</TableCell>
                        <TableCell className="text-xs">{priceTypeLabel(row.priceType)}</TableCell>
                        <TableCell className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                          {row.detail}
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
                                onClick={() => {
                                  setViewDialogRow(row);
                                  setViewDialogOpen(true);
                                }}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                Detail
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="cursor-pointer"
                                onClick={() => {
                                  setPricingDialogMode("edit");
                                  setPricingDialogRow({ ...row.raw, vendor_service_id: row.vsId });
                                  setPricingDialogOpen(true);
                                }}
                              >
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="cursor-pointer text-destructive"
                                onClick={() => {
                                  setDeleteDialogRow(row);
                                  setDeleteDialogOpen(true);
                                }}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Hapus
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  {pricingRows.length === 0 ? (
                    <TableCaption className="text-xs">Tidak ada pricing untuk vendor ini.</TableCaption>
                  ) : (
                    <TableCaption className="text-xs">Sumber: GET /api/admin/vendors/{`{id}`}.</TableCaption>
                  )}
                </Table>
              </div>
              {pricingRows.length > PRICING_PER_PAGE ? (
                <PaginationBar
                  currentPage={pricingMeta.currentPage}
                  lastPage={pricingMeta.lastPage}
                  total={pricingMeta.total}
                  from={pricingMeta.from}
                  to={pricingMeta.to}
                  onPageChange={setPricingPage}
                />
              ) : null}
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto" showCloseButton>
          <DialogHeader>
            <DialogTitle>Detail Tarif Vendor</DialogTitle>
          </DialogHeader>
          {viewDialogRow ? (
            <div className="grid grid-cols-3 gap-3 px-1 text-sm max-h-[65vh] overflow-y-auto">
              <div className="text-muted-foreground">Lane</div>
              <div className="col-span-2 font-medium">{viewDialogRow.lane}</div>

              <div className="text-muted-foreground">Service</div>
              <div className="col-span-2 font-medium">{viewDialogRow.service}</div>

              <div className="text-muted-foreground">Tipe Harga</div>
              <div className="col-span-2 font-medium">{priceTypeLabel(viewDialogRow.priceType)}</div>

              <div className="text-muted-foreground">Komponen Tarif</div>
              <div className="col-span-2 whitespace-pre-line font-medium leading-relaxed">
                {viewDialogRow.detail}
              </div>

              <div className="text-muted-foreground">Berlaku Dari</div>
              <div className="col-span-2 font-medium">
                {viewDialogRow.raw?.effective_from ? String(viewDialogRow.raw.effective_from).slice(0, 10) : "—"}
              </div>

              <div className="text-muted-foreground">Berlaku S/d</div>
              <div className="col-span-2 font-medium">
                {viewDialogRow.raw?.effective_to ? String(viewDialogRow.raw.effective_to).slice(0, 10) : "—"}
              </div>

              <div className="text-muted-foreground">Status Aktif</div>
              <div className="col-span-2 font-medium">
                {viewDialogRow.raw?.is_active === false ? (
                  <span className="text-red-600">Tidak Aktif</span>
                ) : (
                  <span className="text-green-600">Aktif</span>
                )}
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setViewDialogOpen(false)}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Hapus Tarif?"
        description={`Yakin ingin menghapus tarif untuk layanan ${deleteDialogRow?.service} (${priceTypeLabel(deleteDialogRow?.priceType ?? "")})?`}
        loading={deleteLoading}
        onConfirm={handleDelete}
      />
    </>
  );
}
