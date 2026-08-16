"use client";

import { useTranslations } from "next-intl";
import { Users, CheckCircle2, XCircle, Shield, type LucideIcon } from "lucide-react";
import { ClickableStatCardShell } from "@/components/shared/clickable-stat-card-shell";
import { cn } from "@/lib/utils";

interface Counts {
  total: number;
  active: number;
  inactive: number;
  company_admin: number;
}

const ICONS: Record<keyof Counts, LucideIcon> = {
  total: Users,
  active: CheckCircle2,
  inactive: XCircle,
  company_admin: Shield,
};

const TONES: Record<keyof Counts, string> = {
  total: "bg-zinc-100 text-zinc-700",
  active: "bg-emerald-100 text-emerald-700",
  inactive: "bg-zinc-100 text-zinc-500",
  company_admin: "bg-sky-100 text-sky-700",
};

const KEYS: (keyof Counts)[] = ["total", "active", "inactive", "company_admin"];

interface Props {
  counts: Partial<Counts>;
  onCardClick?: (key: keyof Counts) => void;
}

export function UserStatsCards({ counts, onCardClick }: Props) {
  const t = useTranslations("Users");

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {KEYS.map((key) => {
        const Icon = ICONS[key];
        const value = counts[key] ?? 0;
        return (
          <ClickableStatCardShell
            key={key}
            onClick={onCardClick ? () => onCardClick(key) : undefined}
          >
            <div className="flex items-start justify-between gap-2">
              <span className="font-semibold uppercase tracking-wider text-[10px] text-zinc-500">
                {t(`stats.${key === "company_admin" ? "companyAdmin" : key}`)}
              </span>
              <span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-lg", TONES[key])}>
                <Icon className="h-4 w-4" />
              </span>
            </div>
            <div className="truncate tabular-nums font-bold tracking-tight text-zinc-900 text-2xl sm:text-3xl">
              {new Intl.NumberFormat("id-ID").format(value)}
            </div>
          </ClickableStatCardShell>
        );
      })}
    </div>
  );
}
