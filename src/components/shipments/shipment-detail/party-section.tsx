"use client";

import { useTranslations } from "next-intl";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export interface PartyData {
  name?: string | null;
  phone?: string | null;
  address?: string | null;
  type?: string | null;
  branch_id?: number | null;
}

interface Props {
  data?: PartyData | null;
  variant: "shipper" | "consignee";
}

export function PartySection({ data, variant }: Props) {
  const t = useTranslations(
    `Shipments.detail.section${variant === "shipper" ? "2" : "3"}`
  );

  const fields: { label: string; value: string | null | undefined }[] = [
    { label: t("name"), value: data?.name ?? null },
    { label: t("phone"), value: data?.phone ?? null },
    { label: t("address"), value: data?.address ?? null },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold tracking-tight text-zinc-900">
          {t("title")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {fields.every((f) => !f.value) ? (
          <p className="text-sm text-zinc-500">{t("noData")}</p>
        ) : (
          <dl className="space-y-2">
            {fields.map((f, idx) => (
              <div
                key={idx}
                className="flex items-start justify-between gap-3 rounded-lg border border-zinc-100 bg-zinc-50/50 px-3 py-2"
              >
                <dt className="text-xs font-medium text-zinc-500">{f.label}</dt>
                <dd className="max-w-[60%] text-right text-sm text-zinc-900">{f.value ?? "—"}</dd>
              </div>
            ))}
          </dl>
        )}
      </CardContent>
    </Card>
  );
}
