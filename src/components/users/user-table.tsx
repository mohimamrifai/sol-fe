"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { Eye, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { PaginationBar } from "@/components/data-table/pagination-bar";

export interface UserRow {
  id: number;
  name?: string;
  email?: string;
  phone?: string;
  status?: string;
  role?: string;
  roles?: { name: string }[];
  locations?: Array<{ id: number; name: string }>;
  location_access?: Array<{ id: number; name: string }>;
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

function userLocations(row: UserRow) {
  return row.locations ?? row.location_access ?? [];
}

export function UserTable({ rows, total, page, perPage, isLoading, onPageChange, onEdit }: Props) {
  const t = useTranslations("Users");
  const tStatus = useTranslations("Users.userStatus");
  const router = useRouter();

  const statusLabel = (s?: string): string => {
    if (!s) return "—";
    return tStatus.has(s as "active") ? tStatus(s as "active" | "inactive") : s;
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
        {t("table.empty")}
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
            <TableHead>{t("table.name")}</TableHead>
            <TableHead>{t("table.email")}</TableHead>
            <TableHead>{t("table.role")}</TableHead>
            <TableHead>{t("table.locations")}</TableHead>
            <TableHead>{t("table.status")}</TableHead>
            <TableHead>{t("table.lastLogin")}</TableHead>
            <TableHead className="text-right">{t("table.actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
            const roleName = row.role ?? row.roles?.[0]?.name ?? "";
            const locations = userLocations(row);
            return (
              <TableRow key={row.id}>
                <TableCell className="font-medium text-zinc-900">{row.name ?? "—"}</TableCell>
                <TableCell className="text-xs font-mono text-zinc-500">{row.email ?? "—"}</TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {roleName ? t(`role.${roleName}` as `role.${string}`) : "—"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {locations.length > 0 ? (
                      locations.slice(0, 2).map((l) => (
                        <Badge key={l.id} variant="outline" className="text-[10px]">{l.name}</Badge>
                      ))
                    ) : (
                      <span className="text-xs text-zinc-500">—</span>
                    )}
                    {locations.length > 2 ? (
                      <Badge variant="outline" className="text-[10px]">+{locations.length - 2}</Badge>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={statusBadgeClass[row.status ?? ""] ?? ""}>
                    {statusLabel(row.status)}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs font-mono text-zinc-500">{fmtDate(row.last_login_at)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 gap-1"
                      onClick={() => router.push(`/dashboard/users/${row.id}`)}
                    >
                      <Eye className="h-4 w-4" />
                      {t("table.detail")}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 gap-1"
                      onClick={() => onEdit(row)}
                    >
                      <Pencil className="h-4 w-4" />
                      {t("table.edit")}
                    </Button>
                  </div>
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
