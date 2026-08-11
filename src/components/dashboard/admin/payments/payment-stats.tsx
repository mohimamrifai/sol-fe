"use client";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslations } from "next-intl";
import {
  AlertCircle,
  CheckCircle2,
  CircleDollarSign,
  Clock,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface PaymentStatsProps {
  stats: Record<string, number> | null;
}

export function PaymentStats({ stats }: PaymentStatsProps) {
  const t = useTranslations("AdminPayments");

  const cards: Array<{ key: string; count: number; icon: LucideIcon; color: string }> = [
    { key: "unpaid", count: stats?.unpaid ?? 0, icon: Clock, color: "text-sky-600 bg-sky-50" },
    { key: "partiallyPaid", count: stats?.partially_paid ?? 0, icon: CircleDollarSign, color: "text-amber-600 bg-amber-50" },
    { key: "paid", count: stats?.paid ?? 0, icon: CheckCircle2, color: "text-emerald-600 bg-emerald-50" },
    { key: "overdue", count: stats?.overdue ?? 0, icon: AlertCircle, color: "text-red-600 bg-red-50" },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map(({ key, count, icon: Icon, color }) => (
        <Card key={key}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between gap-2">
              <CardDescription className="font-medium">{t(`stats.${key}` as "stats.unpaid")}</CardDescription>
              <span className={`rounded-md p-1.5 ${color}`}>
                <Icon className="h-3.5 w-3.5" aria-hidden />
              </span>
            </div>
            <CardTitle className="text-2xl font-semibold">{count}</CardTitle>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}
