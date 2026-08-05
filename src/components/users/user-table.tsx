"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { MoreHorizontal, Eye, Power, Pencil, Loader2, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { PaginationBar } from "@/components/data-table/pagination-bar";
import { useChangeUserStatus } from "@/hooks/use-customer-users-form";
import { rowNumber } from "@/lib/list-query";

export interface UserRow {
  id: number;
  name?: string;
  email?: string;
  phone?: string;
  status?: string;
  role?: string;
  roles?: { name: string }[];
  locations?: Array<{ id: number; name: string }>;
  location_ids?: number[];
  last_login_at?: string;
  created_at?: string;
  feature_access?: string[];
  is_current_user?: boolean;
  is_last_company_admin?: boolean;
}

interface Props {
  rows: UserRow[];
  total: number;
  page: number;
  perPage: number;
  isLoading: boolean;
  onPageChange: (p: number) => void;
  onEdit: (row: UserRow) => void;
  onChangeRole: (row: UserRow) => void;
  onResetPassword: (row: UserRow) => void;
}

const statusBadgeClass: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700 ring-emerald-200/60",
  inactive: "bg-zinc-100 text-zinc-600 ring-zinc-200/60",
};

function fmtDate(s?: string) {
  if (!s) return "—";
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  return d.toLocaleString("id-ID", {
    year: "numeric", month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit",
  });
}

export function UserTable({ rows, total, page, perPage, isLoading, onPageChange, onEdit, onChangeRole, onResetPassword }: Props) {
  const t = useTranslations("Users");
  const tStatus = useTranslations("Users.userStatus");
  const router = useRouter();
  const changeStatus = useChangeUserStatus();
  const [busyId, setBusyId] = React.useState<number | null>(null);

  const statusLabel = (s?: string): string => {
    if (!s) return "—";
    try {
      return tStatus.has(s as "active") ? tStatus(s as "active" | "inactive") : s;
    } catch {
      return s;
    }
  };

  const handleStatusToggle = async (row: UserRow) => {
    if (row.is_current_user) return;
    const next = row.status === "active" ? "inactive" : "active";
    setBusyId(row.id);
    try {
      await changeStatus.mutateAsync({ id: row.id, status: next as "active" | "inactive" });
    } finally {
      setBusyId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-md border border-dashed py-12 text-center text-sm text-zinc-500">
        No users found.
      </div>
    );
  }

  const lastPage = Math.max(1, Math.ceil(total / perPage));
  const from = (page - 1) * perPage + 1;
  const to = Math.min(page * perPage, total);

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">#</TableHead>
            <TableHead>{t("table.name")}</TableHead>
            <TableHead>{t("table.email")}</TableHead>
            <TableHead>{t("table.role")}</TableHead>
            <TableHead>{t("table.locations")}</TableHead>
            <TableHead>{t("table.status")}</TableHead>
            <TableHead>{t("table.lastLogin")}</TableHead>
            <TableHead className="w-12 text-right">{t("table.actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, idx) => {
            const roleName = row.role ?? row.roles?.[0]?.name ?? "";
            const initials = (row.name ?? row.email ?? "?").substring(0, 2).toUpperCase();
            return (
              <TableRow key={row.id}>
                <TableCell className="text-xs text-zinc-500">{rowNumber(page, perPage, idx)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar size="sm">
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="font-medium text-zinc-900">{row.name ?? "—"}</span>
                      {row.is_last_company_admin ? (
                        <Badge variant="outline" className="mt-0.5 w-fit bg-amber-50 text-amber-700 ring-amber-200/60 gap-1 text-[10px]">
                          <ShieldAlert className="h-3 w-3" />
                          Last Admin
                        </Badge>
                      ) : null}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-xs text-zinc-500 font-mono">{row.email ?? "—"}</TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {roleName ? t(`role.${roleName}` as `role.${string}`) : "—"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {row.locations && row.locations.length > 0 ? (
                      row.locations.slice(0, 2).map((l) => (
                        <Badge key={l.id} variant="outline" className="text-[10px]">{l.name}</Badge>
                      ))
                    ) : (
                      <span className="text-xs text-zinc-500">—</span>
                    )}
                    {row.locations && row.locations.length > 2 ? (
                      <Badge variant="outline" className="text-[10px]">+{row.locations.length - 2}</Badge>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={statusBadgeClass[row.status ?? ""] ?? ""}>
                    {statusLabel(row.status)}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-zinc-500 font-mono">{fmtDate(row.last_login_at)}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-zinc-100 disabled:opacity-50">
                      <MoreHorizontal className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => router.push(`/dashboard/users/${row.id}`)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEdit(row)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onChangeRole(row)}>
                        <ShieldAlert className="mr-2 h-4 w-4" />
                        {t("detail.actions.changeRole")}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onResetPassword(row)}>
                        <Power className="mr-2 h-4 w-4" />
                        {t("detail.actions.resetPassword")}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => void handleStatusToggle(row)}
                        disabled={busyId === row.id || row.is_current_user}
                      >
                        {busyId === row.id ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Power className="mr-2 h-4 w-4" />
                        )}
                        {row.status === "active" ? "Deactivate" : "Activate"}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      <div className="px-4 pb-3 pt-1">
        <PaginationBar
          currentPage={page}
          lastPage={lastPage}
          total={total}
          from={from}
          to={to}
          onPageChange={onPageChange}
        />
      </div>
    </div>
  );
}
