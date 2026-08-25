"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
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
import { Textarea } from "@/components/ui/textarea";
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
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PaginationBar } from "@/components/data-table/pagination-bar";
import { TableToolbar } from "@/components/data-table/table-toolbar";
import { MasterRowActions } from "@/components/shared/master-row-actions";
import { MasterActiveBadge } from "@/components/shared/master-active-badge";
import { actionsCellClass, actionsHeadClass } from "@/components/shared/master-table-classes";
import { STATUS_FILTER_OPTIONS } from "@/components/shared/master-filters";
import { AdminStatsCards } from "@/components/dashboard/admin/shared/admin-stats-cards";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import {
  deactivateAdminRole,
  fetchAdminRole,
  fetchAdminRoleStats,
  fetchAdminRoles,
  storeAdminRole,
  updateAdminRole,
  updateAdminRolePermissions,
} from "@/lib/admin-api";
import { ADMIN_PERMISSION_MATRIX, PERMISSION_ACTIONS } from "@/lib/admin-permission-matrix";
import { internalRoleLabel } from "@/lib/admin-fsd-options";
import { ApiError } from "@/lib/api-client";
import { customerStatusBadgeClass, customerStatusLabelFromApi } from "@/lib/customer-status";
import { cn } from "@/lib/utils";
import { Loader2, Plus, Save, ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";

const PER_PAGE = 10;

type Role = {
  id: number;
  name: string;
  description: string | null;
  is_active: boolean;
  permissions: { name: string }[];
  users_count: number;
};

type AssignedUser = {
  id: number;
  name: string;
  email: string;
  status: string;
};

type RoleDetail = Role & {
  assigned_users?: AssignedUser[];
  activity_log?: Array<{ description?: string; user?: string; occurred_at?: string }>;
};

type RoleForm = {
  name: string;
  description: string;
  status: "active" | "inactive";
};

const EMPTY_FORM: RoleForm = { name: "", description: "", status: "active" };

function roleDisplayName(name: string): string {
  return internalRoleLabel(name);
}

export default function RoleManagementPage() {
  const tr = useTranslations("AdminFsdSettings.roles");
  const tc = useTranslations("AdminCommon");

  const [roles, setRoles] = useState<Role[]>([]);
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 400);
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);

  const [addOpen, setAddOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailMode, setDetailMode] = useState<"view" | "edit">("view");
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [roleForm, setRoleForm] = useState<RoleForm>(EMPTY_FORM);
  const [rolePerms, setRolePerms] = useState<Record<number, string[]>>({});
  const [roleDetail, setRoleDetail] = useState<RoleDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const statusParam = statusFilter === "all" ? undefined : statusFilter;
      const [rolesRes, statsRes] = await Promise.all([
        fetchAdminRoles({
          search: debouncedSearch.trim() || undefined,
          status: statusParam,
        }),
        fetchAdminRoleStats(),
      ]);
      const rolesData = (rolesRes.data ?? []) as Role[];
      setRoles(rolesData);
      setStats(statsRes.data ?? { total: 0, active: 0, inactive: 0 });
      const mapping: Record<number, string[]> = {};
      rolesData.forEach((r) => {
        mapping[r.id] = r.permissions.map((p) => p.name);
      });
      setRolePerms(mapping);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : tr("loadError"));
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, statusFilter, tr]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const pagedRoles = useMemo(() => {
    const start = (page - 1) * PER_PAGE;
    return roles.slice(start, start + PER_PAGE);
  }, [roles, page]);

  const togglePermission = (roleId: number, permName: string) => {
    setRolePerms((prev) => {
      const current = prev[roleId] || [];
      const updated = current.includes(permName) ? current.filter((p) => p !== permName) : [...current, permName];
      return { ...prev, [roleId]: updated };
    });
  };

  const loadRoleDetail = async (role: Role) => {
    setDetailLoading(true);
    try {
      const res = await fetchAdminRole(role.id);
      const data = (res as { data: RoleDetail }).data;
      setRoleDetail(data);
      setRoleForm({
        name: data.name,
        description: data.description ?? "",
        status: data.is_active ? "active" : "inactive",
      });
      setRolePerms((prev) => ({
        ...prev,
        [role.id]: data.permissions.map((p) => p.name),
      }));
    } catch {
      setRoleDetail(null);
      setRoleForm({
        name: role.name,
        description: role.description ?? "",
        status: role.is_active ? "active" : "inactive",
      });
    } finally {
      setDetailLoading(false);
    }
  };

  const openDetail = async (role: Role, mode: "view" | "edit") => {
    setSelectedRole(role);
    setDetailMode(mode);
    setDetailOpen(true);
    await loadRoleDetail(role);
  };

  const handleCreateRole = async () => {
    setSaving(true);
    try {
      await storeAdminRole({
        name: roleForm.name.trim(),
        description: roleForm.description.trim() || null,
        guard_name: "web",
        is_active: roleForm.status === "active",
      });
      toast.success(tr("created"));
      setAddOpen(false);
      setRoleForm(EMPTY_FORM);
      await loadData();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : tr("saveError"));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDetail = async () => {
    if (!selectedRole) return;
    setSaving(true);
    try {
      await updateAdminRole(selectedRole.id, {
        name: roleForm.name.trim(),
        description: roleForm.description.trim() || null,
        is_active: roleForm.status === "active",
      });
      await updateAdminRolePermissions(selectedRole.id, rolePerms[selectedRole.id] || []);
      toast.success(tr("updated"));
      setDetailOpen(false);
      await loadData();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : tr("saveError"));
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (role: Role) => {
    try {
      await deactivateAdminRole(role.id);
      toast.success(tr("deactivated"));
      if (detailOpen) setDetailOpen(false);
      await loadData();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : tr("saveError"));
    }
  };

  const canDeactivate = (role: Role) => role.name !== "super_admin" && role.is_active;

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-900/5 text-zinc-900">
          <ShieldCheck className="h-4 w-4" />
        </div>
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900 sm:text-2xl">{tr("title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{tr("subtitle")}</p>
        </div>
      </div>

      <AdminStatsCards
        className="sm:grid-cols-3"
        cards={[
          { key: "total", label: tr("stats.total"), value: stats.total, icon: ShieldCheck, iconClassName: "text-zinc-700 bg-zinc-100" },
          { key: "active", label: tr("stats.active"), value: stats.active, icon: ShieldCheck, iconClassName: "text-emerald-700 bg-emerald-100" },
          { key: "inactive", label: tr("stats.inactive"), value: stats.inactive, icon: ShieldCheck, iconClassName: "text-red-700 bg-red-100" },
        ]}
      />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>{tr("listTitle")}</CardTitle>
          <Button size="sm" className="gap-1.5" onClick={() => { setRoleForm(EMPTY_FORM); setAddOpen(true); }}>
            <Plus className="h-4 w-4" />
            {tr("add")}
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <TableToolbar
            searchPlaceholder={tr("search")}
            searchValue={search}
            onSearchChange={setSearch}
            filterLabel={tc("filters.status")}
            filterValue={statusFilter}
            onFilterChange={setStatusFilter}
            filterOptions={STATUS_FILTER_OPTIONS}
          />
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{tr("columns.name")}</TableHead>
                <TableHead>{tr("columns.description")}</TableHead>
                <TableHead className="text-right">{tr("columns.totalUsers")}</TableHead>
                <TableHead>{tc("table.status")}</TableHead>
                <TableHead className={actionsHeadClass}>
                  <span className="max-md:sr-only">{tc("table.actions")}</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagedRoles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell className="font-medium">{roleDisplayName(role.name)}</TableCell>
                  <TableCell className="max-w-xs text-muted-foreground">
                    {role.description?.trim() ? role.description : tr("noDescription")}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{role.users_count ?? 0}</TableCell>
                  <TableCell>
                    <MasterActiveBadge active={role.is_active} />
                  </TableCell>
                  <TableCell className={cn(actionsCellClass, "p-2 text-right")}>
                    <MasterRowActions
                      entityLabel="role"
                      canManage
                      onView={() => void openDetail(role, "view")}
                      onEdit={() => void openDetail(role, "edit")}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            {pagedRoles.length === 0 ? <TableCaption className="text-xs">{tc("table.empty")}</TableCaption> : null}
          </Table>
          <PaginationBar
            currentPage={page}
            lastPage={Math.max(1, Math.ceil(roles.length / PER_PAGE))}
            total={roles.length}
            from={roles.length ? (page - 1) * PER_PAGE + 1 : 0}
            to={Math.min(page * PER_PAGE, roles.length)}
            onPageChange={setPage}
          />
        </CardContent>
      </Card>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{tr("add")}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="space-y-2">
              <Label>{tr("fields.name")}</Label>
              <Input value={roleForm.name} onChange={(e) => setRoleForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>{tr("fields.description")}</Label>
              <Textarea value={roleForm.description} onChange={(e) => setRoleForm((f) => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>{tc("table.status")}</Label>
              <Select value={roleForm.status} onValueChange={(v) => v && setRoleForm((f) => ({ ...f, status: v as RoleForm["status"] }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">{tr("statusActive")}</SelectItem>
                  <SelectItem value="inactive">{tr("statusInactive")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              {tc("actions.cancel")}
            </Button>
            <Button disabled={saving || !roleForm.name.trim()} onClick={() => void handleCreateRole()}>
              {saving ? tc("actions.saving") : tc("actions.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="w-full max-w-[calc(100%-2rem)] sm:max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{roleDisplayName(selectedRole?.name ?? roleForm.name)}</DialogTitle>
          </DialogHeader>
          {detailLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : selectedRole ? (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-2">
                <MasterActiveBadge active={roleForm.status === "active"} />
                <span className="text-sm text-muted-foreground">
                  {tr("columns.totalUsers")}: {roleDetail?.users_count ?? selectedRole.users_count ?? 0}
                </span>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-semibold">{tr("generalInfo")}</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <Label>{tr("fields.name")}</Label>
                    <Input
                      value={roleForm.name}
                      onChange={(e) => setRoleForm((f) => ({ ...f, name: e.target.value }))}
                      disabled={detailMode === "view" || selectedRole.name === "super_admin"}
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label>{tr("fields.description")}</Label>
                    <Textarea
                      value={roleForm.description}
                      onChange={(e) => setRoleForm((f) => ({ ...f, description: e.target.value }))}
                      disabled={detailMode === "view"}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{tc("table.status")}</Label>
                    <Select
                      value={roleForm.status}
                      onValueChange={(v) => v && setRoleForm((f) => ({ ...f, status: v as RoleForm["status"] }))}
                      disabled={detailMode === "view" || selectedRole.name === "super_admin"}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">{tr("statusActive")}</SelectItem>
                        <SelectItem value="inactive">{tr("statusInactive")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-semibold">{tr("matrix.menu")} Permissions</h3>
                <div className="overflow-x-auto rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{tr("matrix.menu")}</TableHead>
                        {PERMISSION_ACTIONS.map((action) => (
                          <TableHead key={action} className="text-center capitalize">
                            {tr(`matrix.${action}` as "matrix.view")}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ADMIN_PERMISSION_MATRIX.map((row) => (
                        <TableRow key={row.menu}>
                          <TableCell className="font-medium">{row.menu}</TableCell>
                          {PERMISSION_ACTIONS.map((action) => {
                            const permName = row.permissions[action];
                            if (!permName) return <TableCell key={action} className="text-center text-muted-foreground">—</TableCell>;
                            return (
                              <TableCell key={action} className="text-center">
                                <Checkbox
                                  checked={rolePerms[selectedRole.id]?.includes(permName)}
                                  onCheckedChange={() => togglePermission(selectedRole.id, permName)}
                                  disabled={detailMode === "view" || selectedRole.name === "super_admin"}
                                />
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-semibold">{tr("assignedUsers")}</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{tr("columns.userName")}</TableHead>
                      <TableHead>{tr("columns.userEmail")}</TableHead>
                      <TableHead>{tr("columns.userStatus")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(roleDetail?.assigned_users ?? []).map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.name}</TableCell>
                        <TableCell className="font-mono text-xs">{user.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={customerStatusBadgeClass(user.status)}>
                            {customerStatusLabelFromApi(user.status)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  {(roleDetail?.assigned_users ?? []).length === 0 ? (
                    <TableCaption className="text-xs">{tr("noAssignedUsers")}</TableCaption>
                  ) : null}
                </Table>
              </div>

              {((roleDetail?.activity_log ?? []).length > 0) ? (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold">{tr("activityLog")}</h3>
                  {(roleDetail?.activity_log ?? []).map((log, i) => (
                    <div key={i} className="border-b pb-2 text-sm last:border-0">
                      <p>{String(log.description ?? "")}</p>
                      <p className="text-xs text-muted-foreground">{String(log.user ?? "System")}</p>
                    </div>
                  ))}
                </div>
              ) : null}

              <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
                <div>
                  {detailMode === "edit" && canDeactivate(selectedRole) ? (
                    <Button type="button" variant="outline" onClick={() => void handleDeactivate(selectedRole)}>
                      {tr("deactivate")}
                    </Button>
                  ) : null}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setDetailOpen(false)}>
                    {tc("actions.cancel")}
                  </Button>
                  {detailMode === "edit" ? (
                    <Button className="gap-2" disabled={saving || !roleForm.name.trim()} onClick={() => void handleSaveDetail()}>
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      {tc("actions.save")}
                    </Button>
                  ) : (
                    <Button onClick={() => setDetailMode("edit")}>{tc("actions.edit")}</Button>
                  )}
                </div>
              </DialogFooter>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
