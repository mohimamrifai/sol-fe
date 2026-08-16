"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { AlertCircle, CheckCircle2, Clock, Wallet, type LucideIcon } from "lucide-react";
import { ClickableStatCardShell } from "@/components/shared/clickable-stat-card-shell";
import { cn } from "@/lib/utils";
import type { PaymentStats } from "@/lib/payment-types";

type Counts = PaymentStats;

const ICONS: Record<keyof Counts, LucideIcon> = {
  unpaid: Clock,
  partially_paid: Wallet,
  paid: CheckCircle2,
  overdue: AlertCircle,
};

const TONES: Record<keyof Counts, string> = {
  unpaid: "bg-sky-100 text-sky-700",
  partially_paid: "bg-amber-100 text-amber-700",
  paid: "bg-emerald-100 text-emerald-700",
  overdue: "bg-rose-100 text-rose-700",
};

const KEYS: (keyof Counts)[] = ["unpaid", "partially_paid", "paid", "overdue"];

interface Props {
  counts: Counts;
  onCardClick?: (key: keyof Counts) => void;
}

export function PaymentStatsCards({ counts, onCardClick }: Props) {
  const t = useTranslations("Payments");

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {KEYS.map((key) => {
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
