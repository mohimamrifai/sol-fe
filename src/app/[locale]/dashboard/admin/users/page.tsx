"use client";

import { toast } from "sonner";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PaginationBar } from "@/components/data-table/pagination-bar";
import { TableToolbar } from "@/components/data-table/table-toolbar";
import { useAuthStore } from "@/lib/store";
import { useAuthPersistHydrated } from "@/lib/use-auth-hydrated";
import { createAdminUser, deleteAdminUser, fetchAdminUsers, updateAdminUser } from "@/lib/admin-api";
import type { LaravelPaginated } from "@/lib/types-api";
import { ApiError } from "@/lib/api-client";
import { rowNumber } from "@/lib/list-query";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDeleteDialog } from "@/components/dashboard/admin/confirm-delete-dialog";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { customerStatusLabelFromApi, customerStatusBadgeClass } from "@/lib/customer-status";
import { firstLaravelError } from "@/lib/laravel-errors";
import { MoreHorizontal, Pencil, Plus } from "lucide-react";
import { DIALOG_CREATE_HEADER_CLASS } from "@/lib/dialog-create-header";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

const PER_PAGE = 10;

const INTERNAL_ROLES = [
  { value: "super_admin", label: "Super admin" },
  { value: "operations", label: "Operations" },
  { value: "finance", label: "Finance" },
  { value: "sales", label: "Sales" },
];

type Row = Record<string, unknown>;

export default function AdminUsersPage() {
  const authHydrated = useAuthPersistHydrated();
  const { user } = useAuthStore();
  const roles = user?.roles ?? [];
  const isSuperAdmin = authHydrated && roles.includes("super_admin");

  const [rows, setRows] = useState<Row[]>([]);
  const [meta, setMeta] = useState<LaravelPaginated<Row> | null>(null);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 400);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [editRow, setEditRow] = useState<Row | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("operations");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteRow, setDeleteRow] = useState<Row | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const load = useCallback(async () => {
    if (!authHydrated || !isSuperAdmin) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetchAdminUsers({
        page,
        perPage: PER_PAGE,
        search: debouncedSearch.trim() || undefined,
        userType: "internal",
      });
      const paginated = res as LaravelPaginated<Row>;
      setRows(paginated.data ?? []);
      setMeta(paginated);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Gagal memuat pengguna.");
      setRows([]);
      setMeta(null);
    } finally {
      setLoading(false);
    }
  }, [authHydrated, isSuperAdmin, page, debouncedSearch]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  useEffect(() => {
    void load();
  }, [load]);

  const openCreate = () => {
    setEditRow(null);
    setDialogMode("create");
    setName("");
    setEmail("");
    setPassword("");
    setPhone("");
    setRole("operations");
    setFormError(null);
    setDialogOpen(true);
  };

  const openEdit = (row: Row) => {
    setEditRow(row);
    setDialogMode("edit");
    setName(String(row.name ?? ""));
    setEmail(String(row.email ?? ""));
    setPassword("");
    setPhone(String(row.phone ?? ""));
    const r = row.roles as { name?: string }[] | undefined;
    setRole(r?.[0]?.name ?? "operations");
    setFormError(null);
    setDialogOpen(true);
  };

  const save = async () => {
    setSaving(true);
    setFormError(null);
    try {
      if (dialogMode === "create") {
        await createAdminUser({
          name: name.trim(),
          email: email.trim(),
          password,
          phone: phone.trim() || null,
          user_type: "internal",
          role,
          status: "active",
        });
        toast.success("Pengguna berhasil ditambahkan.");
      } else if (editRow?.id != null) {
        const body: Record<string, unknown> = {
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim() || null,
          user_type: "internal",
          role,
        };
        if (password.trim()) body.password = password.trim();
        await updateAdminUser(Number(editRow.id), body);
        toast.success("Pengguna berhasil diperbarui.");
      }
      setDialogOpen(false);
      await load();
    } catch (e) {
      const msg =
        e instanceof ApiError && e.status === 422
          ? firstLaravelError(e.body) ?? e.message
          : e instanceof ApiError
            ? e.message
            : "Gagal menyimpan.";
      setFormError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (row: Row, checked: boolean) => {
    if (user?.id === row.id) {
      toast.error("Anda tidak dapat mengubah status akun Anda sendiri.");
      return;
    }
    const newStatus = checked ? "active" : "inactive";
    try {
      await updateAdminUser(Number(row.id), { status: newStatus });
      toast.success(`Status akun ${String(row.name ?? "")} berhasil diubah.`);
      setRows((prev) => prev.map((u) => u.id === row.id ? { ...u, status: newStatus } : u));
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Gagal mengubah status akun.");
    }
  };

  const handleDelete = async () => {
    if (deleteRow?.id == null) return;
    setDeleteLoading(true);
    try {
      await deleteAdminUser(Number(deleteRow.id));
      toast.success("Pengguna berhasil dihapus.");
      setDeleteOpen(false);
      setDeleteRow(null);
      await load();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Gagal menghapus.");
    } finally {
      setDeleteLoading(false);
    }
  };

  if (!authHydrated) {
    return null;
  }

  if (!isSuperAdmin) {
    return (
      <p className="text-sm text-muted-foreground">Hanya super admin yang dapat mengelola pengguna internal.</p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold tracking-tight">Pengguna internal</h1>
        <Button type="button" size="sm" className="gap-1.5" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Tambah pengguna
        </Button>
      </div>

      {error ? (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Daftar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <TableToolbar
            searchPlaceholder="Cari nama atau email…"
            searchValue={searchInput}
            onSearchChange={setSearchInput}
          />
          {loading ? (
            <p className="text-sm text-muted-foreground">Memuat…</p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">No</TableHead>
                    <TableHead>Nama</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r, index) => {
                    const rr = r.roles as { name?: string }[] | undefined;
                    const status = String(r.status ?? "active");
                    return (
                      <TableRow key={String(r.id)}>
                        <TableCell className="text-muted-foreground">
                          {rowNumber(meta?.current_page ?? page, PER_PAGE, index)}
                        </TableCell>
                        <TableCell>{String(r.name ?? "")}</TableCell>
                        <TableCell className="font-mono text-xs">{String(r.email ?? "")}</TableCell>
                        <TableCell>
                          {rr?.[0]?.name
                            ? rr[0].name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
                            : "—"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch 
                              size="sm"
                              checked={status === "active"}
                              onCheckedChange={(checked) => void handleToggleStatus(r, checked)}
                              disabled={user?.id === r.id}
                            />
                            <Badge variant="outline" className={customerStatusBadgeClass(status)}>
                              {customerStatusLabelFromApi(status)}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), "shrink-0")}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Menu aksi</span>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="min-w-44">
                              <DropdownMenuItem className="cursor-pointer" onClick={() => openEdit(r)}>
                                <Pencil className="h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md" showCloseButton>
          <DialogHeader className={cn(dialogMode === "create" && DIALOG_CREATE_HEADER_CLASS)}>
            <DialogTitle>{dialogMode === "create" ? "Tambah pengguna" : "Edit pengguna"}</DialogTitle>
          </DialogHeader>
          {formError ? (
            <p className="text-sm text-red-600 bg-red-50 border rounded px-3 py-2">{formError}</p>
          ) : null}
          <div className="grid gap-3 py-2">
            <div className="space-y-1">
              <Label>Nama</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={dialogMode === "create" ? "Nama lengkap" : undefined}
              />
            </div>
            <div className="space-y-1">
              <Label>Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={dialogMode === "create" ? "email@perusahaan.com" : undefined}
              />
            </div>
            <div className="space-y-1">
              <Label>{dialogMode === "create" ? "Password" : "Password (kosongkan jika tidak diubah)"}</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                placeholder={dialogMode === "create" ? "Minimal sesuai kebijakan keamanan" : undefined}
              />
            </div>
            <div className="space-y-1">
              <Label>Telepon</Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={dialogMode === "create" ? "+62… (opsional)" : undefined}
              />
            </div>
            <div className="space-y-1">
              <Label>Role</Label>
              <Select
                value={role}
                onValueChange={(v) => {
                  if (v != null) setRole(v);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INTERNAL_ROLES.map((x) => (
                    <SelectItem key={x.value} value={x.value}>
                      {x.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Batal
            </Button>
            <Button
              type="button"
              onClick={() => void save()}
              disabled={saving || !name.trim() || (dialogMode === "create" && !email.trim()) || (dialogMode === "create" && !password)}
            >
              {saving ? "Menyimpan…" : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Hapus pengguna?"
        description={`Yakin hapus "${String(deleteRow?.name ?? "")}"?`}
        loading={deleteLoading}
        onConfirm={handleDelete}
      />
    </div>
  );
}
