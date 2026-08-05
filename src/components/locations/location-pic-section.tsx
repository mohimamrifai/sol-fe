"use client";

import { useTranslations } from "next-intl";
import { User, Mail, Phone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { LocationRow } from "./location-table";

interface Props {
  location: LocationRow;
}

export function LocationPicSection({ location }: Props) {
  const t = useTranslations("Locations.detail.sections");
  const tField = useTranslations("Locations.detail.fields");

  const name = location.pic_name;
  const email = location.pic_email;
  const mobile = location.pic_mobile;

  if (!name && !email && !mobile) return null;

  const rows: Array<{ icon: React.ReactNode; label: string; value: React.ReactNode }> = [
    { icon: <User className="h-4 w-4 text-zinc-500" />, label: tField("picName"), value: name ?? "—" },
    { icon: <Mail className="h-4 w-4 text-zinc-500" />, label: tField("picEmail"), value: email ?? "—" },
    { icon: <Phone className="h-4 w-4 text-zinc-500" />, label: tField("picMobile"), value: mobile ?? "—" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold tracking-tight text-zinc-900">
          {t("pic")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
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
