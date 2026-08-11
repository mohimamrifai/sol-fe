"use client";

import { useTranslations } from "next-intl";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, ClipboardClock, FilePenLine } from "lucide-react";
import { BOOKING_FSD_STAT_META } from "@/lib/booking-status";

interface BookingStatsProps {
  countDraft: number;
  countSubmitted: number;
  countConfirmed: number;
}

export function BookingStats({
  countDraft,
  countSubmitted,
  countConfirmed,
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
          <Card key={key}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-2">
                <CardDescription>{t(`stats.${key}`)}</CardDescription>
                <span className={`rounded-md p-1.5 ${meta.iconBg} ${meta.iconColor}`}>
                  <Icon className="h-3.5 w-3.5" aria-hidden />
                </span>
              </div>
              <CardTitle className="flex flex-col gap-0.5 text-2xl font-semibold">
                <span>{count}</span>
                <span className="text-xs font-normal text-muted-foreground">{t(`stats.${key}Hint`)}</span>
              </CardTitle>
            </CardHeader>
          </Card>
        );
      })}
    </div>
  );
}
