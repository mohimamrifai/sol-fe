"use client";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslations } from "next-intl";
import {
  Ban,
  CheckCircle2,
  CircleDollarSign,
  FilePenLine,
  FileText,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface InvoiceStatsCardsProps {
  draft: number;
  issued: number;
  partiallyPaid: number;
  paid: number;
  cancelled: number;
}

export function InvoiceStatsCards({
  draft,
  issued,
  partiallyPaid,
  paid,
  cancelled,
}: InvoiceStatsCardsProps) {
  const t = useTranslations("AdminInvoices");

  const cards: Array<{ key: string; count: number; icon: LucideIcon; color: string }> = [
    { key: "draft", count: draft, icon: FilePenLine, color: "text-zinc-600 bg-zinc-100" },
    { key: "issued", count: issued, icon: FileText, color: "text-sky-600 bg-sky-50" },
    { key: "partiallyPaid", count: partiallyPaid, icon: CircleDollarSign, color: "text-amber-600 bg-amber-50" },
    { key: "paid", count: paid, icon: CheckCircle2, color: "text-emerald-600 bg-emerald-50" },
    { key: "cancelled", count: cancelled, icon: Ban, color: "text-red-600 bg-red-50" },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {cards.map(({ key, count, icon: Icon, color }) => (
        <Card key={key}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between gap-2">
              <CardDescription className="font-medium">{t(`stats.${key}` as "stats.draft")}</CardDescription>
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
