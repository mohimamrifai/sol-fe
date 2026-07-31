"use client";

import { useTranslations } from "next-intl";
import { History } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export interface ActivityEntry {
  occurred_at?: string | null;
  title?: string;
  description?: string;
  source?: string;
  actor_name?: string;
}

interface Props { entries: ActivityEntry[] }

function fmtDate(s?: string | null) {
  if (!s) return "—";
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  return d.toLocaleString("id-ID", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ActivityLogSection({ entries }: Props) {
  const t = useTranslations("Shipments.detail.section7");
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-zinc-600" />
          <CardTitle className="text-base font-semibold tracking-tight text-zinc-900">
            {t("title")}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <p className="py-6 text-center text-sm text-zinc-500">{t("noEntries")}</p>
        ) : (
          <ol className="space-y-3">
            {entries.map((e, idx) => (
              <li
                key={idx}
                className="flex gap-3 rounded-lg border border-zinc-100 bg-zinc-50/50 p-3"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="text-sm font-medium text-zinc-900">{e.title ?? "—"}</p>
                  {e.description ? (
                    <p className="text-xs text-zinc-600">{e.description}</p>
                  ) : null}
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-zinc-500">
                    <time className="font-mono">{fmtDate(e.occurred_at)}</time>
                    {e.actor_name ? <span>· {e.actor_name}</span> : null}
                    {e.source ? <span className="rounded bg-zinc-200 px-1.5 py-0.5 text-[10px] uppercase tracking-wider">{e.source}</span> : null}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
