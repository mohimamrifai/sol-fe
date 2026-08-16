"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Users, Plus, MoreHorizontal, ShieldCheck, Power, KeyRound, Edit } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { useVendorUsers, useVendorUserStats } from "@/hooks/use-vendor-users";
import { useAuthStore } from "@/lib/store";
import { isVendorAdminUser } from "@/lib/auth-role";
import { VendorUsersStatsCards } from "@/components/vendor/users/vendor-users-stats-cards";
import { VendorUserFilters } from "@/components/vendor/users/vendor-user-filters";
import { VendorUserFormDialog } from "@/components/vendor/users/dialogs/vendor-user-form-dialog";
import { VendorChangeRoleDialog } from "@/components/vendor/users/dialogs/vendor-change-role-dialog";
import { VendorChangeStatusDialog } from "@/components/vendor/users/dialogs/vendor-change-status-dialog";
import { VendorResetPasswordDialog } from "@/components/vendor/users/dialogs/vendor-reset-password-dialog";
import type { VendorUser } from "@/lib/vendor/users-api";

const STATUS_BADGE: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700 border-emerald-200",
  inactive: "bg-zinc-100 text-zinc-700 border-zinc-200",
};

export function VendorUsersList() {
  const t = useTranslations("Vendor.users");
  const tCommon = useTranslations("Vendor.common");
  const router = useRouter();
  const { user: currentUser } = useAuthStore();
  const isAdmin = isVendorAdminUser(currentUser);
  const [filters, setFilters] = useState<Record<string, unknown>>({});
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [roleTarget, setRoleTarget] = useState<VendorUser | null>(null);
  const [statusTarget, setStatusTarget] = useState<VendorUser | null>(null);
  const [pwTarget, setPwTarget] = useState<VendorUser | null>(null);

  useVendorUserStats();
  const { data, isLoading } = useVendorUsers({ ...filters, page, per_page: 15 });

  const rows: VendorUser[] = (data?.data ?? []).map((u) => {
    const adminCount = (data?.data ?? []).filter(
      (r) => r.primary_role === "vendor_company_admin" && r.status === "active"
    ).length;
    return {
      ...u,
      is_current_user: u.id === currentUser?.id,
      is_last_company_admin:
        u.primary_role === "vendor_company_admin" &&
        u.status === "active" &&
        adminCount === 1,
    };
  });

  return (
    <div className="flex min-w-0 w-full flex-1 flex-col gap-6">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-900/5 text-zinc-900">
          <Users className="h-4 w-4" />
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900 sm:text-2xl">
            {t("title")}
          </h1>
          <p className="text-sm text-zinc-500">Manage users in your vendor company.</p>
        </div>
        {isAdmin && (
          <Button onClick={() => setCreateOpen(true)} className="h-10">
            <Plus className="mr-2 h-4 w-4" /> Add User
          </Button>
        )}
      </div>

      <VendorUsersStatsCards />
      <VendorUserFilters onChange={setFilters} />

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6"><Skeleton className="h-32 w-full" /></div>
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 p-12 text-center">
              <Users className="h-10 w-10 text-zinc-300" />
              <p className="text-sm text-zinc-500">{tCommon("noData")}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50 text-left text-xs font-medium text-zinc-500">
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Email</th>
                    <th className="px-4 py-3 font-medium">Role</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">{t("table.lastLogin")}</th>
                    <th className="px-4 py-3 text-right font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((u) => (
                    <tr
                      key={u.id}
                      onClick={() => router.push(`/dashboard/vendor/users/${u.id}`)}
                      className="cursor-pointer border-b border-zinc-100 last:border-0 hover:bg-zinc-50"
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium text-zinc-900">{u.name}</div>
                        {u.is_current_user && <span className="text-[10px] text-zinc-400">(you)</span>}
                      </td>
                      <td className="px-4 py-3 text-zinc-600">{u.email}</td>
                      <td className="px-4 py-3 text-zinc-700">{u.primary_role_label ?? u.primary_role}</td>
                      <td className="px-4 py-3">
                        <Badge className={`${STATUS_BADGE[u.status] ?? ""} border text-xs`}>{u.status}</Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-zinc-500">
                        {u.last_login_at ? new Date(u.last_login_at).toLocaleString("id-ID") : "—"}
                      </td>
                      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        {isAdmin ? (
                          <RowActions
                            user={u}
                            onChangeRole={() => setRoleTarget(u)}
                            onChangeStatus={() => setStatusTarget(u)}
                            onResetPassword={() => setPwTarget(u)}
                          />
                        ) : (
                          <span className="text-xs text-zinc-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {data?.meta && data.meta.last_page > 1 && (
            <div className="flex items-center justify-between border-t border-zinc-100 px-4 py-3 text-sm">
              <span className="text-zinc-500">Page {data.meta.current_page} of {data.meta.last_page}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={data.meta.current_page <= 1} onClick={() => setPage(data.meta.current_page - 1)}>Prev</Button>
                <Button variant="outline" size="sm" disabled={data.meta.current_page >= data.meta.last_page} onClick={() => setPage(data.meta.current_page + 1)}>Next</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <VendorUserFormDialog open={createOpen} onOpenChange={setCreateOpen} />
      <VendorChangeRoleDialog open={!!roleTarget} onOpenChange={(o) => !o && setRoleTarget(null)} target={roleTarget} />
      <VendorChangeStatusDialog open={!!statusTarget} onOpenChange={(o) => !o && setStatusTarget(null)} target={statusTarget} />
      <VendorResetPasswordDialog open={!!pwTarget} onOpenChange={(o) => !o && setPwTarget(null)} target={pwTarget} />
    </div>
  );
}

function RowActions({
  user,
  onChangeRole,
  onChangeStatus,
  onResetPassword,
}: {
  user: VendorUser;
  onChangeRole: () => void;
  onChangeStatus: () => void;
  onResetPassword: () => void;
}) {
  const tAct = useTranslations("Vendor.users.actions");
  const tCommon = useTranslations("Vendor.common");
  const [open, setOpen] = useState(false);
  return (
    <div className="relative inline-block text-left">
      <Button size="sm" variant="ghost" onClick={() => setOpen((o) => !o)}>
        <MoreHorizontal className="h-4 w-4" />
      </Button>
      {open && (
        <div
          className="absolute right-0 z-10 mt-1 w-44 origin-top-right rounded-md border border-zinc-200 bg-white py-1 shadow-md"
          onMouseLeave={() => setOpen(false)}
        >
          <MenuItem icon={ShieldCheck} label={tAct("changeRole")} onClick={() => { onChangeRole(); setOpen(false); }} />
          {!user.is_current_user && (
            <MenuItem icon={Power} label={user.status === "active" ? tCommon("deactivate") : tCommon("activate")} onClick={() => { onChangeStatus(); setOpen(false); }} />
          )}
          <MenuItem icon={KeyRound} label={tAct("resetPassword")} onClick={() => { onResetPassword(); setOpen(false); }} />
          <MenuItem icon={Edit} label={tAct("viewDetail")} onClick={() => window.location.assign(`/dashboard/vendor/users/${user.id}`)} />
        </div>
      )}
    </div>
  );
}

function MenuItem({ icon: Icon, label, onClick }: { icon: React.ComponentType<{ className?: string }>; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-zinc-700 hover:bg-zinc-50"
    >
      <Icon className="h-3.5 w-3.5 text-zinc-500" />
      {label}
    </button>
  );
}
