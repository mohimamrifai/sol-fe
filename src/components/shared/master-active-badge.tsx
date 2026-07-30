"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const activeClass =
  "border-emerald-200/90 bg-emerald-50 text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-950/45 dark:text-emerald-300";
const inactiveClass =
  "border-slate-200/90 bg-slate-100 text-slate-700 dark:border-slate-600 dark:bg-slate-800/55 dark:text-slate-300";

/** Badge Aktif/Nonaktif selaras dengan pola badge status di halaman lain. */
export function MasterActiveBadge({ active }: { active: boolean }) {
  return (
    <Badge variant="outline" className={cn("font-normal", active ? activeClass : inactiveClass)}>
      {active ? "Aktif" : "Nonaktif"}
    </Badge>
  );
}
