"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { CircleDashed, Truck, CheckCircle2, XCircle, type LucideIcon } from "lucide-react";
import { ClickableStatCardShell } from "@/components/shared/clickable-stat-card-shell";
import { SHIPMENT_STATUS_KEYS, shipmentStatusCardLabelKey } from "@/lib/shipment-status";
import { cn } from "@/lib/utils";

type Counts = { planning: number; in_progress: number; completed: number; cancelled: number };

const ICONS: Record<keyof Counts, LucideIcon> = {
  planning: CircleDashed,
  in_progress: Truck,
  completed: CheckCircle2,
  cancelled: XCircle,
};

const TONES: Record<keyof Counts, string> = {
  planning: "bg-zinc-100 text-zinc-700",
  in_progress: "bg-sky-100 text-sky-700",
  completed: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-rose-100 text-rose-700",
};

interface Props {
  counts: Counts;
  onCardClick?: (key: keyof Counts) => void;
}

export function ShipmentStatsCards({ counts, onCardClick }: Props) {
  const t = useTranslations("Shipments");

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {SHIPMENT_STATUS_KEYS.map((key) => {
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
                {t(shipmentStatusCardLabelKey(key))}
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
