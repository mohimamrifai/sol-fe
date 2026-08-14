"use client";

import { toast } from "sonner";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import { useAuthPersistHydrated } from "@/hooks/use-auth-hydrated";
import {
  createAdminUser,
  fetchAdminPermissions,
  fetchAdminRoles,
  fetchAdminUsers,
  updateAdminUser,
} from "@/lib/admin-api";
import type { LaravelPaginated } from "@/lib/types-api";
import { ApiError } from "@/lib/api-client";
import { rowNumber } from "@/lib/list-query";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { customerStatusLabelFromApi, customerStatusBadgeClass } from "@/lib/customer-status";
import { firstLaravelError } from "@/lib/laravel-errors";
import { MoreHorizontal, Pencil, Plus } from "lucide-react";
import { DIALOG_CREATE_HEADER_CLASS } from "@/lib/dialog-create-header";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { INTERNAL_ADMIN_ROLES, internalRoleLabel } from "@/lib/admin-fsd-options";
import { humanizeSnakeCase } from "@/lib/format-label";
import { useTranslations } from "next-intl";

const PER_PAGE = 10;

type Row = Record<string, unknown>;
type RoleRow = { id: number; name: string; permissions: { name: string }[] };

function formatLastLogin(value: unknown): string {
  if (!value) return "—";
  const d = new Date(String(value));
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

function isInternalAdminPermission(name: string): boolean {
  return !name.startsWith("vendor.") && !["view_company", "manage_company", "view_locations", "manage_locations", "manage_bookings"].includes(name);
}

export default function AdminUsersPage() {
  const authHydrated = useAuthPersistHydrated();
  const { user } = useAuthStore();
  const roles = user?.roles ?? [];
  const isSuperAdmin = authHydrated && roles.includes("super_admin");
  const tu = useTranslations("AdminFsdSettings.users");
  const tc = useTranslations("AdminCommon");

  const [rows, setRows] = useState<Row[]>([]);
  const [meta, setMeta] = useState<LaravelPaginated<Row> | null>(null);
  const [roleRows, setRoleRows] = useState<RoleRow[]>([]);
  const [permissionOptions, setPermissionOptions] = useState<string[]>([]);
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
  const [status, setStatus] = useState("active");
  const [featureAccess, setFeatureAccess] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const allPermissionNames = useMemo(
    () => permissionOptions.filter(isInternalAdminPermission),
    [permissionOptions]
  );

  const loadMeta = useCallback(async () => {
    if (!authHydrated || !isSuperAdmin) return;
    const [rolesRes, permsRes] = await Promise.all([fetchAdminRoles(), fetchAdminPermissions()]);
    setRoleRows((rolesRes.data as RoleRow[]) ?? []);
    setPermissionOptions(((permsRes.data as { name: string }[]) ?? []).map((p) => p.name));
  }, [authHydrated, isSuperAdmin]);

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
      setError(e instanceof ApiError ? e.message : tu("loadError"));
      setRows([]);
      setMeta(null);
    } finally {
      setLoading(false);
    }
  }, [authHydrated, isSuperAdmin, page, debouncedSearch, tu]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  useEffect(() => {
    void loadMeta();
  }, [loadMeta]);

  useEffect(() => {
    void load();
  }, [load]);

  const defaultFeaturesForRole = useCallback(
    (roleName: string): string[] => {
      if (roleName === "super_admin") return allPermissionNames;
      const found = roleRows.find((r) => r.name === roleName);
      return found?.permissions.map((p) => p.name) ?? [];
    },
    [allPermissionNames, roleRows]
  );

  const openCreate = () => {
    setEditRow(null);
    setDialogMode("create");
    setName("");
    setEmail("");
    setPassword("");
    setPhone("");
    setRole("operations");
    setStatus("active");
    setFeatureAccess(defaultFeaturesForRole("operations"));
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
    const roleName = r?.[0]?.name ?? "operations";
    setRole(roleName);
    setStatus(String(row.status ?? "active"));
    const features = row.feature_access as string[] | undefined;
    setFeatureAccess(features?.length ? features : defaultFeaturesForRole(roleName));
    setFormError(null);
    setDialogOpen(true);
  };

  const handleRoleChange = (nextRole: string) => {
    setRole(nextRole);
    setFeatureAccess(defaultFeaturesForRole(nextRole));
  };

  const toggleFeature = (perm: string) => {
    if (role === "super_admin") return;
    setFeatureAccess((prev) => (prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]));
  };

  const save = async () => {
    setSaving(true);
    setFormError(null);
    try {
      const body: Record<string, unknown> = {
        name: name.trim(),
        phone: phone.trim() || null,
        user_type: "internal",
        role,
        status,
        feature_access: role === "super_admin" ? allPermissionNames : featureAccess,
      };
      if (dialogMode === "create") {
        await createAdminUser({
          ...body,
          email: email.trim(),
          password,
        });
        toast.success(tu("created"));
      } else if (editRow?.id != null) {
        body.email = email.trim();
        if (password.trim()) body.password = password.trim();
        await updateAdminUser(Number(editRow.id), body);
        toast.success(tu("updated"));
      }
      setDialogOpen(false);
      await load();
    } catch (e) {
      const msg =
        e instanceof ApiError && e.status === 422
          ? firstLaravelError(e.body) ?? e.message
          : e instanceof ApiError
            ? e.message
            : tu("saveError");
      setFormError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (row: Row, checked: boolean) => {
    if (user?.id === row.id) {
      toast.error(tu("selfStatusError"));
      return;
    }
    const newStatus = checked ? "active" : "inactive";
    try {
      await updateAdminUser(Number(row.id), { status: newStatus });
      toast.success(tu("statusUpdated", { name: String(row.name ?? "") }));
      setRows((prev) => prev.map((u) => (u.id === row.id ? { ...u, status: newStatus } : u)));
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : tu("statusError"));
    }
  };

  if (!authHydrated) {
    return null;
  }

  if (!isSuperAdmin) {
    return <p className="text-sm text-muted-foreground">{tu("restricted")}</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold tracking-tight">{tu("title")}</h1>
        <Button type="button" size="sm" className="gap-1.5" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          {tu("add")}
        </Button>
      </div>

      {error ? (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>{tu("listTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <TableToolbar searchPlaceholder={tu("search")} searchValue={searchInput} onSearchChange={setSearchInput} />
          {loading ? (
            <p className="text-sm text-muted-foreground">{tc("actions.loading")}</p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">{tc("table.no")}</TableHead>
                    <TableHead>{tu("columns.name")}</TableHead>
                    <TableHead>{tu("columns.email")}</TableHead>
                    <TableHead>{tu("columns.role")}</TableHead>
                    <TableHead>{tu("columns.lastLogin")}</TableHead>
                    <TableHead>{tc("table.status")}</TableHead>
                    <TableHead className="text-right">{tc("table.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r, index) => {
                    const rr = r.roles as { name?: string }[] | undefined;
                    const statusValue = String(r.status ?? "active");
                    return (
                      <TableRow key={String(r.id)}>
                        <TableCell className="text-muted-foreground">
                          {rowNumber(meta?.current_page ?? page, PER_PAGE, index)}
                        </TableCell>
                        <TableCell>{String(r.name ?? "")}</TableCell>
                        <TableCell className="font-mono text-xs">{String(r.email ?? "")}</TableCell>
                        <TableCell>{internalRoleLabel(rr?.[0]?.name)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{formatLastLogin(r.last_login_at)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch
                              size="sm"
                              checked={statusValue === "active"}
                              onCheckedChange={(checked) => void handleToggleStatus(r, checked)}
                              disabled={user?.id === r.id}
                            />
                            <Badge variant="outline" className={customerStatusBadgeClass(statusValue)}>
                              {customerStatusLabelFromApi(statusValue)}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), "shrink-0")}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">{tc("table.actions")}</span>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="min-w-44">
                              <DropdownMenuItem className="cursor-pointer" onClick={() => openEdit(r)}>
                                <Pencil className="h-4 w-4" />
                                {tc("actions.edit")}
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
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto" showCloseButton>
          <DialogHeader className={cn(dialogMode === "create" && DIALOG_CREATE_HEADER_CLASS)}>
            <DialogTitle>{dialogMode === "create" ? tu("add") : tu("edit")}</DialogTitle>
          </DialogHeader>
          {formError ? (
            <p className="text-sm text-red-600 bg-red-50 border rounded px-3 py-2">{formError}</p>
          ) : null}
          <div className="grid gap-3 py-2">
            <div className="space-y-1">
              <Label>{tu("fields.name")}</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>{tu("fields.email")}</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={dialogMode === "edit"} />
            </div>
            <div className="space-y-1">
              <Label>{dialogMode === "create" ? tu("fields.password") : tu("fields.passwordOptional")}</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
            </div>
            <div className="space-y-1">
              <Label>{tu("fields.phone")}</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>{tu("fields.role")}</Label>
              <Select value={role} onValueChange={(v) => v && handleRoleChange(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INTERNAL_ADMIN_ROLES.map((x) => (
                    <SelectItem key={x.value} value={x.value}>
                      {x.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {dialogMode === "edit" ? (
              <div className="space-y-1">
                <Label>{tu("fields.status")}</Label>
                <Select value={status} onValueChange={(v) => v && setStatus(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">{tu("statusActive")}</SelectItem>
                    <SelectItem value="inactive">{tu("statusInactive")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ) : null}
            <div className="space-y-2">
              <Label>{tu("fields.featureAccess")}</Label>
              <div className="max-h-48 overflow-y-auto rounded-md border p-3 space-y-2">
                {allPermissionNames.map((perm) => (
                  <div key={perm} className="flex items-center gap-2">
                    <Checkbox
                      id={`perm-${perm}`}
                      checked={role === "super_admin" ? true : featureAccess.includes(perm)}
                      onCheckedChange={() => toggleFeature(perm)}
                      disabled={role === "super_admin"}
                    />
                    <label htmlFor={`perm-${perm}`} className="text-sm cursor-pointer">
                      {humanizeSnakeCase(perm)}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              {tc("actions.cancel")}
            </Button>
            <Button
              type="button"
              onClick={() => void save()}
              disabled={saving || !name.trim() || (dialogMode === "create" && !email.trim()) || (dialogMode === "create" && !password)}
            >
              {saving ? tc("actions.saving") : tc("actions.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
