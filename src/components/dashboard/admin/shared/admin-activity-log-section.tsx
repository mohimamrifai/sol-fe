"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslations } from "next-intl";

type ActivityEntry = {
  description?: string;
  user?: string;
  occurred_at?: string;
};

type AdminActivityLogSectionProps = {
  title?: string;
  entries?: ActivityEntry[] | null;
};

export function AdminActivityLogSection({ title, entries }: AdminActivityLogSectionProps) {
  const t = useTranslations("AdminFsdSettings");
  const rows = entries ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title ?? t("activityLog.title")}</CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("activityLog.empty")}</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {rows.map((entry, index) => (
              <li key={`${entry.occurred_at ?? index}-${entry.description ?? index}`} className="rounded-md border border-border px-3 py-2">
                <p>{entry.description ?? "—"}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {[entry.user, entry.occurred_at ? new Date(entry.occurred_at).toLocaleString() : null]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
