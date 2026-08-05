"use client";

import { useTranslations } from "next-intl";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, MapPin, ListChecks, BadgeCheck } from "lucide-react";
import type { UserRow } from "./user-table";

interface Props {
  user: UserRow;
}

const FEATURE_KEYS = [
  "view_company", "manage_company",
  "view_locations", "manage_locations",
  "view_users", "create_users", "edit_users",
  "view_bookings", "create_bookings", "manage_bookings",
  "view_shipments", "view_invoices", "view_payments",
  "view_documents", "manage_documents",
];

const statusBadgeClass: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700 ring-emerald-200/60",
  inactive: "bg-zinc-100 text-zinc-600 ring-zinc-200/60",
};

export function UserConfigSection({ user }: Props) {
  const t = useTranslations("Users.detail.sections");
  const tField = useTranslations("Users.detail.fields");
  const tRole = useTranslations("Users.role");
  const tStatus = useTranslations("Users.userStatus");
  const tFeature = useTranslations("Users.featureAccess");

  type RoleKey = "company_admin" | "ops_pic" | "finance_pic" | "viewer";

  const roleName = user.role ?? user.roles?.[0]?.name ?? "";
  const features: string[] = user.feature_access ?? [];
  const locations = user.locations ?? [];

  const statusLabel = (s?: string): string => {
    if (!s) return "—";
    try {
      return tStatus.has(s as "active") ? tStatus(s as "active" | "inactive") : s;
    } catch {
      return s;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold tracking-tight text-zinc-900">
          {t("configuration")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            <ShieldCheck className="mr-1 inline h-3 w-3" />
            {tField("role")}
          </p>
          <Badge variant="secondary" className="text-sm">
            {roleName ? tRole(roleName as RoleKey) : "—"}
          </Badge>
        </div>

        <div className="space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            <BadgeCheck className="mr-1 inline h-3 w-3" />
            {tField("status")}
          </p>
          <Badge variant="outline" className={statusBadgeClass[user.status ?? ""] ?? ""}>
            {statusLabel(user.status)}
          </Badge>
        </div>

        <div className="space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            <MapPin className="mr-1 inline h-3 w-3" />
            {tField("locations")}
          </p>
          {locations.length === 0 ? (
            <p className="text-sm text-zinc-500">{tField("noLocations")}</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {locations.map((l) => (
                <Badge key={l.id} variant="outline" className="text-xs">
                  {l.name}
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            <ListChecks className="mr-1 inline h-3 w-3" />
            {tField("featureAccess")}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {features.length === 0 ? (
              <p className="text-sm text-zinc-500">{tField("noFeatureAccess")}</p>
            ) : (
              features.map((f: string) => (
                <Badge key={f} variant="secondary" className="text-[10px]">
                  {FEATURE_KEYS.includes(f) ? tFeature(f as `featureAccess.${string}`) : f}
                </Badge>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
