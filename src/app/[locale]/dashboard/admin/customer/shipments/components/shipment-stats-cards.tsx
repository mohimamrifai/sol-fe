"use client";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Ban, CheckCircle2, PackageSearch, Sparkles, Truck } from "lucide-react";
import { useTranslations } from "next-intl";

interface ShipmentStatsCardsProps {
  planning: number;
  readyForDeparture: number;
  inTransit: number;
  completed: number;
  cancelled: number;
}

export function ShipmentStatsCards({
  planning,
  readyForDeparture,
  inTransit,
  completed,
  cancelled,
}: ShipmentStatsCardsProps) {
  const t = useTranslations("AdminShipments");

  const cards = [
    { label: t("stats.planning"), count: planning, icon: Sparkles, color: "text-amber-600 bg-amber-50" },
    { label: t("stats.readyForDeparture"), count: readyForDeparture, icon: PackageSearch, color: "text-sky-600 bg-sky-50" },
    { label: t("stats.inTransit"), count: inTransit, icon: Truck, color: "text-violet-600 bg-violet-50" },
    { label: t("stats.completed"), count: completed, icon: CheckCircle2, color: "text-emerald-600 bg-emerald-50" },
    { label: t("stats.cancelled"), count: cancelled, icon: Ban, color: "text-red-600 bg-red-50" },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {cards.map(({ label, count, icon: Icon, color }) => (
        <Card key={label} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between gap-2">
              <CardDescription className="font-medium">{label}</CardDescription>
              <span className={`rounded-md p-1.5 ${color}`}>
                <Icon className="h-3.5 w-3.5" aria-hidden />
              </span>
            </div>
            <CardTitle className="text-2xl font-bold">{count}</CardTitle>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}
