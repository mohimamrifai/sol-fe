"use client";

import { useTranslations } from "next-intl";
import { CardDescription, CardTitle } from "@/components/ui/card";
import { ClickableStatCardShell } from "@/components/shared/clickable-stat-card-shell";
import { CheckCircle2, ClipboardClock, FilePenLine } from "lucide-react";
import { BOOKING_FSD_STAT_META, type BookingFsdStatKey } from "@/lib/booking-status";

interface BookingStatsProps {
  countDraft: number;
  countSubmitted: number;
  countConfirmed: number;
  onCardClick?: (key: BookingFsdStatKey) => void;
}

export function BookingStats({
  countDraft,
  countSubmitted,
  countConfirmed,
  onCardClick,
}: BookingStatsProps) {
  const t = useTranslations("AdminBookings");

  const cards = [
    { key: "draft" as const, count: countDraft, icon: FilePenLine },
    { key: "submitted" as const, count: countSubmitted, icon: ClipboardClock },
    { key: "confirmed" as const, count: countConfirmed, icon: CheckCircle2 },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {cards.map(({ key, count, icon: Icon }) => {
        const meta = BOOKING_FSD_STAT_META[key];
        return (
          <ClickableStatCardShell
            key={key}
            onClick={onCardClick ? () => onCardClick(key) : undefined}
          >
            <div className="flex items-center justify-between gap-2">
              <CardDescription className="font-medium">{t(`stats.${key}`)}</CardDescription>
              <span className={`rounded-md p-1.5 ${meta.iconBg} ${meta.iconColor}`}>
                <Icon className="h-3.5 w-3.5" aria-hidden />
              </span>
            </div>
            <CardTitle className="flex flex-col gap-0.5 text-2xl font-semibold">
              <span>{count}</span>
              <span className="text-xs font-normal text-muted-foreground">{t(`stats.${key}Hint`)}</span>
            </CardTitle>
          </ClickableStatCardShell>
        );
      })}
    </div>
  );
}
