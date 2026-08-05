"use client";

import { useTranslations } from "next-intl";
import { MapPinned, Building, Hash, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { LocationRow } from "./location-table";

interface Props {
  location: LocationRow;
}

export function LocationAddressSection({ location }: Props) {
  const t = useTranslations("Locations.detail.sections");
  const tField = useTranslations("Locations.detail.fields");

  const rows: Array<{ icon: React.ReactNode; label: string; value: React.ReactNode }> = [
    { icon: <MapPinned className="h-4 w-4 text-zinc-500" />, label: tField("country"), value: location.country ?? "—" },
    { icon: <MapPinned className="h-4 w-4 text-zinc-500" />, label: tField("province"), value: location.province ?? "—" },
    { icon: <Building className="h-4 w-4 text-zinc-500" />, label: tField("city"), value: location.city ?? "—" },
    { icon: <Hash className="h-4 w-4 text-zinc-500" />, label: tField("district"), value: location.district ?? "—" },
    { icon: <Hash className="h-4 w-4 text-zinc-500" />, label: tField("postalCode"), value: location.postal_code ?? "—" },
    { icon: <FileText className="h-4 w-4 text-zinc-500" />, label: tField("address"), value: location.address ?? "—" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold tracking-tight text-zinc-900">
          {t("address")}
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
