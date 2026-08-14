"use client";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export type AdminStatCard = {
  key: string;
  label: string;
  value: number | string;
  hint?: string;
  icon: LucideIcon;
  iconClassName?: string;
  onClick?: () => void;
};

type AdminStatsCardsProps = {
  cards: AdminStatCard[];
  className?: string;
  columns?: number;
  loading?: boolean;
};

const COLUMN_CLASS: Record<number, string> = {
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-2 lg:grid-cols-3",
  4: "sm:grid-cols-2 xl:grid-cols-4",
  5: "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5",
  6: "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6",
};

export function AdminStatsCards({
  cards,
  className,
  columns,
  loading = false,
}: AdminStatsCardsProps) {
  const gridClass = className ?? (columns ? COLUMN_CLASS[columns] ?? "sm:grid-cols-2 xl:grid-cols-4" : "sm:grid-cols-2 xl:grid-cols-4");

  if (loading) {
    return (
      <div className={cn("grid gap-4", gridClass)}>
        {Array.from({ length: columns ?? 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="mt-2 h-8 w-16" />
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("grid gap-4", gridClass)}>
      {cards.map(({ key, label, value, hint, icon: Icon, iconClassName = "text-zinc-600 bg-zinc-100", onClick }) => {
        const content = (
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between gap-2">
              <CardDescription className="font-medium">{label}</CardDescription>
              <span className={cn("rounded-md p-1.5", iconClassName)}>
                <Icon className="h-3.5 w-3.5" aria-hidden />
              </span>
            </div>
            <CardTitle className="flex flex-col gap-0.5 text-2xl font-semibold">
              <span>{value}</span>
              {hint ? <span className="text-xs font-normal text-muted-foreground">{hint}</span> : null}
            </CardTitle>
          </CardHeader>
        );

        if (onClick) {
          return (
            <button key={key} type="button" onClick={onClick} className="text-left">
              <Card className="h-full transition-colors hover:bg-muted/40">{content}</Card>
            </button>
          );
        }

        return <Card key={key}>{content}</Card>;
      })}
    </div>
  );
}
