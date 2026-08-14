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
  fetchAdminRole,
  fetchAdminRoles,
  fetchAdminUsers,
  storeAdminRole,
  updateAdminRolePermissions,
} from "@/lib/admin-api";
import { ADMIN_PERMISSION_MATRIX, PERMISSION_ACTIONS } from "@/lib/admin-permission-matrix";
import { ApiError } from "@/lib/api-client";
import { humanizeSnakeCase } from "@/lib/format-label";
import { cn } from "@/lib/utils";
import { Loader2, Plus, Save, ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";

type Role = {
  id: number;
  name: string;
  permissions: { name: string }[];
};

export default function RoleManagementPage() {
  const tr = useTranslations("AdminFsdSettings.roles");
  const tc = useTranslations("AdminCommon");
  const [roles, setRoles] = useState<Role[]>([]);
  const [userCounts, setUserCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 400);
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const PER_PAGE = 10;

  const [addOpen, setAddOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [roleForm, setRoleForm] = useState({ name: "", description: "", status: "active" });
  const [rolePerms, setRolePerms] = useState<Record<number, string[]>>({});
  const [roleDetail, setRoleDetail] = useState<Record<string, unknown> | null>(null);
  const [creating, setCreating] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [rolesRes, usersRes] = await Promise.all([
        fetchAdminRoles(),
        fetchAdminUsers({ userType: "internal", perPage: 500 }),
      ]);
      const rolesData = rolesRes.data as Role[];
      setRoles(rolesData);
      const mapping: Record<number, string[]> = {};
      rolesData.forEach((r) => {
        mapping[r.id] = r.permissions.map((p) => p.name);
      });
      setRolePerms(mapping);

      const counts: Record<string, number> = {};
      for (const u of ((usersRes as { data?: Record<string, unknown>[] }).data ?? [])) {
        const rr = u.roles as { name?: string }[] | undefined;
        const roleName = rr?.[0]?.name;
        if (roleName) counts[roleName] = (counts[roleName] ?? 0) + 1;
      }
      setUserCounts(counts);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : tr("loadError"));
    } finally {
      setLoading(false);
    }
  }, [tr]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const filteredRoles = useMemo(() => {
    let list = roles.filter((r) => !r.name.startsWith("vendor_") && !["company_admin", "ops_pic", "finance_pic", "viewer"].includes(r.name));
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.trim().toLowerCase();
      list = list.filter((r) => r.name.toLowerCase().includes(q));
    }
    if (statusFilter === "active") list = list.filter(() => true);
    if (statusFilter === "inactive") list = [];
    return list;
  }, [roles, debouncedSearch, statusFilter]);

  const pagedRoles = useMemo(() => {
    const start = (page - 1) * PER_PAGE;
    return filteredRoles.slice(start, start + PER_PAGE);
  }, [filteredRoles, page]);

  const stats = useMemo(
    () => ({
      total: filteredRoles.length,
      active: filteredRoles.length,
      inactive: 0,
    }),
    [filteredRoles]
  );

  const togglePermission = (roleId: number, permName: string) => {
    setRolePerms((prev) => {
      const current = prev[roleId] || [];
      const updated = current.includes(permName) ? current.filter((p) => p !== permName) : [...current, permName];
      return { ...prev, [roleId]: updated };
    });
  };

  const handleSavePermissions = async (roleId: number) => {
    setSaving(roleId);
    try {
      await updateAdminRolePermissions(roleId, rolePerms[roleId] || []);
      toast.success(tr("permissionsSaved"));
      await loadData();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : tr("saveError"));
    } finally {
      setSaving(null);
    }
  };

  const handleCreateRole = async () => {
    setCreating(true);
    try {
      await storeAdminRole({ name: roleForm.name.trim(), guard_name: "web" });
      toast.success(tr("created"));
      setAddOpen(false);
      setRoleForm({ name: "", description: "", status: "active" });
      await loadData();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : tr("saveError"));
    } finally {
      setCreating(false);
    }
  };

  const openDetail = async (role: Role) => {
    setSelectedRole(role);
    setRoleForm({ name: role.name, description: "", status: "active" });
    setDetailOpen(true);
    try {
      const res = await fetchAdminRole(role.id);
      setRoleDetail((res as { data: Record<string, unknown> }).data);
    } catch {
      setRoleDetail(null);
    }
  };

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
          <Button size="sm" className="gap-1.5" onClick={() => setAddOpen(true)}>
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
                  <TableCell className="font-medium">{humanizeSnakeCase(role.name)}</TableCell>
                  <TableCell className="text-muted-foreground">—</TableCell>
                  <TableCell className="text-right tabular-nums">{userCounts[role.name] ?? 0}</TableCell>
                  <TableCell>
                    <MasterActiveBadge active />
                  </TableCell>
                  <TableCell className={cn(actionsCellClass, "p-2 text-right")}>
                    <MasterRowActions entityLabel="role" canManage onView={() => openDetail(role)} onEdit={() => openDetail(role)} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            {pagedRoles.length === 0 ? <TableCaption className="text-xs">{tc("table.empty")}</TableCaption> : null}
          </Table>
          <PaginationBar
            currentPage={page}
            lastPage={Math.max(1, Math.ceil(filteredRoles.length / PER_PAGE))}
            total={filteredRoles.length}
            from={filteredRoles.length ? (page - 1) * PER_PAGE + 1 : 0}
            to={Math.min(page * PER_PAGE, filteredRoles.length)}
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
              <Select value={roleForm.status} onValueChange={(v) => v && setRoleForm((f) => ({ ...f, status: v }))}>
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
            <Button disabled={creating || !roleForm.name.trim()} onClick={() => void handleCreateRole()}>
              {creating ? tc("actions.saving") : tc("actions.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{humanizeSnakeCase(selectedRole?.name ?? "")}</DialogTitle>
          </DialogHeader>
          {selectedRole ? (
            <>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{tr("statusActive")}</Badge>
                <span className="text-sm text-muted-foreground">
                  {tr("columns.totalUsers")}: {userCounts[selectedRole.name] ?? 0}
                </span>
              </div>
              <div className="overflow-x-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{tr("matrix.menu")}</TableHead>
                      {PERMISSION_ACTIONS.map((action) => (
                        <TableHead key={action} className="text-center capitalize">{tr(`matrix.${action}` as "matrix.view")}</TableHead>
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
                              />
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {((roleDetail?.activity_log as Array<Record<string, unknown>>) ?? []).length > 0 ? (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold">{tr("activityLog")}</h3>
                  {((roleDetail?.activity_log as Array<Record<string, unknown>>) ?? []).map((log, i) => (
                    <div key={i} className="border-b pb-2 text-sm last:border-0">
                      <p>{String(log.description ?? "")}</p>
                      <p className="text-xs text-muted-foreground">{String(log.user ?? "System")}</p>
                    </div>
                  ))}
                </div>
              ) : null}
              <DialogFooter>
                <Button variant="outline" onClick={() => setDetailOpen(false)}>
                  {tc("actions.cancel")}
                </Button>
                <Button className="gap-2" disabled={saving === selectedRole.id} onClick={() => void handleSavePermissions(selectedRole.id)}>
                  {saving === selectedRole.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {tc("actions.save")}
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
