"use client";

import { useTranslations } from "next-intl";
import { MapPin, Building2, Warehouse, CheckCircle2, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Counts {
  total: number;
  head_office: number;
  branch_office: number;
  warehouse: number;
  active: number;
}

const ICONS: Record<keyof Counts, LucideIcon> = {
  total: MapPin,
  head_office: Building2,
  branch_office: Building2,
  warehouse: Warehouse,
  active: CheckCircle2,
};

const TONES: Record<keyof Counts, string> = {
  total: "bg-zinc-100 text-zinc-700",
  head_office: "bg-sky-100 text-sky-700",
  branch_office: "bg-indigo-100 text-indigo-700",
  warehouse: "bg-amber-100 text-amber-700",
  active: "bg-emerald-100 text-emerald-700",
};

const KEYS: (keyof Counts)[] = ["total", "head_office", "branch_office", "warehouse", "active"];

interface Props {
  counts: Partial<Counts>;
}

export function LocationStatsCards({ counts }: Props) {
  const t = useTranslations("Locations");

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {KEYS.map((key) => {
        const Icon = ICONS[key];
        const value = counts[key] ?? 0;
        return (
          <div
            key={key}
            className="flex h-full flex-col gap-3 overflow-hidden rounded-xl border border-zinc-200/80 bg-white p-4 shadow-[0_1px_2px_0_rgb(0_0_0/0.04)] sm:p-5"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="font-semibold uppercase tracking-wider text-[10px] text-zinc-500">
                {t(`stats.${key === "head_office" ? "headOffice" : key === "branch_office" ? "branchOffice" : key === "warehouse" ? "warehouse" : key === "active" ? "active" : "total"}`)}
              </span>
              <span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-lg", TONES[key])}>
                <Icon className="h-4 w-4" />
              </span>
            </div>
            <div className="truncate tabular-nums font-bold tracking-tight text-zinc-900 text-2xl sm:text-3xl">
              {new Intl.NumberFormat("id-ID").format(value)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
