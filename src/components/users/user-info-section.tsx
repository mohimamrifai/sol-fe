"use client";

import { useTranslations } from "next-intl";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { User, Mail, Phone } from "lucide-react";
import type { UserRow } from "./user-table";

interface Props {
  user: UserRow;
}

export function UserInfoSection({ user }: Props) {
  const t = useTranslations("Users.detail.sections");
  const tField = useTranslations("Users.detail.fields");

  const rows: Array<{ icon: React.ReactNode; label: string; value: React.ReactNode }> = [
    { icon: <User className="h-4 w-4 text-zinc-500" />, label: tField("name"), value: user.name ?? "—" },
    { icon: <Mail className="h-4 w-4 text-zinc-500" />, label: tField("email"), value: user.email ?? "—" },
    { icon: <Phone className="h-4 w-4 text-zinc-500" />, label: tField("phone"), value: user.phone ?? "—" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold tracking-tight text-zinc-900">
          {t("info")}
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
