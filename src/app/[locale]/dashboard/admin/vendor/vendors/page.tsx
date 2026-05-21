"use client";

import { toast } from "sonner";
import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
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
import { Button } from "@/components/ui/button";
import { PaginationBar } from "@/components/data-table/pagination-bar";
import { TableToolbar } from "@/components/data-table/table-toolbar";
import { useAuthPersistHydrated } from "@/lib/use-auth-hydrated";
import { deleteAdminVendor, fetchAdminVendor, fetchAdminVendors } from "@/lib/admin-api";
import type { LaravelPaginated } from "@/lib/types-api";
import { ApiError } from "@/lib/api-client";
import { rowNumber } from "@/lib/list-query";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { VendorFormDialog } from "@/components/dashboard/admin/vendor-form-dialog";
import { ConfirmDeleteDialog } from "@/components/dashboard/admin/confirm-delete-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Eye } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type VendorRow = Record<string, unknown>;

const VENDOR_PER_PAGE = 10;

export default function AdminVendorListPage() {
  const authHydrated = useAuthPersistHydrated();
  const searchParams = useSearchParams();

  const [vendors, setVendors] = useState<VendorRow[]>([]);
  const [vendorMeta, setVendorMeta] = useState<LaravelPaginated<VendorRow> | null>(null);
  const [vendorPage, setVendorPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 400);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [formRow, setFormRow] = useState<VendorRow | null>(null);

  const [viewOpen, setViewOpen] = useState(false);
  const [viewRow, setViewRow] = useState<VendorRow | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteRow, setDeleteRow] = useState<VendorRow | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    if (searchParams.get("create") === "1") {
      setFormRow(null);
      setFormMode("create");
      setFormOpen(true);
      const url = new URL(window.location.href);
      url.searchParams.delete("create");
      window.history.replaceState({}, "", url.toString());
    }
  }, [searchParams]);

  useEffect(() => {
    setVendorPage(1);
  }, [debouncedSearch]);

  const load = useCallback(async () => {
    if (!authHydrated) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetchAdminVendors({
        page: vendorPage,
        perPage: VENDOR_PER_PAGE,
        search: debouncedSearch.trim() || undefined,
      });
      const paginated = res as LaravelPaginated<VendorRow>;
      setVendors(paginated.data ?? []);
      setVendorMeta(paginated);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Gagal memuat vendor.");
      setVendors([]);
      setVendorMeta(null);
    } finally {
      setLoading(false);
    }
  }, [authHydrated, vendorPage, debouncedSearch]);

  useEffect(() => {
    void load();
  }, [load]);

  const openView = async (v: VendorRow) => {
    if (v.id == null) return;
    try {
      const d = await fetchAdminVendor(Number(v.id));
      setViewRow((d as { data: VendorRow }).data);
      setViewOpen(true);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Gagal memuat detail.");
    }
  };

  const handleDelete = async () => {
    if (deleteRow?.id == null) return;
    setDeleteLoading(true);
    try {
      await deleteAdminVendor(Number(deleteRow.id));
      toast.success("Vendor berhasil dihapus.");
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

      <Card className="min-w-0 overflow-hidden">
        <CardHeader>
          <CardTitle>Daftar Vendor</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <TableToolbar
            searchPlaceholder="Cari kode atau nama vendor…"
            searchValue={searchInput}
            onSearchChange={setSearchInput}
          />
          {loading ? (
            <p className="text-sm text-muted-foreground">Memuat…</p>
          ) : (
            <>
              <div className="overflow-x-auto -mx-1 px-1">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">No</TableHead>
                      <TableHead>Kode</TableHead>
                      <TableHead>Nama Vendor</TableHead>
                      <TableHead className="text-right">Jumlah Layanan</TableHead>
                      <TableHead className="w-24 text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vendors.map((v, index) => (
                      <TableRow key={String(v.id)}>
                        <TableCell className="tabular-nums text-muted-foreground">
                          {rowNumber(vendorMeta?.current_page ?? vendorPage, VENDOR_PER_PAGE, index)}
                        </TableCell>
                        <TableCell className="font-mono text-xs">{String(v.code ?? "—")}</TableCell>
                        <TableCell>{String(v.name ?? "—")}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {String(v.vendor_services_count ?? 0)} Layanan
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
                                onClick={() => void openView(v)}
                              >
                                <Eye className="h-4 w-4" />
                                Detail
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="cursor-pointer"
                                onClick={() => {
                                  setFormRow(v);
                                  setFormMode("edit");
                                  setFormOpen(true);
                                }}
                              >
                                <Pencil className="h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="cursor-pointer text-destructive"
                                onClick={() => {
                                  setDeleteRow(v);
                                  setDeleteOpen(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                                Hapus
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  {vendors.length === 0 ? (
                    <TableCaption className="text-xs">Belum ada vendor.</TableCaption>
                  ) : (
                    <TableCaption className="text-xs">Baris pada halaman ini.</TableCaption>
                  )}
                </Table>
              </div>
              {vendorMeta ? (
                <PaginationBar
                  currentPage={vendorMeta.current_page}
                  lastPage={vendorMeta.last_page}
                  total={vendorMeta.total}
                  from={vendorMeta.from}
                  to={vendorMeta.to}
                  onPageChange={setVendorPage}
                />
              ) : null}
            </>
          )}
        </CardContent>
      </Card>

      <VendorFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        mode={formMode}
        row={formRow}
        onSaved={() => void load()}
      />

      <ConfirmDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Hapus vendor?"
        description={`Yakin hapus "${String(deleteRow?.name ?? "—")}"?`}
        loading={deleteLoading}
        onConfirm={handleDelete}
      />

      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto" showCloseButton>
          <DialogHeader>
            <DialogTitle>Detail vendor</DialogTitle>
          </DialogHeader>
          {viewRow ? (
            <div className="grid grid-cols-3 gap-3 px-1 text-sm max-h-[65vh] overflow-y-auto">
              <div className="text-muted-foreground">Kode</div>
              <div className="col-span-2 font-medium">{String(viewRow.code ?? "—")}</div>
              
              <div className="text-muted-foreground">Nama Vendor</div>
              <div className="col-span-2 font-medium">{String(viewRow.name ?? "—")}</div>
              
              <div className="text-muted-foreground">PIC</div>
              <div className="col-span-2 font-medium">{String(viewRow.contact_person ?? "—")}</div>
              
              <div className="text-muted-foreground">Email</div>
              <div className="col-span-2 font-medium">{String(viewRow.email ?? "—")}</div>
              
              <div className="text-muted-foreground">Phone</div>
              <div className="col-span-2 font-medium">{String(viewRow.phone ?? "—")}</div>
              
              <div className="text-muted-foreground">Alamat</div>
              <div className="col-span-2 whitespace-pre-wrap leading-relaxed">{String(viewRow.address ?? "—")}</div>
            </div>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setViewOpen(false)}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
