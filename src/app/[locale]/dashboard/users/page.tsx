"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserStatsCards } from "@/components/users/user-stats-cards";
import { UserFilters, USER_FILTER_DEFAULTS, type UserFiltersValue } from "@/components/users/user-filters";
import { UserTable, type UserRow } from "@/components/users/user-table";
import { UserFormDialog } from "@/components/users/user-form-dialog";
import { ListErrorBanner } from "@/components/shared/list-error-banner";
import { useCustomerUserStats } from "@/hooks/use-customer-users-stats";
import { useCustomerUsersList } from "@/hooks/use-customer-users-list";

const PER_PAGE = 15;

type UserStatKey = "total" | "active" | "inactive" | "company_admin";

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

  const handleCardClick = React.useCallback(
    (key: UserStatKey) => {
      if (key === "total") {
        setFilters(USER_FILTER_DEFAULTS);
        return;
      }
      if (key === "company_admin") {
        setFilters({ ...filters, role: "company_admin", status: "" });
        return;
      }
      setFilters({ ...filters, status: key, role: "" });
    },
    [filters]
  );

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

      <UserStatsCards counts={stats.data?.data ?? {}} onCardClick={handleCardClick} />

      <UserFilters value={filters} onChange={setFilters} />

      {list.isError ? (
        <ListErrorBanner message={t("common.error")} onRetry={() => list.refetch()} />
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
