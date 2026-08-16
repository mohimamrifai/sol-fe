"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { History, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCustomerLocationActivities } from "@/hooks/use-customer-location-activities";

interface Props {
  locationId: number;
}

interface Entry {
  id?: number | string;
  occurred_at?: string | null;
  title?: string;
  description?: string;
  actor_name?: string;
}

function fmtDate(s?: string | null) {
  if (!s) return "—";
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  return d.toLocaleString("id-ID", {
    year: "numeric", month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit",
  });
}

export function LocationActivitySection({ locationId }: Props) {
  const t = useTranslations("Locations");
  const [page, setPage] = React.useState(1);
  const perPage = 15;

  const { data, isLoading, isFetching } = useCustomerLocationActivities(locationId, { page, perPage });

  const entries: Entry[] = data?.data ?? [];
  const lastPage = data?.last_page ?? 1;
  const total = data?.total ?? 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-semibold tracking-tight text-zinc-900">
          <History className="h-4 w-4 text-zinc-600" />
          {t("activities.title")}
        </CardTitle>
        <CardDescription className="text-xs">{t("activities.description")}</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <p className="py-6 text-center text-sm text-zinc-500">{t("activities.empty")}</p>
        ) : (
          <>
            <ol className="space-y-2">
              {entries.map((e, idx) => (
                <li
                  key={e.id ?? idx}
                  className="rounded-lg border border-zinc-100 bg-zinc-50/50 p-3"
                >
                  <p className="text-sm font-medium text-zinc-900">{e.title ?? e.description ?? "—"}</p>
                  {e.description && e.description !== e.title ? (
                    <p className="mt-0.5 text-xs text-zinc-600">{e.description}</p>
                  ) : null}
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-zinc-500">
                    <time className="font-mono">{fmtDate(e.occurred_at)}</time>
                    {e.actor_name ? <span>· {t("activities.actor", { name: e.actor_name })}</span> : null}
                  </div>
                </li>
              ))}
            </ol>
            {lastPage > 1 ? (
              <div className="mt-4 flex items-center justify-between border-t pt-3">
                <p className="text-xs text-zinc-500">
                  Page {page} of {lastPage} ({total})
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1 || isFetching}
                    className="h-9"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
                    disabled={page >= lastPage || isFetching}
                    className="h-9"
                  >
                    {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronRight className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  );
}
