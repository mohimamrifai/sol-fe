"use client";

import { useTranslations } from "next-intl";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Hash, Building2, Phone, Power, Calendar } from "lucide-react";
import type { LocationRow } from "./location-table";

interface Props {
  location: LocationRow;
}

function fmtDate(s?: string) {
  if (!s) return "—";
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  return d.toLocaleString("id-ID", {
    year: "numeric", month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit",
  });
}

export function LocationInfoSection({ location }: Props) {
  const t = useTranslations("Locations.detail.fields");
  const tSections = useTranslations("Locations.detail.sections");
  const tType = useTranslations("Locations.type");
  const tStatus = useTranslations("Locations.status");

  const statusLabel = (s?: string): string => {
    if (!s) return "—";
    try {
      return tStatus.has(s as "active") ? tStatus(s as "active" | "inactive") : s;
    } catch {
      return s;
    }
  };

  const rows: Array<{ icon: React.ReactNode; label: string; value: React.ReactNode }> = [
    { icon: <Hash className="h-4 w-4 text-zinc-500" />, label: t("code"), value: <span className="font-mono">{location.code ?? "—"}</span> },
    { icon: <Building2 className="h-4 w-4 text-zinc-500" />, label: t("type"), value: location.type ? tType(location.type as `type.${string}`) : "—" },
    { icon: <Building2 className="h-4 w-4 text-zinc-500" />, label: t("name"), value: location.name ?? "—" },
    { icon: <Phone className="h-4 w-4 text-zinc-500" />, label: t("phone"), value: location.phone ?? "—" },
    { icon: <Power className="h-4 w-4 text-zinc-500" />, label: t("status"), value: statusLabel(location.status) },
    { icon: <Calendar className="h-4 w-4 text-zinc-500" />, label: t("createdAt"), value: fmtDate(location.created_at) },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold tracking-tight text-zinc-900">
          {tSections("info")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-1 gap-3">
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
