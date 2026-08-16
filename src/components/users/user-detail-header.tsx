"use client";

import { useTranslations } from "next-intl";
import { Pencil, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { UserRow } from "./user-table";

interface Props {
  user: UserRow;
  onEdit: () => void;
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

export function UserDetailHeader({ user, onEdit }: Props) {
  const t = useTranslations("Users");
  const tRole = useTranslations("Users.role");
  const tStatus = useTranslations("Users.userStatus");

  const roleName = user.role ?? user.roles?.[0]?.name ?? "";

  const statusLabel = (s?: string): string => {
    if (!s) return "—";
    return tStatus.has(s as "active") ? tStatus(s as "active" | "inactive") : s;
  };

  return (
    <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
      <div className="min-w-0">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900 sm:text-2xl">
          {user.name ?? "—"}
        </h1>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {roleName ? (
            <Badge variant="secondary">
              {tRole(roleName as "company_admin" | "ops_pic" | "finance_pic" | "viewer")}
            </Badge>
          ) : null}
          <Badge variant="outline" className={statusBadgeClass[user.status ?? ""] ?? ""}>
            {statusLabel(user.status)}
          </Badge>
          <span className="inline-flex items-center gap-1 text-xs text-zinc-500">
            <Clock className="h-3 w-3" />
            {t("detail.security.lastLogin")}: {fmtDate(user.last_login_at)}
          </span>
        </div>
      </div>
      <Button variant="outline" size="sm" onClick={onEdit} className="h-9 gap-2">
        <Pencil className="h-4 w-4" />
        {t("detail.actions.edit")}
      </Button>
    </div>
  );
}
