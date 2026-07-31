"use client";

import { useTranslations } from "next-intl";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface TrackingEntry {
  occurred_at?: string | null;
  title?: string;
  description?: string;
  location?: string | null;
  status?: string;
}

interface Props {
  entries: TrackingEntry[];
}

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

const COMPLETED = new Set([
  "booking_created",
  "created",
  "survey_completed",
  "cargo_received",
  "stuffing_container",
  "container_sealed",
  "train_departed",
  "departed",
  "train_arrived",
  "arrived",
  "container_unloading",
  "unloading",
  "ready_for_pickup",
  "completed",
]);

function nodeTone(status: string | undefined) {
  const k = (status ?? "").toLowerCase();
  if (k === "cancelled") return "bg-rose-500 ring-rose-100";
  if (k === "completed") return "bg-emerald-500 ring-emerald-100";
  if (COMPLETED.has(k)) return "bg-zinc-400 ring-zinc-100";
  return "bg-sky-500 ring-sky-100";
}

export function TrackingSection({ entries }: Props) {
  const t = useTranslations("Shipments.detail.section5");
  const sorted = [...entries].sort(
    (a, b) =>
      new Date(a.occurred_at ?? 0).getTime() -
      new Date(b.occurred_at ?? 0).getTime()
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold tracking-tight text-zinc-900">
          {t("title")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {sorted.length === 0 ? (
          <p className="py-6 text-center text-sm text-zinc-500">{t("noEntries")}</p>
        ) : (
          <ol className="relative ml-1.5 border-l border-zinc-200">
            {sorted.map((e, idx) => (
              <li key={`${e.occurred_at ?? "t"}-${idx}`} className="relative pb-5 pl-6 last:pb-0">
                <span
                  className={cn(
                    "absolute -left-[7px] top-1.5 h-3 w-3 rounded-full ring-4",
                    nodeTone(e.status)
                  )}
                />
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-sm font-medium text-zinc-900">
                    {e.title ?? e.status ?? "—"}
                  </p>
                  <time className="font-mono text-[11px] tabular-nums text-zinc-500">
                    {fmtDate(e.occurred_at)}
                  </time>
                </div>
                {e.location ? (
                  <p className="mt-0.5 text-xs text-zinc-500">{e.location}</p>
                ) : null}
                {e.description ? (
                  <p className="mt-1 text-xs leading-relaxed text-zinc-600">{e.description}</p>
                ) : null}
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
