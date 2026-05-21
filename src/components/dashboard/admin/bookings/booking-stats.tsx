"use client";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, ClipboardClock, ClipboardList, FilePenLine } from "lucide-react";

interface BookingStatsProps {
  countDraft: number;
  countSubmitted: number;
  countApproved: number;
  totalStats: number;
}

export function BookingStats({
  countDraft,
  countSubmitted,
  countApproved,
  totalStats,
}: BookingStatsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-2">
            <CardDescription>Draft</CardDescription>
            <span className="rounded-md bg-slate-100 p-1.5 text-slate-700">
              <FilePenLine className="h-3.5 w-3.5" aria-hidden />
            </span>
          </div>
          <CardTitle className="flex flex-col gap-0.5 text-2xl font-semibold">
            <span>{countDraft}</span>
            <span className="text-xs font-normal text-muted-foreground">belum dikirim / revisi</span>
          </CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-2">
            <CardDescription>Menunggu persetujuan</CardDescription>
            <span className="rounded-md bg-amber-100 p-1.5 text-amber-700">
              <ClipboardClock className="h-3.5 w-3.5" aria-hidden />
            </span>
          </div>
          <CardTitle className="flex flex-col gap-0.5 text-2xl font-semibold">
            <span>{countSubmitted}</span>
            <span className="text-xs font-normal text-muted-foreground">perlu approve / tolak</span>
          </CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-2">
            <CardDescription>Disetujui</CardDescription>
            <span className="rounded-md bg-emerald-100 p-1.5 text-emerald-700">
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
            </span>
          </div>
          <CardTitle className="flex flex-col gap-0.5 text-2xl font-semibold">
            <span>{countApproved}</span>
            <span className="text-xs font-normal text-emerald-600">siap konversi ke shipment</span>
          </CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-2">
            <CardDescription>Total booking</CardDescription>
            <span className="rounded-md bg-sky-100 p-1.5 text-sky-700">
              <ClipboardList className="h-3.5 w-3.5" aria-hidden />
            </span>
          </div>
          <CardTitle className="flex flex-col gap-0.5 text-2xl font-semibold">
            <span>{totalStats}</span>
            <span className="text-xs font-normal text-muted-foreground">semua booking</span>
          </CardTitle>
        </CardHeader>
      </Card>
    </div>
  );
}
