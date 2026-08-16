"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { FileText, Send, CheckCircle2, XCircle, type LucideIcon } from "lucide-react";
import { ClickableStatCardShell } from "@/components/shared/clickable-stat-card-shell";
import { BOOKING_STATUS_KEYS } from "@/lib/booking-status";
import { cn } from "@/lib/utils";

type Counts = { draft: number; submitted: number; approved: number; rejected: number };

const ICONS: Record<keyof Counts, LucideIcon> = {
  draft: FileText,
  submitted: Send,
  approved: CheckCircle2,
  rejected: XCircle,
};

const TONES: Record<keyof Counts, string> = {
  draft: "bg-slate-100 text-slate-700",
  submitted: "bg-amber-100 text-amber-700",
  approved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-rose-100 text-rose-700",
};

interface Props {
  counts: Partial<Record<keyof Counts, number>>;
  onCardClick?: (key: keyof Counts) => void;
}

export function BookingStatsCards({ counts, onCardClick }: Props) {
  const t = useTranslations("Bookings");

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {BOOKING_STATUS_KEYS.map((key) => {
        const Icon = ICONS[key];
        const value = counts[key] ?? 0;
        const description = t(`stats.${key}`);
        return (
          <ClickableStatCardShell
            key={key}
            onClick={onCardClick ? () => onCardClick(key) : undefined}
          >
            <div className="flex items-start justify-between gap-2">
              <span className="font-semibold uppercase tracking-wider text-[10px] text-zinc-500">
                {t(`card.${key}`)}
              </span>
              <span
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
                  TONES[key]
                )}
              >
                <Icon className="h-4 w-4" />
              </span>
            </div>
            <div className="truncate tabular-nums font-bold tracking-tight text-zinc-900 text-2xl sm:text-3xl">
              {new Intl.NumberFormat("id-ID").format(value)}
            </div>
            <p className="text-xs leading-snug text-zinc-500">{description}</p>
          </ClickableStatCardShell>
        );
      })}
    </div>
  );
}
