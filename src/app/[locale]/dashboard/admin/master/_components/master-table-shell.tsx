"use client";

import type { ReactNode } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

/**
 * Pola sama dengan tabel di halaman admin lain (bookings, shipments, dll.):
 * Card + CardContent space-y-4, toolbar tetap tampil saat loading, teks "Memuat…" di dalam kartu.
 */
export function MasterTableShell({
  title,
  description,
  loading,
  toolbar,
  children,
}: {
  title: string;
  description: string;
  loading: boolean;
  toolbar?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card className="min-w-0 overflow-hidden">
      <CardHeader className="space-y-1">
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {toolbar}
        {loading ? (
          <p className="text-sm text-muted-foreground">Memuat…</p>
        ) : (
          <div className="space-y-4">{children}</div>
        )}
      </CardContent>
    </Card>
  );
}
