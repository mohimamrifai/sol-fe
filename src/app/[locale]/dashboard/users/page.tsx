"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Plus, Users, RefreshCcw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserStatsCards } from "@/components/users/user-stats-cards";
import { UserFilters, USER_FILTER_DEFAULTS, type UserFiltersValue } from "@/components/users/user-filters";
import { UserTable, type UserRow } from "@/components/users/user-table";
import { UserFormDialog } from "@/components/users/user-form-dialog";
import { ChangeStatusDialog } from "@/components/users/change-status-dialog";
import { ChangeRoleDialog } from "@/components/users/change-role-dialog";
import { ResetPasswordDialog } from "@/components/users/reset-password-dialog";
import { useCustomerUserStats } from "@/hooks/use-customer-users-stats";
import { useCustomerUsersList } from "@/hooks/use-customer-users-list";
import { useAuthStore } from "@/lib/store";

const PER_PAGE = 15;

export default function UsersPage() {
  const t = useTranslations("Users");
  const { user: currentUser } = useAuthStore();
  const [filters, setFilters] = React.useState<UserFiltersValue>(USER_FILTER_DEFAULTS);
  const [page, setPage] = React.useState(1);

  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<UserRow | null>(null);
  const [statusOpen, setStatusOpen] = React.useState(false);
  const [statusTarget, setStatusTarget] = React.useState<UserRow | null>(null);
  const [roleOpen, setRoleOpen] = React.useState(false);
  const [roleTarget, setRoleTarget] = React.useState<UserRow | null>(null);
  const [pwOpen, setPwOpen] = React.useState(false);
  const [pwTarget, setPwTarget] = React.useState<UserRow | null>(null);

  React.useEffect(() => {
    setPage(1);
  }, [filters]);
  React.useEffect(() => {
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }, [page]);

  const stats = useCustomerUserStats();
  const list = useCustomerUsersList({
    page,
    perPage: PER_PAGE,
    search: filters.search || undefined,
    role: filters.role || undefined,
    status: filters.status || undefined,
    locationId: filters.location_id ? Number(filters.location_id) : undefined,
  });

  const rows: UserRow[] = (list.data?.data ?? []) as unknown as UserRow[];
  const total = list.data?.total ?? 0;

  // Mark current user & last admin in rows
  const decorated = React.useMemo(() => {
    const adminCount = rows.filter((r) => (r.role ?? r.roles?.[0]?.name) === "company_admin" && r.status === "active").length;
    return rows.map((r) => ({
      ...r,
      is_current_user: r.id === currentUser?.id,
      is_last_company_admin:
        (r.role ?? r.roles?.[0]?.name) === "company_admin" &&
        r.status === "active" &&
        adminCount === 1,
    }));
  }, [rows, currentUser?.id]);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (row: UserRow) => {
    setEditing(row);
    setFormOpen(true);
  };

  return (
    <div className="space-y-5">
      <header className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-900/5 text-zinc-900">
            <Users className="h-4 w-4" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">{t("title")}</h1>
            <p className="text-sm text-zinc-500">{t("subtitle")}</p>
          </div>
        </div>
        <Button onClick={openCreate} className="h-10 gap-2">
          <Plus className="h-4 w-4" />
          {t("add")}
        </Button>
      </header>

      <UserStatsCards counts={stats.data?.data ?? {}} />

      <UserFilters value={filters} onChange={setFilters} />

      {list.isError ? (
        <div className="flex items-center gap-3 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <p>Failed to load users.</p>
          <Button variant="outline" size="sm" onClick={() => list.refetch()} className="ml-auto h-8">
            <RefreshCcw className="h-3.5 w-3.5" />
            Retry
          </Button>
        </div>
      ) : (
        <UserTable
          rows={decorated}
          total={total}
          page={page}
          perPage={PER_PAGE}
          isLoading={list.isLoading}
          onPageChange={setPage}
          onEdit={openEdit}
          onChangeRole={(row) => {
            setRoleTarget(row);
            setRoleOpen(true);
          }}
          onResetPassword={(row) => {
            setPwTarget(row);
            setPwOpen(true);
          }}
        />
      )}

      <UserFormDialog
        open={formOpen}
        onOpenChange={(o) => {
          setFormOpen(o);
          if (!o) setEditing(null);
        }}
        row={editing}
      />

      <ChangeStatusDialog
        open={statusOpen}
        onOpenChange={(o) => {
          setStatusOpen(o);
          if (!o) setStatusTarget(null);
        }}
        target={statusTarget}
      />

      <ChangeRoleDialog
        open={roleOpen}
        onOpenChange={(o) => {
          setRoleOpen(o);
          if (!o) setRoleTarget(null);
        }}
        target={roleTarget}
      />

      <ResetPasswordDialog
        open={pwOpen}
        onOpenChange={(o) => {
          setPwOpen(o);
          if (!o) setPwTarget(null);
        }}
        target={pwTarget}
      />
    </div>
  );
}
