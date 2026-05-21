"use client";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, CheckCircle2, PackageSearch, Sparkles } from "lucide-react";

interface ShipmentStatsCardsProps {
  countCreated: number;
  countInTransit: number;
  countCompleted: number;
  totalStats: number;
}

export function ShipmentStatsCards({
  countCreated,
  countInTransit,
  countCompleted,
  totalStats,
}: ShipmentStatsCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-2">
            <CardDescription className="font-medium text-zinc-600">Baru dibuat</CardDescription>
            <span className="rounded-md bg-amber-50 p-1.5 text-amber-600 border border-amber-100">
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
            </span>
          </div>
          <CardTitle className="flex flex-col gap-0.5 text-2xl font-bold text-zinc-900">
            <span>{countCreated}</span>
            <span className="text-[10px] font-normal text-muted-foreground uppercase tracking-wider">Status Created</span>
          </CardTitle>
        </CardHeader>
      </Card>
      
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-2">
            <CardDescription className="font-medium text-zinc-600">Dalam perjalanan</CardDescription>
            <span className="rounded-md bg-sky-50 p-1.5 text-sky-600 border border-sky-100">
              <Activity className="h-3.5 w-3.5" aria-hidden />
            </span>
          </div>
          <CardTitle className="flex flex-col gap-0.5 text-2xl font-bold text-zinc-900">
            <span>{countInTransit}</span>
            <span className="text-[10px] font-normal text-muted-foreground uppercase tracking-wider">Departed / Arrived</span>
          </CardTitle>
        </CardHeader>
      </Card>

      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-2">
            <CardDescription className="font-medium text-zinc-600">Selesai</CardDescription>
            <span className="rounded-md bg-emerald-50 p-1.5 text-emerald-600 border border-emerald-100">
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
            </span>
          </div>
          <CardTitle className="flex flex-col gap-0.5 text-2xl font-bold text-emerald-600">
            <span>{countCompleted}</span>
            <span className="text-[10px] font-normal text-emerald-500 uppercase tracking-wider">Completed</span>
          </CardTitle>
        </CardHeader>
      </Card>

      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-2">
            <CardDescription className="font-medium text-zinc-600">Total shipment</CardDescription>
            <span className="rounded-md bg-zinc-900 text-white p-1.5">
              <PackageSearch className="h-3.5 w-3.5" aria-hidden />
            </span>
          </div>
          <CardTitle className="flex flex-col gap-0.5 text-2xl font-bold text-zinc-900">
            <span>{totalStats}</span>
            <span className="text-[10px] font-normal text-muted-foreground uppercase tracking-wider">Semua Data</span>
          </CardTitle>
        </CardHeader>
      </Card>
    </div>
  );
}
