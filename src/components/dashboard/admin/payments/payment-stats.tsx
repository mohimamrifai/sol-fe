"use client";

import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckCircle2, Clock, AlertCircle, CreditCard } from "lucide-react";
import { PayRow } from "./types";

interface PaymentStatsProps {
  statsRows: PayRow[];
  totalRecords: number;
}

export function PaymentStats({ statsRows, totalRecords }: PaymentStatsProps) {
  const countSuccess = statsRows.filter((p) => {
    const s = String(p.status).toLowerCase();
    return s === "success" || s === "settlement";
  }).length;

  const countPending = statsRows.filter((p) => {
    const s = String(p.status).toLowerCase();
    return s === "pending" || s === "capture" || s === "authorize";
  }).length;

  const countFailed = statsRows.filter((p) => {
    const s = String(p.status).toLowerCase();
    return s === "failure" || s === "deny" || s === "expire" || s === "cancel";
  }).length;

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-2">
            <CardDescription>Berhasil</CardDescription>
            <span className="rounded-md bg-emerald-100 p-1.5 text-emerald-700">
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
            </span>
          </div>
          <CardTitle className="flex flex-col gap-0.5 text-2xl font-semibold">
            <span>{countSuccess}</span>
            <span className="text-xs font-normal text-emerald-600">Sukses</span>
          </CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-2">
            <CardDescription>Menunggu</CardDescription>
            <span className="rounded-md bg-amber-100 p-1.5 text-amber-700">
              <Clock className="h-3.5 w-3.5" aria-hidden />
            </span>
          </div>
          <CardTitle className="flex flex-col gap-0.5 text-2xl font-semibold">
            <span>{countPending}</span>
            <span className="text-xs font-normal text-muted-foreground">Pending</span>
          </CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-2">
            <CardDescription>Gagal / expired</CardDescription>
            <span className="rounded-md bg-red-100 p-1.5 text-red-700">
              <AlertCircle className="h-3.5 w-3.5" aria-hidden />
            </span>
          </div>
          <CardTitle className="flex flex-col gap-0.5 text-2xl font-semibold">
            <span>{countFailed}</span>
            <span className="text-xs font-normal text-muted-foreground">Bermasalah</span>
          </CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-2">
            <CardDescription>Total transaksi</CardDescription>
            <span className="rounded-md bg-violet-100 p-1.5 text-violet-700">
              <CreditCard className="h-3.5 w-3.5" aria-hidden />
            </span>
          </div>
          <CardTitle className="flex flex-col gap-0.5 text-2xl font-semibold">
            <span>{totalRecords}</span>
            <span className="text-xs font-normal text-muted-foreground">semua pembayaran</span>
          </CardTitle>
        </CardHeader>
      </Card>
    </div>
  );
}
