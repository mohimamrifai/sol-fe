"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { FileText, FolderOpen, Truck, Receipt, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DocumentStats } from "@/lib/document-types";

type Counts = DocumentStats;

const ICONS: Record<keyof Counts, LucideIcon> = {
  total: FileText,
  booking: FolderOpen,
  shipment: Truck,
  billing: Receipt,
};

const TONES: Record<keyof Counts, string> = {
  total: "bg-zinc-100 text-zinc-700",
  booking: "bg-sky-100 text-sky-700",
  shipment: "bg-amber-100 text-amber-700",
  billing: "bg-emerald-100 text-emerald-700",
};

const KEYS: (keyof Counts)[] = ["total", "booking", "shipment", "billing"];

interface Props {
  counts: Counts;
}

export function DocumentStatsCards({ counts }: Props) {
  const t = useTranslations("Documents");

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {KEYS.map((key) => {
        const Icon = ICONS[key];
        const value = counts[key] ?? 0;
        const description = t(`stats.${key}`);
        return (
          <div
            key={key}
            className="flex h-full flex-col gap-3 overflow-hidden rounded-xl border border-zinc-200/80 bg-white p-4 shadow-[0_1px_2px_0_rgb(0_0_0/0.04)] sm:p-5"
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
          </div>
        );
      })}
    </div>
  );
}
