"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Plus, Users, RefreshCcw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserStatsCards } from "@/components/users/user-stats-cards";
import { UserFilters, USER_FILTER_DEFAULTS, type UserFiltersValue } from "@/components/users/user-filters";
import { UserTable, type UserRow } from "@/components/users/user-table";
import { UserFormDialog } from "@/components/users/user-form-dialog";
import { useCustomerUserStats } from "@/hooks/use-customer-users-stats";
import { useCustomerUsersList } from "@/hooks/use-customer-users-list";

const PER_PAGE = 15;

export default function UsersPage() {
  const t = useTranslations("Users");
  const [filters, setFilters] = React.useState<UserFiltersValue>(USER_FILTER_DEFAULTS);
  const [page, setPage] = React.useState(1);
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<UserRow | null>(null);

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
        <Button onClick={() => { setEditing(null); setFormOpen(true); }} className="h-10 gap-2">
          <Plus className="h-4 w-4" />
          {t("add")}
        </Button>
      </header>

      <UserStatsCards counts={stats.data?.data ?? {}} />

      <UserFilters value={filters} onChange={setFilters} />

      {list.isError ? (
        <div className="flex items-center gap-3 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <p>{t("common.error")}</p>
          <Button variant="outline" size="sm" onClick={() => list.refetch()} className="ml-auto h-8">
            <RefreshCcw className="h-3.5 w-3.5" />
            Retry
          </Button>
        </div>
      ) : (
        <UserTable
          rows={rows}
          total={total}
          page={page}
          perPage={PER_PAGE}
          isLoading={list.isLoading}
          onPageChange={setPage}
          onEdit={(row) => { setEditing(row); setFormOpen(true); }}
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
    </div>
  );
}
