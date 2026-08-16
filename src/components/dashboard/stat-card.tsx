"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { type LucideIcon } from "lucide-react";
import { ClickableStatCardShell } from "@/components/shared/clickable-stat-card-shell";
import { formatIdr } from "./format";
import { cn } from "@/lib/utils";

interface StatCardProps {
  labelKey: string; // i18n key under "Dashboard.cards.<key>"
  descriptionKey: string; // i18n key under "Dashboard.cards.<key>Description" (or *Hint)
  value: number;
  icon: LucideIcon;
  iconClassName?: string;
  /** When true, value is rendered as IDR currency. */
  asCurrency?: boolean;
  /** When set, the card navigates to the filtered list page. */
  href?: string;
}

/**
 * Compact read-only stat card for the customer dashboard.
 *
 * Layout:
 *  - top row: uppercase label + main icon
 *  - main value in big tabular numerals
 *  - short description below
 */
export function StatCard({
  labelKey,
  descriptionKey,
  value,
  icon: Icon,
  iconClassName = "bg-zinc-100 text-zinc-700",
  asCurrency = false,
  href,
}: StatCardProps) {
  const t = useTranslations("Dashboard.cards");
  const formatted = asCurrency
    ? formatIdr(value)
    : new Intl.NumberFormat("id-ID").format(value);

  return (
    <ClickableStatCardShell href={href}>
      <div className="flex items-start justify-between gap-2">
        <span className="font-semibold uppercase tracking-wider text-[10px] text-zinc-500">
          {t(labelKey)}
        </span>
        <span
          className={cn(
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
            iconClassName,
          )}
        >
          <Icon className="h-4 w-4" />
        </span>
      </div>

      <div
        className={cn(
          "truncate tabular-nums font-bold tracking-tight text-zinc-900",
          asCurrency ? "text-lg sm:text-xl" : "text-2xl sm:text-3xl",
        )}
        title={formatted}
      >
        {formatted}
      </div>

      <p className="text-xs leading-snug text-zinc-500">{t(descriptionKey)}</p>
    </ClickableStatCardShell>
  );
}
