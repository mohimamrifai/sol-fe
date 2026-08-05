"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Pencil, Power, ShieldAlert, KeyRound, MoreHorizontal, Clock, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { UserRow } from "./user-table";

interface Props {
  user: UserRow;
  onEdit: () => void;
  onChangeRole: () => void;
  onChangeStatus: () => void;
  onResetPassword: () => void;
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

export function UserDetailHeader({ user, onEdit, onChangeRole, onChangeStatus, onResetPassword }: Props) {
  const t = useTranslations("Users");
  const tRole = useTranslations("Users.role");
  const tStatus = useTranslations("Users.userStatus");

  const roleName = user.role ?? user.roles?.[0]?.name ?? "";
  const initials = (user.name ?? user.email ?? "?").substring(0, 2).toUpperCase();

  const statusLabel = (s?: string): string => {
    if (!s) return "—";
    try {
      return tStatus.has(s as "active") ? tStatus(s as "active" | "inactive") : s;
    } catch {
      return s;
    }
  };

  return (
    <div className="rounded-lg border border-zinc-200 bg-white">
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4 min-w-0">
          <Avatar className="h-12 w-12 shrink-0">
            <AvatarFallback className="text-sm font-semibold">{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-semibold tracking-tight text-zinc-900 sm:text-xl">
                {user.name ?? "—"}
              </h1>
              {roleName ? (
                <Badge variant="secondary" className="text-[11px]">
                  {tRole(roleName as "company_admin" | "ops_pic" | "finance_pic" | "viewer")}
                </Badge>
              ) : null}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500">
              <span className="inline-flex items-center gap-1 font-mono">
                <User className="h-3 w-3" />
                {user.email ?? "—"}
              </span>
              <span className="inline-flex items-center gap-1">
                <Badge variant="outline" className={statusBadgeClass[user.status ?? ""] ?? ""}>
                  {statusLabel(user.status)}
                </Badge>
              </span>
              <span className="inline-flex items-center gap-1 font-mono">
                <Clock className="h-3 w-3" />
                {t("detail.security.lastLogin")}: {fmtDate(user.last_login_at)}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button size="sm" onClick={onEdit} className="h-9 gap-2">
            <Pencil className="h-4 w-4" />
            {t("detail.actions.edit")}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-zinc-200 bg-white hover:bg-zinc-50">
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onChangeRole} disabled={user.is_last_company_admin}>
                <ShieldAlert className="mr-2 h-4 w-4" />
                {t("detail.actions.changeRole")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onChangeStatus} disabled={user.is_current_user || user.is_last_company_admin}>
                <Power className="mr-2 h-4 w-4" />
                {t("detail.actions.changeStatus")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onResetPassword}>
                <KeyRound className="mr-2 h-4 w-4" />
                {t("detail.actions.resetPassword")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
