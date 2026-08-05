"use client";

import { useTranslations } from "next-intl";
import { useAuthStore } from "@/lib/store";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, ShieldCheck, BadgeCheck, Clock, Calendar } from "lucide-react";

interface UserExtras {
  status?: string;
  last_login_at?: string | null;
  created_at?: string | null;
  company_name?: string;
  company?: { name?: string };
}

type RoleKey = "company_admin" | "ops_pic" | "finance_pic" | "viewer" | "super_admin";

function fmtDate(s?: string | null) {
  if (!s) return "—";
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  return d.toLocaleString("id-ID", {
    year: "numeric", month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit",
  });
}

const roleLabel = (r: string) => {
  switch (r) {
    case "company_admin": return "Company Admin";
    case "ops_pic": return "Ops PIC";
    case "finance_pic": return "Finance PIC";
    case "viewer": return "Viewer";
    case "super_admin": return "Super Admin";
    default: return r;
  }
};

export function ProfileAccountSection() {
  const t = useTranslations("Profile");
  const tRole = useTranslations("Users.role");
  const tStatus = useTranslations("Profile.accountStatus");
  const { user } = useAuthStore();
  const u = user as unknown as UserExtras | null;
  const roles = user?.roles ?? [];
  const primaryRole = roles[0] ?? "";

  const roleTranslation = (key: string): string => {
    const typedKey = key as RoleKey;
    return tRole.has(`role.${typedKey}` as `role.${RoleKey}`)
      ? tRole(`role.${typedKey}` as `role.${RoleKey}`)
      : roleLabel(key);
  };

  const statusLabel = (s?: string): string => {
    if (!s) return "—";
    try {
      return tStatus.has(s as "active") ? tStatus(s as "active" | "inactive") : s;
    } catch {
      return s;
    }
  };

  const rows: Array<{ icon: React.ReactNode; label: string; value: React.ReactNode }> = [
    { icon: <Building2 className="h-4 w-4 text-zinc-500" />, label: t("account.company"), value: u?.company?.name ?? u?.company_name ?? "—" },
    {
      icon: <ShieldCheck className="h-4 w-4 text-zinc-500" />,
      label: t("account.role"),
      value: primaryRole ? <Badge variant="secondary">{roleTranslation(primaryRole)}</Badge> : "—",
    },
    {
      icon: <BadgeCheck className="h-4 w-4 text-zinc-500" />,
      label: t("account.status"),
      value: u?.status ? <Badge variant="outline" className={u.status === "active" ? "bg-emerald-50 text-emerald-700 ring-emerald-200/60" : "bg-zinc-100 text-zinc-600"}>{statusLabel(u.status)}</Badge> : "—",
    },
    { icon: <Clock className="h-4 w-4 text-zinc-500" />, label: t("account.lastLogin"), value: <span className="font-mono text-xs">{fmtDate(u?.last_login_at)}</span> },
    { icon: <Calendar className="h-4 w-4 text-zinc-500" />, label: t("account.createdAt"), value: <span className="font-mono text-xs">{fmtDate(u?.created_at)}</span> },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-semibold tracking-tight text-zinc-900">
          <ShieldCheck className="h-4 w-4 text-zinc-600" />
          {t("sections.accountInfo")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {rows.map((row, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3 rounded-lg border border-zinc-100 bg-zinc-50/50 px-3 py-2.5"
            >
              <div className="mt-0.5">{row.icon}</div>
              <div className="min-w-0 flex-1">
                <dt className="text-xs font-medium text-zinc-500">{row.label}</dt>
                <dd className="mt-0.5 text-sm font-medium text-zinc-900 break-words">{row.value}</dd>
              </div>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}
